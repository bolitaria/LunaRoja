#!/bin/bash
# ⚠️  DESACTIVADO EN FASE 1
# ============================================================
# Este script fue diseñado para Docker Swarm + Prometheus.
# En Fase 1 usamos Docker Compose single-node con VPS de 4 GB,
# donde:
#   - No existen réplicas de servicio (docker service scale)
#   - No hay RAM suficiente para múltiples backends
#   - El auto-scaling no aporta valor
#
# Si en el futuro migras a:
#   - Swarm multi-nodo
#   - Kubernetes
#   - Docker Compose con múltiples réplicas y balanceo
# ...recupera el script desde el historial de Git:
#   git log --all --full-history -- scripts/auto_scale.sh
# ============================================================

echo "⚠️  auto_scale.sh está desactivado en Fase 1 (Compose single-node)."
echo "   Ver comentarios en el propio script para más contexto."
exit 0
