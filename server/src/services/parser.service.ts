// server/src/services/parser.service.ts
import fs from "fs"
import { prisma } from "../lib/prisma"
import { ingestTrace } from "./trace.service" //Import ingestTrace

interface RawLog {
    timestamp: string
    level: string
    message: string
    service?: string
    correlationId?: string
    traceData?: { // Optional trace data for Rich JSON uploads
        spanId: string;
        parentSpanId?: string | null;
        operationName: string;
        durationMs?: number;
        status?: string;
    }
}

const findBestSpanForLog = async (
    traceRefId: string,
    serviceName: string | undefined,
    timestamp: Date
) => {
    if (!serviceName) {
        return null
    }

    const candidateSpans = await prisma.span.findMany({
        where: {
            traceRefId,
            serviceName
        },
        orderBy: {
            startTime: "asc"
        }
    })

    if (candidateSpans.length === 0) {
        return null
    }

    const matchingWindowSpan = candidateSpans.find((span) => {
        if (!span.endTime) {
            return span.startTime <= timestamp
        }

        return span.startTime <= timestamp && span.endTime >= timestamp
    })

    if (matchingWindowSpan) {
        return matchingWindowSpan
    }

    let nearestSpan = candidateSpans[0]
    let smallestDistance = Math.abs(candidateSpans[0].startTime.getTime() - timestamp.getTime())

    for (const span of candidateSpans) {
        const distance = Math.abs(span.startTime.getTime() - timestamp.getTime())

        if (distance < smallestDistance) {
            nearestSpan = span
            smallestDistance = distance
        }
    }

    return nearestSpan
}

export const parseLogFile = async (
    filePath: string,
    originalName: string,
    projectId: string
) => {
    try {
        const fileContent = await fs.promises.readFile(filePath, "utf-8")
        const logs: RawLog[] = JSON.parse(fileContent)

        if (!Array.isArray(logs)) {
            throw new Error("Log file must contain a JSON array")
        }

        const firstError = logs.find((log) => {
            return ["ERROR", "CRITICAL", "FATAL"].includes(String(log.level).toUpperCase())
        })

        const incidentTitle = firstError
            ? `Crash: ${firstError.message}`
            : `Investigation: ${originalName}`

        const incident = await prisma.incident.create({
            data: {
                title: incidentTitle,
                description: `Auto-generated from uploaded log file: ${originalName}`,
                severity: firstError ? "critical" : "medium",
                projectId
            }
        })

        // ============================================================================
        // 🚀 NEW PHASE 4 LOGIC: Auto-Ingest Traces from "Rich JSON" uploads
        // ============================================================================
        const tracesToBuild = new Map<string, any>();

        for (const log of logs) {
            // Check if this log has trace context attached
            if (log.correlationId && log.traceData) {
                if (!tracesToBuild.has(log.correlationId)) {
                    tracesToBuild.set(log.correlationId, {
                        traceId: log.correlationId,
                        projectId: projectId,
                        spans: [],
                        startedAt: new Date(log.timestamp),
                        endedAt: new Date(log.timestamp),
                        status: 'OK',
                        rootService: 'unknown',
                        rootOperation: 'unknown'
                    });
                }

                const traceObj = tracesToBuild.get(log.correlationId);
                const spanStart = new Date(log.timestamp);
                const spanEnd = new Date(spanStart.getTime() + (log.traceData.durationMs || 0));

                // Expand trace boundaries
                if (spanStart < traceObj.startedAt) traceObj.startedAt = spanStart;
                if (spanEnd > traceObj.endedAt) traceObj.endedAt = spanEnd;
                if (log.traceData.status === 'ERROR' || log.level === 'ERROR') traceObj.status = 'ERROR';

                // If it has no parent, we assume it's the root of the trace
                if (!log.traceData.parentSpanId) {
                    traceObj.rootService = log.service || 'unknown';
                    traceObj.rootOperation = log.traceData.operationName || 'unknown';
                }

                traceObj.spans.push({
                    spanId: log.traceData.spanId,
                    parentSpanId: log.traceData.parentSpanId || null,
                    serviceName: log.service || 'unknown',
                    operationName: log.traceData.operationName || 'unknown',
                    status: log.traceData.status || 'OK',
                    startTime: spanStart,
                    endTime: spanEnd,
                    durationMs: log.traceData.durationMs || 0
                });
            }
        }

        // Save the traces to the DB before linking logs
        for (const tracePayload of Array.from(tracesToBuild.values())) {
            try {
                await ingestTrace(tracePayload);
            } catch (err) {
                console.error(`Failed to auto-ingest trace ${tracePayload.traceId} from upload:`, err);
            }
        }
        // ============================================================================

        const uniqueCorrelationIds = Array.from(
            new Set(
                logs
                    .map((log) => log.correlationId)
                    .filter((value): value is string => Boolean(value))
            )
        )

        // 🚀 Now, when it searches for matchedTraces, it will find the ones we JUST created above!
        const matchedTraces = uniqueCorrelationIds.length
            ? await prisma.trace.findMany({
                where: {
                    projectId,
                    traceId: {
                        in: uniqueCorrelationIds
                    }
                }
            })
            : []

        const traceMap = new Map(matchedTraces.map((trace) => [trace.traceId, trace]))

        const formattedEvents = []

        for (const log of logs) {
            const parsedTimestamp = new Date(log.timestamp)
            const matchedTrace = log.correlationId ? traceMap.get(log.correlationId) ?? null : null

            let matchedSpanId: string | null = null

            if (matchedTrace) {
                const matchedSpan = await findBestSpanForLog(
                    matchedTrace.id,
                    log.service,
                    parsedTimestamp
                )

                matchedSpanId = matchedSpan?.id ?? null
            }

            formattedEvents.push({
                incidentId: incident.id,
                timestamp: parsedTimestamp,
                level: log.level,
                message: log.message,
                service: log.service ?? "unknown",
                correlationId: log.correlationId ?? null,
                traceRefId: matchedTrace?.id ?? null,
                spanRefId: matchedSpanId
            })
        }

        await prisma.logEvent.createMany({
            data: formattedEvents
        })

        await fs.promises.unlink(filePath)

        return incident
    } catch (error) {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath)
        }

        console.error("Error parsing log file:", error)
        throw error
    }
}