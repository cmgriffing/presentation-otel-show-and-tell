---
transition: fade-out
---

# Next.js Integration

https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry

---
transition: fade-out
---

# Warning: Experimental

```js
/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

---
transition: slide-left
---

# Register

Next.js calls register in all environments **ONCE** when a new Next.js server instance is initiated.

```ts

export function register() {
  // side effects
  await import('./register-globals')

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./instrumentation-edge')
  }
}
```

<!--
root-level, NOT in app or pages directory
-->

---
transition: fade-out
---

# Defaults

Applies to both @vercel/otel and a Manual integration

---
transition: fade-out
---

# Next.js Specific Attributes

- `next.span_name` - duplicates span name
- `next.span_type` - each span type has a unique identifier
- `next.route` - The route pattern of the request (e.g., /\[param\]/user).
- `next.rsc` (true/false) - Whether the request is an RSC request, such as prefetch.
- `next.page` - This is an internal value used by an app router.
  - You can think about it as a route to a special file (like page.ts, layout.ts, loading.ts and others)
  - It can be used as a unique identifier only when paired with next.route because /layout can be used to identify both /(groupA)/layout.ts and /(groupB)/layout.ts

---
transition: fade-out
---

# Next.js Spans (common)

https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry#default-spans-in-nextjs

- `[http.method] [next.route]`
- fetch `[http.method] [http.url]`
- generateMetadata `[next.page]`
- resolve page components
- resolve segment modules
- start response

---
transition: fade-out
---

# Next.js Spans (app)

- render route (app) `[next.route]`
- executing api route (app) `[next.route]`

---
transition: fade-out
---

# Next.js Spans (pages)

- getServerSideProps `[next.route]`
- getStaticProps `[next.route]`
- render route (pages) `[next.route]`

---
transition: slide-left
---

# Custom Span

https://opentelemetry.io/docs/specs/semconv/general/trace/

```ts
import { trace } from '@opentelemetry/api'

export async function fetchGithubStars() {
  return await trace
    .getTracer('next-app')
    .startActiveSpan('fetchGithubStars', async (span) => {
      try {
        return await getValue()
      } finally {
        span.end()
      }
    })
}
```

---
transition: fade-out
---

# Dev environment

https://github.com/vercel/opentelemetry-collector-dev-setup

- docker-compose based
- In addition to collector:
  - Jaeger (tracing)
  - Zipkin (trace timing)
  - Prometheus (metrics)



---
transition: fade-out
---

# Node SDK: Logging

![NodeSDK Feature Status](/images/nodesdk-feature-status.png)

---
transition: fade-out
---

# @vercel/otel

- Edge runtime compatible
- Works on vercel or self-hosted


---
transition: slide-left
---

# Instrumentation.ts

```js
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel({ serviceName: 'next-app' })
}
```

---
transition: fade-out
---

# Manual Configuration

- **NOT** Edge runtime compatible

---
transition: fade-out
---

# Instrumentation.ts

```js
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node.ts')
  }
}
```

---
transition: fade-out
---

# Instrumentation.node.ts

```js
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'

const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'next-app',
  }),
  spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
})
sdk.start()
```


---
transition: slide-left
---

# Vercel Edge

- Cloudflare under the hood
- `waitUntil` is needed
  - https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/#contextwaituntil
