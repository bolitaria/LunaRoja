#!/bin/bash
echo "🐳 Escaneo de imagen Docker con Trivy..."
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image lunaroja_backend \
  --severity HIGH,CRITICAL --ignore-unfixed