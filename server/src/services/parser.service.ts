// Parse uploaded logs and correlate them with traces and spans
import fs from "fs"
import { prisma } from "../lib/prisma"

interface RawLog {
    timestamp: string
    level: string
    message: string
    service?: string
    correlationId?: string
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

        const uniqueCorrelationIds = Array.from(
            new Set(
                logs
                    .map((log) => log.correlationId)
                    .filter((value): value is string => Boolean(value))
            )
        )

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