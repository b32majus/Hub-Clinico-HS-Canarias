# TODO - Hub Clínico HS Canarias

## Estado actual

La app está en fase `v1.0.0-rc1`, orientada a prueba clínica controlada con base sintética y Excel vacío/realista antes de uso con datos reales.

## Pendientes antes de prueba clínica

- Ejecutar checklist E2E completo con `Hub_Clinico_HS_Canarias_BASE_SINTETICA_TEST.xlsx`.
- Repetir prueba con red bloqueada para confirmar modo offline real.
- Validar pegado TSV en LibreOffice Calc sobre la hoja `HS`.
- Revisar visualmente primera visita y seguimiento en portátil hospitalario.
- Confirmar que el equipo clínico entiende la diferencia entre métricas de estado actual y actividad asistencial.

## Pendientes no bloqueantes

- Extraer búsqueda y quick view de `script.js` a un módulo propio.
- Añadir pruebas automatizadas ligeras para conteo TSV y reglas de estadísticas.
- Pulir responsive de la matriz anatómica.
- Valorar sticky summary en formularios largos.
- Mantener documentación viva sincronizada con `HS_EXPORT_HEADERS`.

Última revisión: 2026-05-02.
