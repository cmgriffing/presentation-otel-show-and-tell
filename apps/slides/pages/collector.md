---
transition: fade-out
---

# Setting up the Collector

---
transition: fade-out
---

# The Repo

https://github.com/open-telemetry/opentelemetry-collector

- Library
- Standalone
- 264mb (so gitignore it)

---
transition: fade-out
---

# Collector Config

- Receivers
- Processors
- Extensions
- Exporters
- Services

---
transition: fade-out
---

# Receivers

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: localhost:4317
      http:
        endpoint: localhost:4318
```

---
transition: fade-out
---

# Processors

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

---
transition: fade-out
---

# Extensions

```yaml
extensions:
  basicauth/prometheus:
    client_auth:
      username: ${env:PROMETHEUS_USER}
      password: ${env:PROMETHEUS_PASS}
```

---
transition: fade-out
---

# Exporters

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

---
transition: slide-left
---

# Services

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [
          memory_limiter,
          # batch
        ]
      exporters: [debug, otlp]
    metrics:
      receivers: [otlp]
      processors: [
          memory_limiter,
          # batch
        ]
      exporters: [debug, prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [
          memory_limiter,
          # batch
        ]
      exporters: [debug, loki]
```
