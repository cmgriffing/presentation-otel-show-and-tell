# OpenTelemetry (OTEL)

---
transition: fade-out
---

# What is it??

- OpenTracing + OpenCensus = OpenTelemetry
- CNCF incubator project
- 3 Core Concepts
  - Tracing
  - Metrics
  - Logs

---
transition: fade-out
---

# Why was it made?

- Observability
- Too many independent solutions
  - Portability

<!--
Applications/Services are often a black box with only their outputs being able to be analyzed
-->

---
transition: fade-out
---

# Relevant Timeline

- 2010: Dapper (Google whitepaper)
- 2012: Zipkin (Twitter tool inspired by Dapper)
- 2015: Jaeger (from Uber)
- 2015: OpenTracing
  - third CNCF-hosted project
  - consistent, expressive, vendor-neutral APIs
- 2017: OpenCensus (Google tools)
- 2019: OpenTelemetry (OpenTracing + OpenCensus)

<!--
source: https://tracetest.io/blog/tracing-the-history-of-distributed-tracing-opentelemetry
-->

---
transition: fade-out
---

# Who is behind it?

- CNCF (Cloud Native Computing Foundation)
  - Part of the Linux Foundation
    - Google
    - Red Hat
    - Twitter
    - Intel
    - IBM
    - and more...

---
transition: fade-out
---

# Other notable CNCF projects

- containerd (container runtime)
- CoreDNS
- etcd (distributed key/value store)
- Helm
- Jaeger
- Kubernetes (k8s)
- and more

---
transition: fade-out
---

# Vendors Supporting OTEL

https://opentelemetry.io/ecosystem/vendors/

- Alibaba Cloud
- AWS
- Azure
- Clickhouse
- Datadog
- GCP (Google)
- Grafana
- Highlight
- New Relic
- Sentry
- and more...

---
transition: fade-out
---

# OTEL Signals

https://opentelemetry.io/docs/concepts/signals/

- Traces
  - Big picture of what happens when a request is made
  - Made up of smaller "Spans"
- Metrics
  - cpu/ram/runtime/etc.
- Logs
- Baggage
  - Contextual information that is passed between signals

<!--
- mention metrics vs tracing video with Ben Sigelman
-->

---
transition: fade-out
---

# OTLP

- gRPC
- HTTP
- Protobuf
  - language-neutral, platform-neutral structured data
- Stable?
  - https://github.com/open-telemetry/opentelemetry-proto?tab=readme-ov-file#stability-definition

---
transition: fade-out
---

# Collector

Vendor-agnostic way to receive, process and export telemetry data.

Not 100% necessary

- Why?
  - retries
  - batching
  - encryption
  - sensitive data filtering


---
transition: slide-left
---

# Instrumentation

- Automatic (no-code)
  - https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node
    - aws-sdk
    - express
    - fastify
    - http
    - hapi
    - etc (32 total so far)
- Custom
- Libraries
  - wrapping interfaces
  - subscribing to library-specific callbacks
  - or translating existing telemetry into OTEL
