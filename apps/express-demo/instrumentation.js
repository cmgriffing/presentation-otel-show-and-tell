const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const { Resource } = require("@opentelemetry/resources");
const {
  SEMRESATTRS_SERVICE_NAME,
} = require("@opentelemetry/semantic-conventions");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-node");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const { AlwaysOnSampler } = require("@opentelemetry/sdk-trace-base");

try {
  console.log("Inside instrumentation");
  const sampler = new AlwaysOnSampler();

  const instrumentations = getNodeAutoInstrumentations({
    "@opentelemetry/instrumentation-pino": {
      logHook: (span, record, level) => {
        console.log("PINO logHook", record);
        record["resource.service.name"] = "next-app";
        span.setAttribute("EXAMPLE_LOG_KEY", "EXAMPLE_LOG_VALUE");

        // @ts-ignore
        const attrs = span.attributes;
        for (const [key, value] of Object.entries(attrs)) {
          record[key] = value;
        }
      },
      // Log span context under custom keys
      // This is optional, and will default to "trace_id", "span_id" and "trace_flags" as the keys
      logKeys: {
        traceId: "traceId",
        spanId: "spanId",
        traceFlags: "traceFlags",
      },
    },
    "@opentelemetry/instrumentation-express": {
      applyCustomAttributesOnSpan: (span) => {
        console.log("INSIDE EXPRESS SPAN");
        span.setAttribute("EXPRESS_LOG_KEY", "EXPRESS_LOG_VALUE");
      },
    },
    // load custom configuration for http instrumentation
    "@opentelemetry/instrumentation-http": {
      applyCustomAttributesOnSpan: (span) => {
        span.setAttribute("foo2", "bar2");
      },
    },
    "@opentelemetry/instrumentation-fs": { enabled: false },
  });

  const sdk = new NodeSDK({
    autoDetectResources: true,
    // resource: new Resource({
    //   [SEMRESATTRS_SERVICE_NAME]: "express-app",
    // }),
    // spanProcessor: new SimpleSpanProcessor(
    //   new OTLPTraceExporter({
    //     // url: "http://localhost:4318",
    //   })
    // ),
    instrumentations,
    sampler,
  });

  registerInstrumentations({
    instrumentations,
  });

  sdk.start();
} catch (e) {
  console.log("Error launching telemetry express app", e);
}
