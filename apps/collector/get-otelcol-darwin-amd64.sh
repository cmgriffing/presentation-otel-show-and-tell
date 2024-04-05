curl -L -o- -s https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.97.0/otelcol-contrib_0.97.0_darwin_amd64.tar.gz | tar -zx
mv otelcol-contrib otelcol
# Need to figure out why the README is being modified
git checkout -- README.md
