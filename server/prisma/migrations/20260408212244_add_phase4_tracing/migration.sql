-- AlterTable
ALTER TABLE "LogEvent" ADD COLUMN     "spanRefId" TEXT,
ADD COLUMN     "traceRefId" TEXT;

-- CreateTable
CREATE TABLE "Trace" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "rootService" TEXT,
    "rootOperation" TEXT,
    "status" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Span" (
    "id" TEXT NOT NULL,
    "spanId" TEXT NOT NULL,
    "parentSpanId" TEXT,
    "traceRefId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "operationName" TEXT NOT NULL,
    "status" TEXT,
    "errorMessage" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Span_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trace_traceId_key" ON "Trace"("traceId");

-- CreateIndex
CREATE INDEX "Trace_projectId_idx" ON "Trace"("projectId");

-- CreateIndex
CREATE INDEX "Trace_startedAt_idx" ON "Trace"("startedAt");

-- CreateIndex
CREATE INDEX "Trace_status_idx" ON "Trace"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Span_spanId_key" ON "Span"("spanId");

-- CreateIndex
CREATE INDEX "Span_traceRefId_idx" ON "Span"("traceRefId");

-- CreateIndex
CREATE INDEX "Span_parentSpanId_idx" ON "Span"("parentSpanId");

-- CreateIndex
CREATE INDEX "Span_serviceName_idx" ON "Span"("serviceName");

-- CreateIndex
CREATE INDEX "Span_operationName_idx" ON "Span"("operationName");

-- CreateIndex
CREATE INDEX "Span_status_idx" ON "Span"("status");

-- CreateIndex
CREATE INDEX "LogEvent_incidentId_idx" ON "LogEvent"("incidentId");

-- CreateIndex
CREATE INDEX "LogEvent_correlationId_idx" ON "LogEvent"("correlationId");

-- CreateIndex
CREATE INDEX "LogEvent_traceRefId_idx" ON "LogEvent"("traceRefId");

-- CreateIndex
CREATE INDEX "LogEvent_spanRefId_idx" ON "LogEvent"("spanRefId");

-- AddForeignKey
ALTER TABLE "LogEvent" ADD CONSTRAINT "LogEvent_traceRefId_fkey" FOREIGN KEY ("traceRefId") REFERENCES "Trace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEvent" ADD CONSTRAINT "LogEvent_spanRefId_fkey" FOREIGN KEY ("spanRefId") REFERENCES "Span"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Span" ADD CONSTRAINT "Span_traceRefId_fkey" FOREIGN KEY ("traceRefId") REFERENCES "Trace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
