#!/bin/bash
echo "🔍 Escaneo dinámico con OWASP ZAP..."
docker run --rm -v "$(pwd)/../..:/zap/wrk" owasp/zap2docker-stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap_report.html
echo "✅ Informe generado en zap_report.html"