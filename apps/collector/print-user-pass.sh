#!/bin/bash

set -o allexport
source .env
echo $PROMETHEUS_AUTH | base64 --decode
set +o allexport
