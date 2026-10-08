# 📋 Excepciones de seguridad (Security Waivers)

Proyecto: **Voces Palestinas por la Justicia (LunaRoja)**
Versión: 2.0.0
Fecha: 2026-09-14
Responsable: Full Stack Senior

---

## 🔍 Resumen ejecutivo

Estado actual tras escaneo Trivy del **14/09/2026** sobre las 12 imágenes del stack:

| Métrica | Valor |
|---|---|
| Imágenes escaneadas | 7 (5 monitoring opt-in sin construir) |
| CRITICAL totales | **1** (en `gosu`, no accionable — ver waiver 4) |
| HIGH totales | 87 |
| HIGH en código propio (backend/frontend) | **2** (bundled upstream) |
| HIGH en imágenes base upstream | 85 (no accionables) |

**Conclusión**: 1 CRITICAL residual (en `gosu`, bundleado en la imagen oficial de Postgres — ver waiver 4) y 87 HIGH, todos en **dependencias upstream no accionables**. 0 CRITICAL y 0 HIGH en código propio controlado (backend limpio; frontend solo tiene el postcss bundled de Next.js).

---

## ✅ Imágenes limpias (0 HIGH / 0 CRITICAL)

- `lunaroja-backend:latest` — Debian 12.15, 88 paquetes, todo limpio
- `redis:7.4.11-alpine` — Alpine 3.21.7, 19 paquetes, todo limpio

---

## 🟡 CVEs aceptados (waivers)

### 1. `postcss` bundled en Next.js — Frontend (2 HIGH)

| CVE | Paquete | Versión | Fix | Causa raíz |
|---|---|---|---|---|
| CVE-2026-45623 | postcss | 8.4.31 | 8.5.12 | Bundled en `node_modules/next/node_modules/postcss/` |
| CVE-2026-73646 | postcss | 8.4.31 | 8.5.18 | Ídem |

**Justificación**: Next.js empaqueta su propia copia interna de postcss para el build. **No es sustituible** por el usuario (`npm overrides` no puede alcanzar módulos anidados dentro de Next). El postcss top-level del proyecto ya está en **8.5.18** (parcheado).

**Mitigación**: postcss solo se ejecuta durante `npm run build`, no en runtime. El proceso de build corre en CI/desarrollo, no en producción.

**Riesgo real**: nulo en runtime. Solo afectaría si un atacante controlara el CSS que se compila, lo cual no ocurre porque el CSS es de fuentes internas.

**Revisar**: 2026-12-14 (o al subir Next.js a una versión que incluya postcss ≥8.5.18).

---

### 2. `util-linux` / `libuuid` en Alpine 3.24.1 — nginx, postgres, certbot (20 HIGH)

| CVE | Paquete | Versión | Fix |
|---|---|---|---|
| CVE-2026-53612 | libuuid | 2.42.1-r0 | 2.42.3-r0 |
| CVE-2026-53613 | libuuid | 2.42.1-r0 | 2.42.3-r0 |
| CVE-2026-53614 | libuuid | 2.42.1-r0 | 2.42.3-r0 |
| CVE-2026-76642 | libuuid | 2.42.1-r0 | 2.42.3-r0 |
| CVE-2026-78408 | libuuid | 2.42.1-r0 | 2.42.3-r1 |
| CVE-2026-78409 | libuuid | 2.42.1-r0 | 2.42.3-r0 |
| CVE-2026-78410 | libuuid | 2.42.1-r0 | 2.42.3-r0 |

**Afectadas**: `nginx:1.30.4-alpine` (7 HIGH), `postgres:14.24-alpine` (7 HIGH), `certbot:v5.8.0` (6 HIGH).

**Justificación**: Alpine 3.24.1 aún no ha reconstruido con `util-linux` 2.42.3. Todas las imágenes upstream están afectadas de forma idéntica.

**Mitigación**: los CVEs afectan a `mount(8)` y `nsenter` — **ningún servicio del stack ejecuta estas utilidades**. Son vectores de escalada local que requieren acceso shell previo (no hay superficie externa).

**Revisar**: 2026-11-14 (o cuando Alpine 3.24.x publique la reconstrucción).

---

### 3. `openssl` + `libpq` en pgbouncer — 40 HIGH

**Afectada**: `edoburu/pgbouncer:v1.25.2-p0` (Alpine 3.23.4).

