"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// Basic startup check
console.log("Hello, Node is working!");
var sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
var sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
var resources_1 = require("@opentelemetry/resources");
var semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
var exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
var api_1 = require("@opentelemetry/api");
// Enable diagnostic logging
api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.INFO);
// Configuration
var PROJECT_ID = "c6abb33e-82dc-45f5-bb92-4a3524c64699";
var INGEST_KEY = "d4f105be-5998-41ef-b5b2-5f5b15bffa51";
var exporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
    url: "http://localhost:5000/api/traces/v1/traces",
    headers: {
        'x-project-id': PROJECT_ID,
        'x-ingest-key': INGEST_KEY
    }
});
var provider = new sdk_trace_node_1.NodeTracerProvider({
    resource: (0, resources_1.defaultResource)().merge((0, resources_1.resourceFromAttributes)((_a = {},
        _a[semantic_conventions_1.ATTR_SERVICE_NAME] = 'checkout-service',
        _a[semantic_conventions_1.ATTR_SERVICE_VERSION] = '1.0.0',
        _a))),
    spanProcessors: [
        new sdk_trace_base_1.SimpleSpanProcessor(exporter),
        new sdk_trace_base_1.SimpleSpanProcessor(new sdk_trace_base_1.ConsoleSpanExporter())
    ]
});
// Register only once
provider.register();
var tracer = api_1.trace.getTracer('checkout-tracer');
console.log("🚀 Starting dummy traffic simulation...");
function simulateCheckout() {
    return __awaiter(this, void 0, void 0, function () {
        var rootSpan, rootContext, authSpan, paymentSpan;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rootSpan = tracer.startSpan('POST /checkout');
                    console.log("📦 Processing checkout...");
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 1:
                    _a.sent();
                    rootContext = api_1.trace.setSpan(api_1.context.active(), rootSpan);
                    authSpan = tracer.startSpan('verify_token', {
                        attributes: { 'user.id': 'usr_998' }
                    }, rootContext);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 50); })];
                case 2:
                    _a.sent();
                    authSpan.setStatus({ code: api_1.SpanStatusCode.OK });
                    authSpan.end();
                    paymentSpan = tracer.startSpan('charge_credit_card', {
                        attributes: { 'payment.amount': 150.00, 'payment.currency': 'USD' }
                    }, rootContext);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 300); })];
                case 3:
                    _a.sent();
                    console.log("❌ Payment failed! Gateway timeout.");
                    paymentSpan.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: "Stripe API timeout after 300ms"
                    });
                    paymentSpan.recordException(new Error("Stripe API timeout after 300ms"));
                    paymentSpan.end();
                    rootSpan.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: "Checkout failed due to payment error"
                    });
                    rootSpan.end();
                    console.log("✅ Trace generation complete. Sending to Failure Replay backend...");
                    return [4 /*yield*/, provider.forceFlush()];
                case 4:
                    _a.sent();
                    console.log("📤 Traces exported successfully!");
                    return [2 /*return*/];
            }
        });
    });
}
simulateCheckout().catch(console.error);
