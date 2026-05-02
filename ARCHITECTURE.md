# Hub Clínico HS Canarias - Arquitectura e Implementación

Documento de memoria técnica para entender cómo está codificada la app, qué módulos existen y cómo fluye la información en el entorno HUC.

## 1. Restricciones de diseño

- App local-first, sin backend remoto.
- Sin instalación obligatoria.
- Ejecución como estáticos HTML/CSS/JS.
- Persistencia operativa en Excel local o compartido: `Hub_Clinico_HS_Canarias.xlsx`.
- Compatibilidad con apertura directa por `file://` y publicación estática.
- Dependencias críticas embebidas en `vendor/`.

## 2. Arquitectura de ejecución

- Patrón global por namespace `HubTools`.
- Módulos funcionales en `modules/`.
- Scripts ligeros por pantallas de gestión en `scripts/`.
- Sin framework, bundler ni servidor.

Namespaces principales:

- `HubTools.form`: validación, recopilación, precarga de seguimiento y control del formulario HS.
- `HubTools.scoresHS`: cálculo IHS-4 clínico/ecográfico y categorización.
- `HubTools.data`: carga Excel, rehidratación desde `sessionStorage`, búsquedas y catálogos.
- `HubTools.export`: generación de TXT clínico y TSV estructurado.
- `HubTools.normalizer`: normalización de campos HS.
- `HubTools.utils`: utilidades transversales.

## 3. Pantallas

- `index.html` + `script.js`: inicio, carga de BD, selección de profesional, búsqueda y quick view.
- `primera_visita.html` + `modules/formControllerHS.js`: primera visita HS.
- `seguimiento.html` + `modules/formControllerHS.js`: visita de seguimiento HS con contexto de última visita.
- `dashboard_paciente.html` + `modules/dashboardHS.js`: evolución longitudinal individual.
- `estadisticas.html` + `modules/statsHS.js`: cuadro poblacional y actividad asistencial.
- `manage_drugs.html` + `scripts/script_manage_drugs.js`: catálogo temporal de fármacos HS.
- `manage_professionals.html` + `scripts/script_manage_professionals.js`: catálogo temporal de profesionales.

## 4. Flujo de datos real

1. El usuario carga `Hub_Clinico_HS_Canarias.xlsx`.
2. `dataManager.loadDatabase()` parsea las hojas `HS`, `Profesionales`, `Consultas` y `Farmacos_HS`.
3. La sesión se guarda temporalmente en `sessionStorage`.
4. Los formularios generan primero TXT para historia clínica.
5. Tras generar TXT, se habilita TSV de una sola fila para pegar en la hoja `HS`.
6. Dashboards y estadísticas consumen la copia de BD cargada en la sesión.

## 5. Contrato de datos

- Hoja clínica única: `HS`.
- Una fila representa una visita, no un paciente.
- Identificador principal: `NHC`.
- Tipo de visita: `Primera_Visita` o `Seguimiento`.
- Exportación estructurada: `HS_EXPORT_HEADERS`, 195 columnas, sin cabecera y separado por tabuladores.

## 6. Precarga en seguimiento

Se precargan datos estables:

- NHC, centro, consulta y profesional.
- Datos basales disponibles.
- Comorbilidades.
- Tratamiento actual y fecha de inicio.

No se precargan datos dinámicos de la visita actual:

- Recuento de lesiones.
- IHS-4.
- PROMs.
- Decisión terapéutica actual.
- Cirugía/comité actual.

## 7. Riesgos conocidos

- La sesión trabaja con una copia cargada de la BD; si el Excel cambia fuera de la app hay que recargarlo.
- `sessionStorage` puede limitarse con bases muy grandes; la app avisa si la caché queda limitada.
- La escritura en Excel depende del pegado manual correcto de la fila TSV.
- Cualquier cambio de cabeceras debe actualizar `modules/hsConfig.js`, el Excel y `docs/CONTRATO_DATOS_HS.md`.

Última actualización: 2026-05-02.
