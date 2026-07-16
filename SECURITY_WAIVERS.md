# 📋 Excepciones de seguridad (Security Waivers)

Proyecto: **Voces Palestinas por la Justicia**  
Versión: 1.0.0  
Fecha: 2026-07-14  
Responsable: Full Stack Senior

---

## 🔍 Resumen

Tras el análisis de seguridad automatizado, se han detectado vulnerabilidades en ciertas dependencias del proyecto.  
La mayoría de ellas no afectan a la imagen de producción, ya que pertenecen a herramientas de desarrollo (`devDependencies`) que no se incluyen en el despliegue final.

Los hallazgos en la imagen Docker (Trivy) y en el código fuente (Semgrep) han sido completamente mitigados, resultando en **0 hallazgos HIGH/CRITICAL** en ambas capas.

Las siguientes vulnerabilidades han sido revisadas y se consideran **no explotables** en el contexto actual del proyecto.

---

## ✅ Lista blanca de vulnerabilidades

### Backend (22 problemas)

| Dependencia | CVE | Severidad | Justificación |
|-------------|-----|-----------|---------------|
| `minimatch` (v9.0.5) | CVE-2026-26996, CVE-2026-27903, CVE-2026-27904 | HIGH | Usado exclusivamente por `jest`, `nodemon` y `babel-plugin-istanbul`, que son dependencias de desarrollo. No se incluyen en la imagen de producción ni se ejecutan en el servidor. |
| `uuid` (v8.x) | GHSA-w5hq-g745-h8pq | MODERATE | Usado internamente por `sequelize` y `node-cron`. La funcionalidad afectada no procesa entradas de usuario y no es explotable en el contexto de la aplicación. |
| `cross-spawn` | CVE-2024-21538 | HIGH | Formaba parte de npm (gestor de paquetes). Ha sido eliminado de la imagen final. No presente en producción. |
| `glob` | CVE-2025-64756 | HIGH | Ídem a `cross-spawn`. Eliminado de la imagen junto con npm. |
| `sigstore` | CVE-2026-48815 | HIGH | Ídem a `cross-spawn`. Eliminado de la imagen junto con npm. |
| `tar` | CVE-2026-23745, CVE-2026-23950, CVE-2026-24842, CVE-2026-26960, CVE-2026-29786, CVE-2026-31802 | HIGH | Ídem a `cross-spawn`. Eliminado de la imagen junto con npm. |

### Frontend (5 problemas)

| Dependencia | CVE / GHSA | Severidad | Justificación |
|-------------|------------|-----------|---------------|
| `postcss` (<8.5.10) | GHSA-qx2v-qp2m-jg93 | MODERATE | Vulnerabilidad interna de Next.js (usada en build). No es explotable desde el exterior. Solo afecta al proceso de construcción, no al runtime. |
| `quill` (≥2.0.3) | GHSA-4943-9vgg-gr5r, GHSA-v3m3-f69x-jf25 | MODERATE | Las vulnerabilidades requieren exportación HTML maliciosa, funcionalidad no utilizada en la aplicación. El contenido se sanitiza con DOMPurify antes de mostrarse. |
| `xlsx` (v0.18.5) | GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9 | HIGH | Librería utilizada únicamente por administradores autenticados para exportar datos. No hay exposición pública. Se planifica su reemplazo por `exceljs` en el futuro. |

---

## 🛡️ Medidas de mitigación aplicadas

- Se ha eliminado el gestor de paquetes `npm` y sus dependencias de la imagen de producción, eliminando los 12 hallazgos HIGH de Trivy.
- El código fuente ha sido analizado con Semgrep y está libre de vulnerabilidades conocidas.
- Se ha implementado sanitización de contenido con DOMPurify en todas las salidas que utilizan `dangerouslySetInnerHTML`.
- Se han añadido cabeceras de seguridad HTTP (CSP, HSTS, etc.) en la configuración de Next.js.
- Las dependencias de desarrollo (`jest`, `nodemon`, `supertest`) están correctamente separadas en `devDependencies` y no se incluyen en el contenedor final.
- Se ha cambiado el usuario de ejecución del contenedor a uno sin privilegios (`nodejs`).

---

## 📅 Revisión periódica

Estos hallazgos serán reevaluados en la próxima revisión trimestral de seguridad (octubre 2026) o cuando se actualicen las dependencias principales (`sequelize`, `next`, `react-quill`). Si alguna dependencia resuelve las vulnerabilidades, se eliminará la entrada de esta lista.

---

## ✍️ Firma

Nombre:
Fecha: 2026-07-14  
Firma: _________________________