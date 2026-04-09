// Validate trace ingestion payloads for Phase 4
import { z } from "zod"

const spanSchema = z.object({
    spanId: z.string().min(1, "spanId is required"),
    parentSpanId: z.string().min(1).nullable().optional(),
    serviceName: z.string().min(1, "serviceName is required"),
    operationName: z.string().min(1, "operationName is required"),
    status: z.string().optional(),
    errorMessage: z.string().nullable().optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date().nullable().optional()
})


// custom flat JSON
export const ingestTraceSchema = z.object({
    traceId: z.string().min(1, "traceId is required"),
    projectId: z.string().uuid("Invalid project ID"),
    rootService: z.string().optional(),
    rootOperation: z.string().optional(),
    status: z.string().optional(),
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date().nullable().optional(),
    spans: z.array(spanSchema).min(1, "At least one span is required")
})


// OpenTelemetry Key-Value Pair (Attributes)
const KeyValueSchema = z.object({
    key: z.string(),
    value: z.object({
        stringValue: z.string().optional(),
        intValue: z.number().optional(),
        boolValue: z.boolean().optional(),
    }).optional()
});

// Standard OTLP Span Object
const SpanSchema = z.object({
    traceId: z.string(),
    spanId: z.string(),
    parentSpanId: z.string().optional().nullable(),
    name: z.string(), // Operation Name
    kind: z.number().optional(),
    startTimeUnixNano: z.string(),
    endTimeUnixNano: z.string(),
    attributes: z.array(KeyValueSchema).optional().default([]),
    status: z.object({
        code: z.number().optional() // 0 = UNSET, 1 = OK, 2 = ERROR
    }).optional()
});

// Resource Spans (Contains Service Name & its Spans)
const ResourceSpansSchema = z.object({
    resource: z.object({
        attributes: z.array(KeyValueSchema).optional().default([])
    }).optional(),
    scopeSpans: z.array(
        z.object({
            spans: z.array(SpanSchema)
        })
    )
});

// The Full OTLP Export Trace Service Request
// Real-world Standard OTLP JSON.
export const OTLPTraceExportSchema = z.object({
    resourceSpans: z.array(ResourceSpansSchema)
});

export type IngestTraceInput = z.infer<typeof ingestTraceSchema>
export type IngestSpanInput = z.infer<typeof spanSchema>