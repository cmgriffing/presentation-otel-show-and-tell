# Opentelemetry and how you can use it with your Next.js apps (Working title)

OpenTelemetry is a really cool project from the CNCF. In this post, we will cover the origins of OpenTelemetry, also known as OTEL, as well as what it looks like to spin up your own collector and wire that into Next.js. By the end of it, you should have a pretty good understanding about why you should be using OpenTelemetry and how you can use Highlight to simplify the process while also getting some things that are not currently supported out of the box.

If you would prefer a video of this content, please feel free to check out our YouTube video about the subject.

{{YOUTUBE LINK OR EMBED GOES HERE}}

## What's Missing?

There are several things that we won't be addressing in this post for the sake of brevity.

- Scaling the collector - We haven't explained what the collector even is, yet. Butthe scope of this post won't cover how you might want to prepare your collector for production-level traffic and usage.
- Client Setup - Client-side telemetry is still very experimental and most OTEL-compatible services implement their own custom way of handling this. If you are interested in participating in the discovery process please checkout [this link](LINK_NEEDED).
- User Sessions - OpenTelemetry has the idea of spans and traces, but those are often just a part of a user's session on your site. Highlight does a great job of grouping your traces under one session so that you can understand a user's flow through your whole site rather than just a page or request at a time.
- Logging - The Node SDK lists logs as still being in development, so we will not be digging into them in this article.

## OpenTelemetry (OTEL) Basics

OpenTelemetry actually started as a combination of two other CNCF projects, OpenTracing and OpenCensus. As an Incubator project, it is considered stable and used successfully in production environments.

When we talk about "telemetry" in the context of OpenTelemetry, we really mean these core concepts:

- Traces - The "big picture" of a request to your application. Traces are comprised of spans and can help you understand a monolithic application or a mesh of microservices.
- Metrics - A measurement of availability and performance. Metrics help you understand the user experience of your application. This could include measurements like CPU, RAM, and network latency.
- Logs - Timestamped text records with attached metadata. According to the OpenTelemetry website, logs are "any data that is not part of a distributed trace or a metric is a log."
- Baggage - Contextual information passed between spans. Baggage is useful for passing useful information around such as ClientIDs or user/customer IDs.

## Why OpenTelemetry

You might be wondering why OpenTelemetry was created in the first place. Well, the first step is to realize why we need telemetry at all. Most APIs and backend services are a black box. We are only able to see the inputs and outputs. Telemetry allows us to know what is happening on the inside.

The next thing to understand is the world of telemetry before OpenTelemetry existed. Many solutions that don't interoperate well together. This caused a lot of vendor lock-in. Migrating from one provider to another often involved a lot of custom work. This is work that is not part of your core application and, as such, takes away from the time in which you can ship features and bigfixes to your users.

## CNCF?

Earlier we mentioned the CNCF, the Cloud Native Computing Foundation, which is a subsidiary of the Linux Foundation. They are the stewards of the OpenTelemetry project among other things, including Jaeger, containerd, CoreDNS, Helm, Kubernetes, and more.

Started in 2015, OpenTracing was one of their first projects and it consisted of consistent, expressive, vendor-neutral APIs. In 2017, they adopted OpenCensus from Google which was a set of tools/libraries built around tracing and monitoring for various languages. By 2019, the two projects had merged, forming OpenTelemetry. All in all, the OpenTelemtery project is in good hands and has plenty of longevity in it with companies like Google, Red Hat, Twitter, Intel, and IBM backing the CNCF.

## More Terms

Before we can really dig into the Next.js specifics, we need to understand a few more terms.

- OTLP (OpenTelemetry Protocol): A specification and set of Protobuf definitions that is used to send data to an OpenTelemetry Collector, typically using gRPC.
- Collector: A vendor-agnostic way to receive, process, and export telemetry data. It's not 100% necessary but can help you solve some interesting problems you might run into such as retries, batching, encryption, and sensitive data filtering.
- Instrumentation: The wiring of traces, metrics, and logs to your application, libraries, and platforms. There are a few different types of instrumentation.
  - Automatic or "zero-code" solutions: This would be something like the [auto-instrumentations-node](https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node) package. It allows you to instrument nodejs libraries like http as well as other packages like Express, Hapi, Fastify, and the aws-sdk without wiring them up yourself.
  - Custom or "code-based" solutions: You would use something like the OpenTelemetry API and SDK to instrument your application's logic.
  - Libraries: Many libraries are not instrumented by default, so there is often a need for a separate library to do so. This can be done using wrappers, or library-specific callbacks or sometimes for wrapping proprietary telemetry into the OpenTelemetry model.

## Setting Up the Collector

