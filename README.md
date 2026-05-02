# Hub Clínico HS Canarias

Aplicación web local-first para captura estructurada de datos clínicos en **Hidradenitis Supurativa (HS)**, sin instalación y sin backend remoto.

## Estado actual

- **Versión:** 1.0.0-rc1
- **Entorno:** Hospital Universitario de Canarias (HUC)
- **Patología:** Hidradenitis Supurativa (CIE-10: L73.2)
- **Identificador de paciente:** NHC (Número de Historia Clínica)
- **Base de datos local:** `Hub_Clinico_HS_Canarias.xlsx`
- **Hojas Excel:** `HS` (datos clínicos), `Profesionales`, `Consultas`, `Farmacos_HS`
- **Flujo de persistencia:** exportar TXT (historia clínica) + TSV (1 fila para pegar en Excel)
- **Caché operativa:** por sesión de navegador (`sessionStorage`), no persistente al cerrar la ventana

## Qué hace

1. **Primera visita HS** — captura completa: datos basales, comorbilidades, actividad clínica (IHS-4, Hurley), lesiones por región anatómica, ecografía, PROMs (DLQI, HSQoL-24), tratamiento, decisión terapéutica, cirugía/comité, analítica.
2. **Visita de seguimiento** — precarga datos estables del paciente (comorbilidades, antropometría, tratamiento actual), muestra contexto de última visita, deja vacíos los campos de actividad actual.
3. **Cálculo automático de IHS-4** clínico y ecográfico con categorización (Leve / Moderada / Grave).
4. **Búsqueda de pacientes** por NHC con vista rápida (quick view) y navegación al dashboard.
5. **Dashboard de paciente** con métricas y evolución longitudinal.
6. **Dashboard de estadísticas** poblacionales con filtros por cohorte.
7. **Exportación dual:**
   - `TXT` formateado para pegar en historia clínica.
   - `TSV` estructurado (1 fila, 195 columnas) para pegar en la hoja `HS` del Excel maestro.
8. **Gestión de catálogos** de fármacos y profesionales.

## Reglas críticas de operación

- Primera visita y seguimiento se guardan en la misma hoja (`HS`) para permitir evolución longitudinal.
- La app **no sincroniza automáticamente** con el Excel compartido en tiempo real.
- Para ver nuevas filas añadidas por otros usuarios, hay que **recargar la base de datos** en la app.
- Si se cierra el navegador o la pestaña, hay que volver a cargar el Excel al abrir una nueva sesión.

## Estructura de datos

Archivo maestro: `Hub_Clinico_HS_Canarias.xlsx`

| Hoja | Contenido | Columnas |
|------|-----------|----------|
| `HS` | Registros clínicos de pacientes con HS | 195 (ver contrato de datos) |
| `Profesionales` | Catálogo de profesionales del servicio | Nombre, Cargo, Activo |
| `Consultas` | Catálogo de consultas/clínicas | Nombre |
| `Farmacos_HS` | Fármacos categorizados | Nombre, Categoría, Principio activo, Activo |

## Arquitectura local-first y modo offline

La aplicación está diseñada para funcionar **sin conexión a internet** una vez descargados los archivos:

- **Dependencias vendorizadas** — todas las librerías externas (SheetJS, Chart.js, Font Awesome) están incluidas en la carpeta `vendor/`. No se requiere acceso a CDN.
- **Sin servidor** — funciona con protocolo `file://`, directamente desde el sistema de archivos.
- **Sin backend** — los datos se cargan desde un archivo Excel local y se almacenan temporalmente en `sessionStorage` del navegador.
- **Persistencia manual** — los nuevos registros se exportan como TSV y se pegan manualmente en el Excel maestro compartido.

### Dependencias embebidas

| Librería | Archivo | Uso |
|----------|---------|-----|
| SheetJS | `vendor/xlsx.full.min.js` | Lectura de Excel |
| Chart.js | `vendor/chart.umd.min.js` | Gráficos de dashboard |
| Chart.js date-fns | `vendor/chartjs-adapter-date-fns.bundle.min.js` | Ejes temporales |
| Chart.js annotation | `vendor/chartjs-plugin-annotation.min.js` | Líneas de corte en gráficos |
| Font Awesome | `vendor/fontawesome/` | Iconografía |

## Arquitectura técnica

- **Frontend vanilla JS** — sin frameworks, sin build step.
- **Módulos:** `hubTools.js` (namespace), `dataManager.js`, `scoresHS.js`, `exportManagerHS.js`, `hsConfig.js`, `fieldNormalizer.js`, `utils.js`, `dashboardHS.js`, `statsHS.js`.

## Limitaciones conocidas (diseño intencional)

- Sin backend remoto ni auto-sync por restricciones del entorno hospitalario.
- Escritura en BD por pegado manual de TSV en Excel.
- Dependencia de disciplina operativa para recarga de BD y calidad de nomenclatura.

## Documentación

| Documento | Ruta |
|-----------|------|
| Contrato de datos | `docs/CONTRATO_DATOS_HS.md` |
| Estado de implementación | `docs/ESTADO_IMPLEMENTACION_HS.md` |
| Tests E2E | `docs/TEST_E2E_HS.md` |
| Checklist clínico | `docs/CHECKLIST_E2E_CLINICO.md` |
| Manual de usuario | `docs/manual_usuario.md` |
| Changelog | `docs/CHANGELOG.md` |
| Docs heredados (archivo) | `docs/archive/reuma_original/` |

## Mantenimiento

Cuando se cambie formulario, exportación o lectura de BD, actualizar siempre:

1. Código (`formControllerHS`, `exportManagerHS`, `dataManager`, scripts de página).
2. Contrato de datos (`docs/CONTRATO_DATOS_HS.md`).
3. Cabeceras Excel (`hsConfig.js` → `HS_EXPORT_HEADERS`).
4. Estado funcional (`docs/ESTADO_IMPLEMENTACION_HS.md`).
