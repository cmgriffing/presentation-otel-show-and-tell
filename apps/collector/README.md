# Self-hosted Collector

This part of the repo is to record and store the steps needed for the stock OTEL collector.

Most of these steps are taken directly from the official docs:
https://opentelemetry.io/docs/collector/quick-start/

## Dependencies

Get binary

```
https://github.com/open-telemetry/opentelemetry-collector-releases/releases/tag/v0.96.0
```

```
go install github.com/open-telemetry/opentelemetry-collector-contrib/cmd/telemetrygen@latest
```

## Running

Optionally tee output for easier search later