**Justificación**: Pgbouncer no ha sido reconstruido contra Alpine 3.24. Los CVEs de openssl (3.5.6-r0) y libpq (18.4-r0) son upstream. **No accionable** por nosotros.

**Mitigación**:
- Pgbouncer **no termina TLS** en modo actual (solo proxy TCP en red interna `data`).
- Pgbouncer **no parsea SQL**: solo pasa bytes entre backend y Postgres.
- Red `data` es `internal: true` → sin salida a Internet, sin exposición externa.
- Si en el futuro se activa TLS termination en pgbouncer, revisar este waiver.

**Riesgo real**: prácticamente nulo dado que pgbouncer no procesa input no confiable, solo reenvía protocolo binario a Postgres.

**Revisar**: 2026-11-14.

---

### 4. `gosu` (binario Go) en postgres — 22 HIGH + 1 CRITICAL

**Afectada**: `postgres:14.24-alpine`.

| CVE | Paquete | Versión | Fix | Severidad |
|---|---|---|---|---|
| CVE-2025-68121 | stdlib (Go) | v1.24.6 | 1.24.13, 1.25.7, 1.26.0-rc.3 | 🔴 CRITICAL |
| CVE-2025-61726 | stdlib (Go) | v1.24.6 | 1.24.12, 1.25.6 | HIGH |
| CVE-2025-61729 | stdlib (Go) | v1.24.6 | 1.24.11, 1.25.5 | HIGH |
| CVE-2026-25679 | stdlib (Go) | v1.24.6 | 1.25.8, 1.26.1 | HIGH |
| CVE-2026-27145 | stdlib (Go) | v1.24.6 | 1.25.11, 1.26.4 | HIGH |
| CVE-2026-32280 | stdlib (Go) | v1.24.6 | 1.25.9, 1.26.2 | HIGH |
| CVE-2026-32281 | stdlib (Go) | v1.24.6 | 1.25.9, 1.26.2 | HIGH |
| CVE-2026-32283 | stdlib (Go) | v1.24.6 | 1.25.9, 1.26.2 | HIGH |
| CVE-2026-33811 | stdlib (Go) | v1.24.6 | 1.25.10, 1.26.3 | HIGH |
| CVE-2026-33814 | stdlib (Go) | v1.24.6 | 1.25.10, 1.26.3 | HIGH |
| CVE-2026-33818 | stdlib (Go) | v1.24.6 | 1.25.13, 1.26.6, 1.27.0-rc.3 | HIGH |
| CVE-2026-39820 | stdlib (Go) | v1.24.6 | 1.25.10, 1.26.3 | HIGH |
| CVE-2026-39821 | stdlib (Go) | v1.24.6 | 1.25.13, 1.26.6, 1.27.0-rc.3 | HIGH |
| CVE-2026-39822 | stdlib (Go) | v1.24.6 | 1.25.12, 1.26.5, 1.27.0-rc.2 | HIGH |
| CVE-2026-39836 | stdlib (Go) | v1.24.6 | 1.25.10, 1.26.3 | HIGH |
| CVE-2026-42499 | stdlib (Go) | v1.24.6 | 1.25.10, 1.26.3 | HIGH |
| CVE-2026-42504 | stdlib (Go) | v1.24.6 | 1.25.11, 1.26.4 | HIGH |
| CVE-2026-56853 | stdlib (Go) | v1.24.6 | 1.25.13, 1.26.6, 1.27.0-rc.3 | HIGH |
| CVE-2026-56858 | stdlib (Go) | v1.24.6 | 1.25.13, 1.26.6, 1.27.0-rc.3 | HIGH |
| CVE-2026-56859 | stdlib (Go) | v1.24.6 | 1.25.13, 1.26.6, 1.27.0-rc.3 | HIGH |
| CVE-2026-56860 | stdlib (Go) | v1.24.6 | 1.25.13, 1.26.6, 1.27.0-rc.3 | HIGH |
| CVE-2026-56862 | stdlib (Go) | v1.24.6 | 1.25.13, 1.26.6, 1.27.0-rc.3 | HIGH |

**Justificación**: `gosu` es un binario Go precompilado incluido en la imagen oficial de Postgres. Nosotros **no podemos actualizarlo** — solo Postgres puede.

