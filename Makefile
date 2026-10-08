.PHONY: help test-backend test-frontend test-frontend-e2e test-all \
        lint lint-backend lint-frontend migrate migrate-status \
        dev dev-backend dev-frontend \
        docker-up docker-down docker-build \
        clean test-preproduction

# ──────────────── AYUDA ────────────────
help: ## Muestra esta ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

# ──────────────── PRUEBAS ────────────────
test-backend: ## Ejecuta tests de integración del backend (levanta servidor automáticamente)
	cd backend && npm run test:integration

test-frontend: ## Ejecuta tests unitarios del frontend con Jest
	cd frontend && npm test

test-frontend-e2e: ## Ejecuta tests E2E del frontend con Cypress (debe estar corriendo en localhost:3000)
	cd frontend && npx cypress run

test-all: test-backend test-frontend ## Ejecuta todos los tests (backend + frontend unitarios)

test-preproduction: ## Suite completa de pre‑producción (requiere Docker)
	./tests/run_all.sh

# ──────────────── LINTING ────────────────
lint-backend: ## Linting del backend
	cd backend && npm run lint || echo "No lint script configured"

lint-frontend: ## Linting del frontend
	cd frontend && npm run lint || echo "No lint script configured"

lint: lint-backend lint-frontend ## Linting de ambos servicios

# ──────────────── BASE DE DATOS ────────────────
migrate: ## Ejecuta migraciones del backend
	cd backend && npm run migrate

migrate-status: ## Muestra el estado de las migraciones del backend
	cd backend && npm run migrate:status

# ──────────────── DESARROLLO ────────────────
dev-backend: ## Inicia servidor backend en modo desarrollo (con nodemon)
	cd backend && npm run dev

dev-frontend: ## Inicia servidor frontend en modo desarrollo (Next.js)
	cd frontend && npm run dev

dev: ## Inicia ambos servicios en desarrollo (en segundo plano)
	@echo "Iniciando backend y frontend..."
	cd backend && npm run dev &
	cd frontend && npm run dev

# ──────────────── DOCKER ────────────────
docker-up: ## Levanta todos los servicios con Docker Compose
	docker compose up -d

docker-down: ## Detiene los servicios de Docker Compose
	docker compose down

docker-build: ## Construye las imágenes de Docker
	docker compose build

# ──────────────── PRODUCCIÓN ────────────────
build: ## Compila el frontend para producción
	cd frontend && npm run build

start: ## Inicia el servidor backend en modo producción
	cd backend && npm start

# ──────────────── LIMPIEZA ────────────────
clean: ## Elimina procesos residuales del backend en el puerto 5000
	-pkill -f "node src/app.js" 2>/dev/null
	-sudo fuser -k 5000/tcp 2>/dev/null
# ──────────────── BACKUPS ────────────────
backup: ## Backup de la BD (guarda en /backups)
	./scripts/backup-db.sh

backup-all: ## Backup completo: BD + uploads (bundle en /backups)
	./scripts/backup-all.sh

restore: ## Restaurar BD desde backup (Uso: make restore FILE=/backups/xxx.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "Uso: make restore FILE=/backups/backup_YYYYMMDD_HHMMSS.sql"; \
		echo ""; \
		echo "Backups disponibles:"; \
		ls -lh /backups/backup_*.sql 2>/dev/null | tail -5 || echo "  (ninguno)"; \
		exit 1; \
	fi
	./scripts/restore-db.sh $(FILE)

# ──────────────── PRODUCCIÓN (Fase 1 - Compose) ────────────────
deploy: ## Deploy a producción con docker-compose.prod.yml
	./scripts/deploy.sh

up-monitoring: ## Levanta con monitoring (Grafana + Prometheus + cAdvisor)
	docker compose --profile monitoring up -d

up-tools: ## Levanta con pgAdmin
	docker compose --profile tools up -d

logs-backend: ## Logs del backend
	docker compose logs -f --tail=100 backend

logs-frontend: ## Logs del frontend
	docker compose logs -f --tail=100 frontend

logs-db: ## Logs de postgres
	docker compose logs -f --tail=100 postgres

shell-backend: ## Shell en backend
	docker compose exec backend sh

shell-db: ## psql en postgres
	docker compose exec postgres psql -U $${POSTGRES_USER:-lunaroja} -d $${POSTGRES_DB:-lunaroja}

shell-redis: ## redis-cli
	docker compose exec redis redis-cli

ps: ## Estado de contenedores
	docker compose ps

# ──────────────── SEGURIDAD ────────────────
scan: scan-images scan-code ## Escaneo completo (Trivy + Semgrep)

scan-images: ## Escaneo de CVEs en imágenes Docker (Trivy)
	SEVERITY=HIGH,CRITICAL FORMAT=table ./tests/security/trivy-scan.sh

scan-images-sarif: ## Igual, pero con salida SARIF (para GitHub Security)
	SEVERITY=HIGH,CRITICAL FORMAT=sarif ./tests/security/trivy-scan.sh

scan-code: ## Análisis estático (Semgrep)
	./tests/security/semgrep-scan.sh

scan-dast: ## Análisis dinámico (OWASP ZAP) — requiere frontend corriendo
	./tests/security/zap-scan.sh

scan-all: scan scan-dast ## Todos los escaneos (incluye DAST)

security-reports-clean: ## Borra los reportes de seguridad
	rm -rf security-reports/
	@echo "✅ security-reports/ eliminado"
