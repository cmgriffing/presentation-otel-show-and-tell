import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

console.log("Inside instrumentation");

const instrumentations = getNodeAutoInstrumentations({
  "@opentelemetry/instrumentation-pino": {
    logHook: (span, record, level) => {
      console.log("PINO logHook");
      record["resource.service.name"] = "next-app";
      span.setAttribute("NEXT_LOG_KEY", "NEXT_LOG_VALUE");

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
  // load custom configuration for http instrumentation
  "@opentelemetry/instrumentation-http": {
    applyCustomAttributesOnSpan: (span) => {
      span.setAttribute("foo2", "bar2");
    },
  },
  "@opentelemetry/instrumentation-fs": { enabled: false },
});

registerInstrumentations({
  instrumentations,
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "next-app",
  }),
  // logRecordProcessor: Log

  // traceExporter: new ConsoleSpanExporter(),

  // spanProcessor:
  // new SimpleSpanProcessor(
  //   new OTLPTraceExporter({
  //     // url: "http://localhost:4318",
  //   })
  // ),

  instrumentations,
});

sdk.start();

// import { trace } from "next/dist/trace";
// import pino from "pino";
// const span = trace("foo");

import { trace } from "@opentelemetry/api";

let span = trace.getActiveSpan();

if (!span) {
  const tracer = trace.getTracer("next-app");
  console.log({ tracer });
}

console.log({ span });

const pino = require("pino");

const logger = pino();

logger.info("LOGGING");

span?.end();

// const tracer = trace.getTracer("example-tracer");
// const span = tracer.startSpan("example-span");
// const logger = diag.createComponentLogger({ namespace: "foo" });
// // const context = diag.setSpan(diag.context.active(), span);

// logger.warn("HMMMMMMM");

// // Log a message within the span
// // diag.debug("This is a debug message", context);
// // diag.info("This is an info message", context);
// // diag.warn("This is a warning message", context);
// // diag.error("This is an error message", context);

// // End the span
// span.end();

for (const event of ["beforeExit", "exit", "SIGABRT", "SIGTERM", "SIGINT"]) {
  process.on(event, async () => {
    console.log("FLUSHING in event:", event);

    const provider = trace.getTracerProvider() as BasicTracerProvider;

    provider.getActiveSpanProcessor()?.forceFlush();
  });
}