Even though the collector is not 100% necessary, we are going to go through a bit of the process for setting one up. The first step is heading to the [github repo](https://github.com/open-telemetry/opentelemetry-collector) and downloading the latest release. However, it's 264MB, so you probably want to gitignore it and have a script to fetch it. It can be used as a standalone application or as a library in your own code.

One thing to be aware of is that Vercel has created a [docker-based dev environment](https://github.com/vercel/opentelemetry-collector-dev-setup) to get up and running quickly. In addition to the collector, the dev environment also spins up instances of Jaeger, Zipkin, and Prometheus. This can be nice to get you started, but setting up your own collector will be a better learning experience.

To configure the collector there are 5 major things to consider:

- Receivers
- Processors
- Extensions
- Exporters
- Services

There is also the concept of Connectors which join 2 pipelines. We won't be digging into them much in this article.

### Receivers

Receivers are the way that the collector is sent data from your applications and services. You will most likely just end up using the otlp receiver with the grpc and http endpoints.

Example code:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: localhost:4317
      http:
        endpoint: localhost:4318
```

### Processors

Processors are a means of modifying the events that the collector takes in before sending them off to an appropriate exporter. Some of this could be batching events together to prevent you from being rate-limited by a provider. Other processors might include filtering for specific metrics or limiting the amount of memory the collector allows. One important thing to remember is that defining them in the config does not enable them. You would still need to add them to the appropriate pipeline of a service.

Example code:

```yaml
processors:
  batch:
  memory_limiter:
    # 75% of maximum memory up to 2G
    limit_mib: 1536
    # 25% of limit up to 2G
    spike_limit_mib: 512
    check_interval: 5s
```

### Extensions

Extensions are extra config that helps the Collector do things not directly related to telemetry data. You might use an extension to monitor the health of the collector itself or network discovery. One usecase I found for them was being a place to define reusable auth config for services like Grafana.

Example code:

```yaml
extensions:
  basicauth/prometheus:
    client_auth:
      username: ${env:PROMETHEUS_USER}
      password: ${env:PROMETHEUS_PASS}
```

### Exporters

Exporters are what allow the collector to send data to various providers or endpoints such as Jaeger, Kafka, or even just to a local file. They can be push or pull based depending on the provider. The exporter config will often be a place to set auth related values. You need at least one exporter in a Collector config.

Example code:

```yaml
exporters:
  debug:
    verbosity: detailed

  otlp:
    endpoint: tempo-prod-04-prod-us-east-0.grafana.net:443
    headers:
      authorization: Basic ${env:TEMPO_AUTH}

  loki:
    endpoint: https://logs-prod-006.grafana.net/loki/api/v1/push
    headers:
      authorization: Basic ${env:LOKI_AUTH}

  prometheusremotewrite:
    endpoint: "https://prometheus-prod-13-prod-us-east-0.grafana.net/api/prom/push"
    headers:
      authorization: Basic ${env:PROMETHEUS_AUTH}
```

### Services

Services are what actually bring all of the previous items together. You will add your Receivers, Processors, Exporters and more together into a pipeline and you can, and often will, have multiple pipelines.

Example code:

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [debug, otlp]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [debug, prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [debug, loki]
```

### Visualizing the Pipelines

This can all be a bit much so it might be worth it to visualize the pipeline process kind of like this:

\[IMAGE GOES HERE\]

## Next.js Integration

With all of that out of the way, we can finally get to configuring Next.js to push data to our Collector. Luckily, Next has a [great article](https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry) about this process. There are basically 2 ways of integrating OpenTelemetry with Next, a package made by vercel and doing so manually.

One big thing to remember is that this functionality is still experimental in Next. So, you will have to enable the instrumentation hook:

```js
/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

Once done, you will need to create a file called `instrumentation.ts` at the root of your app (NOT in the app or pages folders). In that file, you will export a function called `register`. This function runs ONCE when a new Next.js server instance is initiated. So, it can be helpful for doing things like registering and setting up globals.

### Default Spans

There are quite a few default spans that Next.js ships with once you have the experimental flag turned on. All of these spans are available whether you are using Vercel's `@vercel/otel` package or doing a manual integration. There are however some spans that only apply to the app router while there are some others that only apply to the pages router.

On many of the spans, there will be a set of attributes you can search and filter your telemetry data based on:

- `next.span_name` - duplicates span name
- `next.span_type` - each span type has a unique identifier
- `next.route` - The route pattern of the request (e.g., /\[param\]/user).
- `next.rsc` (true/false) - Whether the request is an RSC request, such as prefetch.
- `next.page` - This is an internal value used by an app router.
  - You can think about it as a route to a special file (like page.ts, layout.ts, loading.ts and others)
  - It can be used as a unique identifier only when paired with next.route because /layout can be used to identify both /(groupA)/layout.ts and /(groupB)/layout.ts

The comman spans you can find are:

- `[http.method] [next.route]`
- fetch `[http.method] [http.url]`
- generateMetadata `[next.page]`
- resolve page components
- resolve segment modules
- start response

App router specific spans:

- render route (app) `[next.route]`
- executing api route (app) `[next.route]`

Pages router specific spans:

- getServerSideProps `[next.route]`
- getStaticProps `[next.route]`
- render route (pages) `[next.route]`

### Custom Spans

If you want to add custom spans to your application, the process is fairly simple. You just need to bring in the OpenTelemetry SDK, get the tracer, and then start a span. Make sure to end the span when appropriate. Another thing to be aware of is that spans have some [semantic conventions](https://opentelemetry.io/docs/specs/semconv/general/trace/) to follow to make sure your spans play nicely with others.

Example code:

```ts
import { trace } from "@opentelemetry/api";

export async function fetchGithubStars() {
  return await trace
    .getTracer("next-app")
    .startActiveSpan("fetchGithubStars", async (span) => {
      try {
        return await getValue();
      } finally {
        span.end();
      }
    });
}
```

### Option A: Wiring Up @vercel/otel

The `@vercel/otel` package is very easy to get started with. It works everywhere that Next.js works. So, it will run in in Vercel's Node.js environment, it will run at the edge, and it will run in your own self-hosted environments too.

After installation, there is really just one major thing you need to do. YOu will import the package and run the `registerOTel` function with a string for your service name.

```js
import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel("next-app");
}
```

You can also pass a config object that allows you to customize things a bit more. The configuration interface currently looks like this:

```ts
interface Configuration {
  attributes?: Attributes;
  attributesFromHeaders?: AttributesFromHeaders;
  autoDetectResources?: boolean;
  contextManager?: ContextManager;
  idGenerator?: IdGenerator;
  instrumentationConfig?: InstrumentationConfiguration;
  instrumentations?: InstrumentationOptionOrName[];
  logRecordProcessor?: LogRecordProcessor;
  metricReader?: MetricReader;
  propagators?: PropagatorOrName[];
  resourceDetectors?: DetectorSync[];
  serviceName?: string;
  spanLimits?: SpanLimits;
  spanProcessors?: SpanProcessorOrName[];
  traceExporter?: SpanExporterOrName;
  traceSampler?: SampleOrName;
  views?: View[];
}
```

We won't dig too deeply into customizing that config here, but there is a lot of power in there.

### Option B: Manual Integration

Instead of using the `@vercel/otel` package, you can do a manual integration. One important note is that the manual integration is NOT compatible with the Edge runtime.

Because of that we need to make sure we only register our instrumentation function in a Node.js based environment:

```js
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node.ts");
  }
}
```

In the `instrumentation.node.ts` file we can then import the OpenTelemetry Node SDK along with some other classes and start the SDK:

```js
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: "next-app",
  }),
  spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
});
sdk.start();
```

That's it. Pretty straightforward. There is a lot more you can do with it, though, such as instrumenting other parts of your node application:

```js
const instrumentations = getNodeAutoInstrumentations({
  "@opentelemetry/instrumentation-pino": {
    logHook: (span, record, level) => {
      record["resource.service.name"] = "next-app";
      span.setAttribute("NEXT_LOG_KEY", "NEXT_LOG_VALUE");

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
  instrumentations,
});

sdk.start();
```

### Manual Configuration: Edge Support

While this is not official, it does seem like there is a way to get a manual configuration to play nicely with the Edge runtime. Since Vercel is using CloudFlare workers, according to [this HackerNews comment by Lee Robinson](https://news.ycombinator.com/item?id=29003514), we can use their `waitUntil` API.

At Highlight, the waitUntil API is polyfilled to support the edge runtime, so you don't have to do anything extra.

\[IMAGE GOES HERE\]

## How Does Highlight Help?

At this point, if you have a collector set up and your Next.js instrumentation hook set up you are pretty much good to go. So, you might be wondering what Highlight can do for you.

Well, for one, Highlight has their own collector that you will connect to. That takes away the ehadache of making sure it can scale. Having someone on your team deal with and worry about that means that time could be better spent building your application and shipping features to delight your users.

### More Than Just the OpenTelemetry Node.js SDK

Beyond handling that scalability for you, Highlight also helps you do things that the official OpenTelemetry Node.js just doesn't support, yet.

As mentioned earlier, the official Node.js SDK's support for logging is under development. Highlight fills that gap so that you can get Logging and Error Tracing like you would expect from any other major provider.

The big thing that sets Highlight apart is top notch Session Replay. Highlight puts in a lot of effort to tie client-side events and spans to your server-side traces. This gives you the ability to see the path your users are taking through your application. Don't worry every effort is made to scrub any personal data from the replay, which is another thing Highlight's Collector adds for you without any extra effort on your part.

\[IMAGE OR GIF OF SESSION REPLAY\]

## Wrapping Up

I hope you enjoyed reading this and I hope there was something fun to learn. At the end of the day:

- whether you use Vercel or self-host...
- whether you use Highlight or your own collector and providers or maybe even another OpenTelemetry compliant vendor...

OTEL is an incredibly important project that can help you maintain a vendor-agnostic telemetry integration. You can reduce the amount of rewriting and churn when you decide to change providers. Thanks for reading.

  <!-- NOTES for webinar

  - drop some of the history
  - jump out to VSCode instead of code snippets in slides
  - transfer slide content

  - email about payment






   -->
