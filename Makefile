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