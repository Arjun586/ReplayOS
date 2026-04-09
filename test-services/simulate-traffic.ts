// Basic startup check
console.log("Hello, Node is working!");

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes, defaultResource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, SpanStatusCode, context, diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Enable diagnostic logging
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Configuration
const PROJECT_ID = "c6abb33e-82dc-45f5-bb92-4a3524c64699";
const INGEST_KEY = "d4f105be-5998-41ef-b5b2-5f5b15bffa51";

const exporter = new OTLPTraceExporter({
    url: "http://localhost:5000/api/traces/v1/traces",
    headers: {
        'x-project-id': PROJECT_ID,
        'x-ingest-key': INGEST_KEY
    }
});

const provider = new NodeTracerProvider({
    resource: defaultResource().merge(resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'checkout-service',
        [ATTR_SERVICE_VERSION]: '1.0.0',
    })),
    spanProcessors: [
        new SimpleSpanProcessor(exporter),
        new SimpleSpanProcessor(new ConsoleSpanExporter())
    ]
});

// Register only once
provider.register();

const tracer = trace.getTracer('checkout-tracer');

console.log("🚀 Starting dummy traffic simulation...");

async function simulateCheckout() {
    const rootSpan = tracer.startSpan('POST /checkout');

    console.log("📦 Processing checkout...");
    await new Promise(resolve => setTimeout(resolve, 100));

    const rootContext = trace.setSpan(context.active(), rootSpan);

    const authSpan = tracer.startSpan('verify_token', {
        attributes: { 'user.id': 'usr_998' }
    }, rootContext);

    await new Promise(resolve => setTimeout(resolve, 50));
    authSpan.setStatus({ code: SpanStatusCode.OK });
    authSpan.end();

    const paymentSpan = tracer.startSpan('charge_credit_card', {
        attributes: { 'payment.amount': 150.00, 'payment.currency': 'USD' }
    }, rootContext);

    await new Promise(resolve => setTimeout(resolve, 300));

    console.log("❌ Payment failed! Gateway timeout.");
    paymentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Stripe API timeout after 300ms"
    });
    paymentSpan.recordException(new Error("Stripe API timeout after 300ms"));
    paymentSpan.end();

    rootSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: "Checkout failed due to payment error"
    });
    rootSpan.end();

    console.log("✅ Trace generation complete. Sending to Failure Replay backend...");

    await provider.forceFlush();
    console.log("📤 Traces exported successfully!");
}

simulateCheckout().catch(console.error);