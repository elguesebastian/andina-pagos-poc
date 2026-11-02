# Andina Pagos – POC de seguridad en el desarrollo

Prueba de concepto del Grupo 7 (Ingeniería de Software, UADE): un pipeline de GitHub Actions que agrega controles **SAST, escaneo de secretos, SCA con SBOM y DAST** a una aplicación web de ejemplo, y bloquea la versión cuando un control no se supera.

## Aplicación de ejemplo

Aplicación web en Node.js con un módulo simulado de transferencias (datos en memoria):

| Ruta | Descripción |
|---|---|
| `GET /` | Página principal |
| `GET /health` | Estado de la aplicación |
| `GET /api/saldo?cuenta=AP-0001` | Consulta de saldo |
| `POST /api/transferencias` | Transferencia entre cuentas de prueba |

Para ejecutarla localmente: `npm ci` y `npm start` (puerto 3000). Pruebas: `npm test`.

## Pipeline (`.github/workflows/seguridad.yml`)

Se ejecuta en cada pull request y en cada cambio sobre `main`.

| Etapa | Herramienta | Bloquea la versión si… |
|---|---|---|
| SAST | Semgrep (reglas `p/javascript` y `.semgrep/`) | hay hallazgos de severidad alta (ERROR) |
| Secretos | Gitleaks | detecta una credencial en el código o en el historial |
| SCA y SBOM | Syft (SBOM CycloneDX) + Grype | hay vulnerabilidades altas o críticas, o una licencia no permitida |
| Build y pruebas | npm + Docker | fallan las pruebas o la construcción |
| DAST base | ZAP (escaneo pasivo) | hay alertas de riesgo alto |
| Aprobación | — | algún control anterior no se superó |

El DAST completo (escaneo activo) se ejecuta todas las noches con `.github/workflows/dast-nocturno.yml`.

Los reportes (SARIF, SBOM y reportes de ZAP) se guardan como artefactos de cada ejecución durante 90 días.

## Criterios de bloqueo

Los criterios siguen la sección 18 del documento del proyecto: las vulnerabilidades críticas y altas bloquean; las medias y bajas se registran para su corrección en plazo.

## Nota sobre versiones

Para simplificar la POC, las acciones y herramientas se referencian por etiqueta de versión. En una implementación productiva deben fijarse por hash (commit o digest), como indica la sección 16.5 del documento.
