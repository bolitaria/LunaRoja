# Runbook de Produccion: LunaRoja

Guia operativa para el despliegue en VPS, backups, resolucion de problemas y actualizaciones.

> **Estado del proyecto:** 14/09/2026 - Fase 1 (desarrollo local).
> El VPS Netcup Lite 1 G12s (4 GB RAM, 2 vCore, 80 GB SSD) esta contratado, pero aun no se ha desplegado. Este runbook documenta el procedimiento para la migracion.

## Indice

1. [Estado actual del proyecto](#1-estado-actual-del-proyecto)
2. [Arquitectura elegida](#2-arquitectura-elegida)
3. [Requisitos previos](#3-requisitos-previos)
4. [Preparacion del VPS](#4-preparacion-del-vps)
5. [Primer despliegue](#5-primer-despliegue)
6. [Certificados SSL](#6-certificados-ssl)
7. [Actualizaciones](#7-actualizaciones)
8. [Backups](#8-backups)
9. [Monitorizacion](#9-monitorizacion)
10. [Resolucion de problemas](#10-resolucion-de-problemas)
11. [Rollback](#11-rollback)
12. [Apendices](#12-apendices)

---

## 1. Estado actual del proyecto

- **Fase:** 1 - desarrollo local y preparacion para VPS.
- **Entorno local:** WSL2 + Docker Compose single-node.
- **VPS:** Netcup Lite 1 G12s contratado, sin desplegar.

### Completado

- Stack completo funcionando en local con Compose.
- Imagenes fijadas: PostgreSQL 14.24-alpine, Redis 7.4.11-alpine, Nginx 1.30.4-alpine, PgBouncer v1.25.2-p0 y Certbot v5.8.0.
- Redes segmentadas: `public` (expuesta) y `data` (`internal: true`, sin salida a Internet).
- Solo Nginx publica puertos 80 y 443.
- Healthchecks en los ocho servicios del core.
- Rotacion de logs (`max-size: 10m`, `max-file: 3`).
- Limites de memoria por servicio (`deploy.resources.limits`).
- Usuarios no root en backend (`nodejs`) y frontend (`nextjs`).
- Alpine actualizado en frontend (`apk upgrade --no-cache`).
- `SECURITY_WAIVERS.md` documentado.
- Renovate configurado para los lunes a las 06:00, zona `Europe/Madrid`.
- Scripts de seguridad: `make scan`, `make scan-images`, `make scan-code` y `make scan-dast`.

### Pendiente antes del VPS

- Terminar las mejoras de frontend y backend en local.
- Definir el dominio final.
- Preparar `.env.prod` con secretos reales.
- Aplicar el hardening del VPS.
- Actualizar el dominio en la configuracion de produccion.

## 2. Arquitectura elegida

Se utiliza **Docker Compose single-node**, no Docker Swarm.

Motivos:

- El VPS tiene 4 GB de RAM y Swarm introduciria consumo adicional innecesario.
- No hay multiples nodos que justifiquen replicas.
- La operacion y el rollback son mas sencillos.
- La arquitectura puede migrarse a Swarm o Kubernetes si el proyecto escala.

### Servicios

| Servicio | Imagen | Red | Puertos publicados |
| --- | --- | --- | --- |
| `nginx` | `nginx:1.30.4-alpine` | `public` | 80, 443 |
| `frontend` | `lunaroja-frontend:latest` | `public` | Ninguno |
| `backend` | `lunaroja-backend:latest` | `public`, `data` | Ninguno |
| `worker` | `lunaroja-worker:latest` | `public`, `data` | Ninguno |
| `pgbouncer` | `edoburu/pgbouncer:v1.25.2-p0` | `data` | Ninguno |
| `postgres` | `postgres:14.24-alpine` | `data` | Ninguno |
| `redis` | `redis:7.4.11-alpine` | `data` | Ninguno |
| `certbot` | `certbot/certbot:v5.8.0` | `public` | Ninguno |
| `mv-refresher` | `postgres:14.24-alpine` | `data` | Ninguno |

Los servicios de monitoring (`prometheus`, `grafana`, `cadvisor` y `node-exporter`) se activan con el perfil `monitoring`. `pgadmin` se activa con el perfil `tools`.

### Presupuesto de RAM

| Servicio | Limite |
| --- | ---: |
| PostgreSQL | 512 MB |
| PgBouncer | 64 MB |
| Redis | 256 MB |
| Backend | 384 MB |
| Worker | 256 MB |
| MV refresher | 32 MB |
| Frontend | 384 MB |
| Nginx | 64 MB |
| Certbot | 64 MB |
| **Subtotal core** | **aprox. 2 GB** |

En Fase 1 quedan aproximadamente 2 GB para el sistema operativo y los picos de carga.

## 3. Requisitos previos

- VPS Netcup Lite 1 G12s (4 GB RAM, 2 vCore, 80 GB SSD).
- Ubuntu 22.04 LTS o Debian 12.
- Dominio con registro A apuntando a la IP del VPS.
- Acceso SSH mediante clave publica, sin password.

## 4. Preparacion del VPS

> Estos pasos se ejecutan una sola vez, al provisionar el VPS.

### 4.1. Actualizar el sistema

```bash
apt update && apt upgrade -y
apt install -y curl ufw fail2ban git htop
```

### 4.2. Configurar el firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP para Let's Encrypt
ufw allow 443/tcp     # HTTPS
ufw enable
ufw status verbose
```

### 4.3. Activar Fail2ban

```bash
systemctl enable --now fail2ban
fail2ban-client status sshd
```

### 4.4. Crear el usuario de despliegue

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 4.5. Endurecer SSH

Editar `/etc/ssh/sshd_config`:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22
```

Si se cambia el puerto SSH, actualizar la regla equivalente en UFW antes de reiniciar el servicio:

```bash
systemctl restart sshd
```

### 4.6. Instalar Docker y Compose

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
apt install -y docker-compose-plugin
```

Cerrar la sesion y volver a conectarse como `deploy` para aplicar el grupo `docker`.

### 4.7. Clonar el repositorio

```bash
su - deploy
git clone <repo-url> ~/LunaRoja
cd ~/LunaRoja
git checkout main  # o develop, segun la estrategia
```

## 5. Primer despliegue

> Ejecutar solo cuando el dominio apunte a la IP del VPS.

### 5.1. Preparar `.env.prod`

```bash
cd ~/LunaRoja
cp .env.prod.example .env.prod
nano .env.prod
```

Cambiar como minimo estas variables:

| Variable | Valor |
| --- | --- |
| `POSTGRES_PASSWORD` | Contraseña fuerte de al menos 32 caracteres |
| `JWT_SECRET` | Valor aleatorio de al menos 64 caracteres |
| `ADMIN_PASSWORD` | Contraseña del superadmin inicial |
| `FRONTEND_URL` | `https://tudominio.com` |
| `CORS_ORIGINS` | `https://tudominio.com` |
| `SMTP_*` | Credenciales reales del proveedor |
| `DOMAIN` | `tudominio.com` |
| `CERTBOT_EMAIL` | Email para Let's Encrypt |

Generar secretos:

```bash
openssl rand -base64 48  # JWT_SECRET
openssl rand -base64 32  # POSTGRES_PASSWORD
```

Verificar que `.env.prod` no este en Git:

```bash
git status --short | grep ".env.prod" && \
  echo "PELIGRO: .env.prod trackeado" || \
  echo "OK: .env.prod no esta trackeado"
```

### 5.2. Ajustar Nginx

En `nginx/conf.d/default.conf`, cambiar `server_name localhost;` por `server_name tudominio.com www.tudominio.com;`. El bloque HTTPS se añade despues de emitir el certificado, como se describe en la seccion 6.

### 5.3. Construir e iniciar el stack

```bash
cd ~/LunaRoja

# Construir las imagenes propias.
docker compose -f docker-compose.prod.yml --env-file .env.prod build

# Levantar el stack.
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Verificar el estado.
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

Resultado esperado: los ocho servicios del core aparecen `Up` o `healthy`, sin monitoring ni tools.

### 5.4. Ejecutar las migraciones

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  exec backend npm run migrate
```

### 5.5. Verificar endpoints

```bash
curl -sf http://localhost/health && echo " OK /health"
curl -sf http://localhost/api/actions -o /dev/null && echo " OK /api/actions"
curl -sf http://localhost/ -o /dev/null && echo " OK frontend"
```

## 6. Certificados SSL

### 6.1. Emitir el certificado por primera vez

Con el dominio apuntando al VPS y Nginx en ejecucion:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d tudominio.com -d www.tudominio.com \
  --email admin@tudominio.com \
  --agree-tos --no-eff-email
```

### 6.2. Activar HTTPS en Nginx

En `nginx/conf.d/default.conf`, añadir un segundo bloque `server` con `listen 443 ssl;` y estas rutas:

```text
ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
```

Configurar la redireccion de HTTP a HTTPS en el servidor del puerto 80 y reiniciar Nginx:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod restart nginx
```

### 6.3. Comprobar la renovacion automatica

El contenedor Certbot intenta renovar cada 12 horas. Revisar sus logs:

```bash
docker compose -f docker-compose.prod.yml logs certbot --tail 30
```

## 7. Actualizaciones

```bash
cd ~/LunaRoja

# Traer cambios.
git pull origin main

# Reconstruir las imagenes propias que hayan cambiado.
docker compose -f docker-compose.prod.yml --env-file .env.prod build backend frontend worker

# Recrear los contenedores afectados.
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Verificar.
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

No usar `docker service update` ni `docker stack deploy`: este entorno no es Swarm. El despliegue con Compose single-node puede provocar aproximadamente entre 5 y 10 segundos de interrupcion durante la recreacion.

## 8. Backups

### 8.1. Backup manual

```bash
cd ~/LunaRoja
make backup      # Solo base de datos
make backup-all  # Base de datos y uploads
```

Los backups se guardan en `./backups/` con timestamp.

### 8.2. Backup automatico

Editar el crontab:

```bash
crontab -e
```

Añadir:

```cron
0 3 * * * cd /home/deploy/LunaRoja && make backup-all >> /var/log/lunaroja-backup.log 2>&1
```

La retencion es de siete dias; `scripts/backup-db.sh` elimina los backups antiguos.

### 8.3. Restaurar un backup

```bash
make restore FILE=backups/backup_20260914_030000.sql
```

## 9. Monitorizacion

En Fase 1 no se activa monitoring por defecto para ahorrar aproximadamente 1 GB de RAM. Para activarlo cuando haya trafico real:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  --profile monitoring up -d
```

Servicios disponibles:

| Servicio | URL |
| --- | --- |
| Prometheus | `http://IP_VPS:9090` |
| Grafana | `http://IP_VPS:3002` |
| cAdvisor | `http://IP_VPS:8080` |
| node-exporter | `http://IP_VPS:9100/metrics` |

Antes de activar monitoring, cambiar `GRAFANA_ADMIN_PASSWORD` y restringir el acceso por firewall. No exponer estos servicios a Internet sin proteccion.

Dashboards recomendados: Node Exporter Full (ID 1860), Docker monitoring (ID 179) y PostgreSQL Overview (ID 9628).

## 10. Resolucion de problemas

| Problema | Causa probable | Solucion |
| --- | --- | --- |
| `host not found in upstream "backend:5000"` en `nginx -t` | Contenedor fuera de la red o prueba ejecutada fuera del stack | Ejecutar `docker exec lunaroja_nginx nginx -t` |
| `502 Bad Gateway` en `/api/*` | Backend no responde o no esta healthy | Revisar `docker compose logs backend --tail 50` y `docker compose ps` |
| El frontend muestra `ECONNREFUSED` | `INTERNAL_API_URL` mal configurada | Usar `http://backend:5000`, no `localhost` |
| `npm ci` falla durante el build | `package-lock.json` desincronizado | Ejecutar `cd frontend && npm install --package-lock-only` y reconstruir |
| PostgreSQL no arranca | Volumen corrupto o password incorrecta | Revisar `docker compose logs postgres --tail 100` y `POSTGRES_PASSWORD` |
| El certificado SSL no se renueva | Certbot no accede a `/.well-known/acme-challenge/` | Revisar el bloque `location` y el volumen `/var/www/certbot` |
| Certbot falla en bucle | Dominio inexistente o DNS incorrecto | En Fase 1, detenerlo con `docker compose stop certbot` |
| El contenedor Alpine falla por swap | WSL2 no soporta swap limits | Ignorarlo en local; el kernel Linux del VPS si lo soporta |
| Disco lleno | Logs o backups acumulados | Revisar `./backups/` y usar `docker system prune -a` con cuidado |
| `429 Too Many Requests` | Se alcanzo el rate limit | Ajustar `RATE_LIMIT_MAX_PUBLIC` en `.env.prod` |

## 11. Rollback

### 11.1. Rollback de codigo

Si el despliegue falla:

```bash
cd ~/LunaRoja
git log --oneline -10
git checkout <commit-anterior>
docker compose -f docker-compose.prod.yml --env-file .env.prod build backend frontend worker
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### 11.2. Rollback de base de datos

Usar solo si una migracion nueva rompe la aplicacion:

```bash
# Detener backend y worker.
docker compose -f docker-compose.prod.yml --env-file .env.prod stop backend worker

# Restaurar el backup.
make restore FILE=backups/backup_20260914_030000.sql

# Volver a la version estable y levantarla.
git checkout <commit-anterior>
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### 11.3. Apagar todo el stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

`down` preserva los volumenes `postgres_data`, `redis_data` y `uploads_data`. No ejecutar `docker compose down -v` salvo que se quiera borrar los datos de forma deliberada.

## 12. Apendices

### A. Comandos utiles

```bash
# Estado del stack.
docker compose -f docker-compose.prod.yml --env-file .env.prod ps

# Logs en vivo.
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend

# Entrar en un contenedor.
docker compose -f docker-compose.prod.yml --env-file .env.prod exec backend sh

# Shell de PostgreSQL.
docker compose -f docker-compose.prod.yml --env-file .env.prod \
  exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Escaneos de seguridad.
make scan        # Trivy y Semgrep
make scan-images # Solo imagenes Docker
make scan-code   # Solo codigo fuente
```

### B. Redes y volumenes

Redes:

- `lunaroja_public`: expuesta a Internet a traves de Nginx.
- `lunaroja_data`: `internal: true`, sin salida a Internet.

Volumenes con prefijo `lunaroja_`:

- `lunaroja_postgres_data`: datos de PostgreSQL.
- `lunaroja_redis_data`: AOF de Redis.
- `lunaroja_uploads_data`: uploads de usuario.
- `lunaroja_certbot_etc`: certificados de Let's Encrypt.
- `lunaroja_certbot_var`: estado de Certbot.

### C. Documentos relacionados

- `SECURITY_WAIVERS.md`: CVEs aceptados y justificaciones.
- `docker-compose.prod.yml`: orquestacion de produccion.
- `nginx/conf.d/default.conf`: configuracion del reverse proxy.
- `renovate.json`: politica de actualizaciones automaticas.
- `Makefile`: comandos de operacion.

---

**Ultima actualizacion:** 2026-09-14  
**Proxima revision:** cuando se defina el dominio final de produccion.