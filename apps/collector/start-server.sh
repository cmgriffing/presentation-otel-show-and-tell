#!/bin/bash

set -o allexport
source .env
./otelcol --config=./config.yaml
set +o allexport
