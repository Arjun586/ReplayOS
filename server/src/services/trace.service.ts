// Persist traces and spans for distributed tracing
import { prisma } from "../lib/prisma"
import type { IngestTraceInput } from "../validations/trace.schema"

export const ingestTrace = async (payload: IngestTraceInput) => {
    const projectExists = await prisma.project.findUnique({
        where: { id: payload.projectId }
    })

    if (!projectExists) {
        throw new Error("Project not found")
    }

    const trace = await prisma.trace.upsert({
        where: { traceId: payload.traceId },
        update: {
            rootService: payload.rootService,
            rootOperation: payload.rootOperation,
            status: payload.status,
            startedAt: payload.startedAt,
            endedAt: payload.endedAt ?? null
        },
        create: {
            traceId: payload.traceId,
            projectId: payload.projectId,
            rootService: payload.rootService,
            rootOperation: payload.rootOperation,
            status: payload.status,
            startedAt: payload.startedAt,
            endedAt: payload.endedAt ?? null
        }
    })

    await prisma.span.deleteMany({
        where: { traceRefId: trace.id }
    })

    await prisma.span.createMany({
        data: payload.spans.map((span) => ({
            spanId: span.spanId,
            parentSpanId: span.parentSpanId ?? null,
            traceRefId: trace.id,
            serviceName: span.serviceName,
            operationName: span.operationName,
            status: span.status ?? null,
            errorMessage: span.errorMessage ?? null,
            startTime: span.startTime,
            endTime: span.endTime ?? null,
            durationMs: span.endTime
                ? Math.max(0, new Date(span.endTime).getTime() - new Date(span.startTime).getTime())
                : null
        }))
    })

    return prisma.trace.findUnique({
        where: { id: trace.id },
        include: {
            spans: {
                orderBy: { startTime: "asc" }
            }
        }
    })
}