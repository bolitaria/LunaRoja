#!/bin/bash
echo "🔍 Escaneo dinámico con OWASP ZAP..."
docker run --rm -v $(pwd):/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
    -t http://frontend:3000 \
    -r zap_report.html
echo "✅ Informe generado en zap_report.html"
