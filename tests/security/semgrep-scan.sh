#!/bin/bash
echo "🔍 Análisis estático con Semgrep..."
docker run -v "$(pwd)/../..:/src" --rm \
  -e SEMGREP_SEND_METRICS=off \
  semgrep/semgrep:latest \
  semgrep scan --config=p/owasp-top-ten --config=p/secrets --config=p/dockerfile /src