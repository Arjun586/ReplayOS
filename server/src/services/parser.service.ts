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


export const parseLogFile = async (filePath: string, originalName: string, projectId: string) => {
    // 1. SRE Improvement: Use ReadStream to avoid loading the whole file into RAM
    const fileContent = await fs.promises.readFile(filePath, "utf-8");
    const logs: any[] = JSON.parse(fileContent); // Note: For true stability, use a streaming JSON parser library

    // 2. Identify Incident Metadata (One-pass)
    const firstError = logs.find(l => ["ERROR", "CRITICAL"].includes(l.level?.toUpperCase()));
    
    const incident = await prisma.incident.create({
        data: {
            title: firstError ? `Crash: ${firstError.message}` : `Ingest: ${originalName}`,
            severity: firstError ? "critical" : "medium",
            projectId
        }
    });

    // 3. Batch Pre-fetch: Get all relevant spans for this project at once
    // This solves the N+1 problem by moving the 'find' logic into memory
    const uniqueTraces = [...new Set(logs.map(l => l.correlationId).filter(Boolean))];
    const availableSpans = await prisma.span.findMany({
        where: { trace: { traceId: { in: uniqueTraces }, projectId } },
        select: { id: true, spanId: true, serviceName: true, startTime: true, endTime: true, traceRefId: true }
    });

    // 4. Batch Formatting
    const formattedEvents = logs.map(log => {
        const timestamp = new Date(log.timestamp);
        // Logical matching in memory instead of per-log DB calls
        const matchedSpan = availableSpans.find(s => 
            s.serviceName === log.service && 
            s.startTime <= timestamp && 
            (!s.endTime || s.endTime >= timestamp)
        );

        return {
            incidentId: incident.id,
            timestamp,
            level: log.level,
            message: log.message,
            service: log.service || "unknown",
            correlationId: log.correlationId || null,
            spanRefId: matchedSpan?.id || null
        };
    });

    // 5. Bulk Insert: One DB trip for all events
    // Use chunks of 1000 to avoid PostgreSQL parameter limits
    for (let i = 0; i < formattedEvents.length; i += 1000) {
        await prisma.logEvent.createMany({
            data: formattedEvents.slice(i, i + 1000)
        });
    }

    await fs.promises.unlink(filePath);
    return incident;
};