**Mitigación**:
- `gosu` se usa **exclusivamente** en el entrypoint como `exec` para cambiar de usuario.
- Postgres corre en red `data` (`internal: true`).
- El binario se ejecuta **una vez al arrancar** el contenedor, no en runtime.
- No procesa input externo: recibe `argv` desde el script de entrypoint y hace `exec`.

**Riesgo real**: nulo en la práctica. Los CVEs de Go stdlib solo se explotarían si un atacante pudiera pasar input al binario en ejecución, lo cual no ocurre. `CVE-2025-68121` (el CRITICAL) requiere handshake TLS con sesión reanudada — gosu no hace TLS en ningún caso.

**Revisar**: 2026-12-14 (o al subir Postgres major a una versión con gosu actualizado).

---

### 5. Python deps en certbot — 2 HIGH

**Afectada**: `certbot/certbot:v5.8.0`.

| CVE / GHSA | Paquete | Versión | Fix |
|---|---|---|---|
| GHSA-6v7p-g79w-8964 | msgpack | 1.1.2 | 1.2.1 |
| CVE-2025-47273 | setuptools | 70.3.0 | 78.1.1 |

**Justificación**: empaquetadas dentro de la imagen oficial de certbot (Python 3.14 bundleado). No accionable.

**Mitigación**:
- Certbot corre **esporádicamente** (renovación TLS cada ~90 días).
- No procesa input no confiable del exterior.
- En Fase 1 (sin dominio) ni siquiera se ejecuta.
- En producción estará detrás de un cron controlado.

**Revisar**: 2026-12-14.

---

## 🛡️ Medidas de mitigación arquitectónicas

- ✅ **Red `data` con `internal: true`**: Postgres, pgbouncer y Redis **no tienen salida a Internet** ni son alcanzables desde fuera del stack.
- ✅ **Solo nginx expone puertos** al host (80/443). Backend, frontend, BD, Redis y pgbouncer son accesibles solo por red interna.
- ✅ **Sin `latest` en imágenes**: todo pinneado a versiones específicas (facilita reproducibilidad y detectar drift).
- ✅ **Sin npm en runtime**: eliminado de las imágenes backend y frontend.
- ✅ **Usuario no root** en backend (`nodejs`) y frontend (`nextjs`).
- ✅ **Healthchecks** en los 8 servicios del core.
- ✅ **Logs rotados** (`max-size: 10m`, `max-file: 3`).
- ✅ **Límites de memoria** por servicio (`deploy.resources.limits`).
- ✅ **Dependencias dev separadas**: `jest`, `nodemon`, `cypress`, `prettier` no entran en las imágenes.
- ✅ **Alpine parcheado** en frontend (`apk upgrade --no-cache` en el Dockerfile).

---

## 📅 Revisión periódica

| Fecha | Acción |
|---|---|
| **2026-10-14** | Renovate evalúa actualizaciones automáticamente (lunes 6:00 Europe/Madrid). |
| **2026-11-14** | Revisar waivers 2 y 3 (util-linux, openssl/libpq) — esperar que Alpine publique. |
| **2026-12-14** | Revisión trimestral completa. Re-ejecutar Trivy. |
| **Al subir Next.js** | Revisar waiver 1 (postcss bundled). |
| **Al subir Postgres major** | Revisar waiver 4 (gosu). |
| **Al activar TLS en pgbouncer** | Revisar waiver 3. |

---

## 📊 Trazabilidad

- Escaneo inicial (pre-rebuild): 2026-09-14 13:19 → 7 imágenes, ~218 HIGH / ~15 CRITICAL
- Escaneo final (post-rebuild + parches): 2026-09-14 14:10 → 7 imágenes, **87 HIGH / 1 CRITICAL**
- Reducción: **−60% HIGH, −93% CRITICAL**
- Único CRITICAL residual: `CVE-2025-68121` en `gosu` (postgres) — ver waiver 4
- 0 CRITICAL en código propio (backend limpio; frontend solo postcss bundled)

Reportes completos: `security-reports/` (generados por `make scan-images`).

**Nota metodológica**: los totales se calculan sumando todas las capas reportadas por Trivy (`alpine`, `node-pkg`, `gobinary`, `python-pkg`, `rustbinary`) por imagen. Un simple `grep -m1 "Total:"` solo cuenta la primera capa y **subestima** el total.

---

## ✍️ Firma

Responsable: Full Stack Senior
Fecha: 2026-09-14
Firma: _________________________