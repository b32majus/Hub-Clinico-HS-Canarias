# Hub Clínico HS Canarias

Aplicación web local-first para captura estructurada de datos clínicos en **Hidradenitis Supurativa (HS)**, sin instalación y sin backend remoto.

## Estado actual

- **Versión:** 1.0.0
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
   - `TSV` estructurado (1 fila) para pegar en la hoja `HS` del Excel maestro.
8. **Gestión de catálogos** de fármacos y profesionales.

## Reglas críticas de operación

- Primera visita y seguimiento se guardan en la misma hoja (`HS`) para permitir evolución longitudinal.
- La app **no sincroniza automáticamente** con el Excel compartido en tiempo real.
- Para ver nuevas filas añadidas por otros usuarios, hay que **recargar la base de datos** en la app.
- Si se cierra el navegador o la pestaña, hay que volver a cargar el Excel al abrir una nueva sesión.

## Estructura de datos

Archivo maestro: `Hub_Clinico_HS_Canarias.xlsx`

| Hoja | Contenido |
|------|-----------|
| `HS` | Registros clínicos de pacientes con HS (~195 columnas) |
| `Profesionales` | Catálogo de profesionales del servicio |
| `Consultas` | Catálogo de consultas/clínicas |
| `Farmacos_HS` | Fármacos categorizados (Antibióticos, Biológicos, Tópicos, Sistémicos, Otros) |

## Arquitectura

- **Frontend vanilla JS** — sin frameworks, sin build step.
- **Local-first** — funciona con protocolo `file://`, sin servidor.
- **SheetJS (xlsx)** — lectura de archivos Excel en el navegador.
- **Módulos:** `hubTools.js` (namespace), `dataManager.js`, `formControllerHS.js`, `scoresHS.js`, `exportManagerHS.js`, `hsConfig.js`, `fieldNormalizer.js`, `utils.js`.

## Limitaciones conocidas (diseño intencional)

- Sin backend remoto ni auto-sync por restricciones del entorno hospitalario.
- Escritura en BD por pegado manual de TSV en Excel.
- Dependencia de disciplina operativa para recarga de BD y calidad de nomenclatura.

## Mantenimiento

Cuando se cambie formulario, exportación o lectura de BD, actualizar siempre:

1. Código (`formControllerHS`, `exportManagerHS`, `dataManager`, scripts de página).
2. Contrato de datos (`docs/CONTRATO_DATOS_HS.md`).
3. Cabeceras Excel (`hsConfig.js` → `HS_EXPORT_HEADERS`).
4. Estado funcional (`docs/ESTADO_IMPLEMENTACION.md`).
