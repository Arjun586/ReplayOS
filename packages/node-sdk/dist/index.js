"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayOS = void 0;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
exports.ReplayOS = {
    init: (options) => {
        const url = options.ingestUrl || 'http://localhost:5000/api/traces/v1/traces';
        const exporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
            url: url,
            headers: {
                'x-project-id': options.projectId,
                'x-ingest-key': options.ingestKey
            }
        });
        const sdk = new sdk_node_1.NodeSDK({
            traceExporter: exporter,
            serviceName: options.serviceName
        });
        sdk.start();
        console.log(`[ReplayOS] Tracing initialized for ${options.serviceName}`);
    }
};
