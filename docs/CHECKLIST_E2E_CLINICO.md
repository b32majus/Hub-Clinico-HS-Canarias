# Checklist E2E Clínico - Hub Clínico HS Canarias

Usar primero `Hub_Clinico_HS_Canarias_BASE_SINTETICA_TEST.xlsx`.

## 1. Carga y sesión

- Abrir `index.html` sin errores visibles.
- Cargar Excel maestro.
- Confirmar hojas `HS`, `Profesionales`, `Consultas` y `Farmacos_HS`.
- Seleccionar profesional.
- Confirmar indicador lateral de BD cargada.

## 2. Búsqueda y quick view

- Buscar NHC existente desde sidebar con Enter.
- Buscar NHC existente desde caja central con Enter.
- Buscar usando iconos de lupa.
- Confirmar que quick view muestra la última visita.
- Buscar NHC inexistente y confirmar opción de primera visita.
- Probar botón limpiar.

## 3. Primera visita HS

- Abrir primera visita.
- Confirmar consultas, profesionales y fármacos activos.
- Completar datos mínimos obligatorios.
- Registrar comorbilidades con chips.
- Introducir lesiones por región y confirmar totales/IHS-4.
- Marcar ecografía y comprobar que aparecen hallazgos.
- Generar TXT.
- Confirmar que TSV queda habilitado después del TXT.
- Copiar TSV y validar 195 columnas.

## 4. Seguimiento HS

- Abrir `seguimiento.html?nhc=...`.
- Confirmar contexto de última visita.
- Confirmar precarga de datos estables.
- Confirmar que lesiones, IHS-4, PROMs y decisión actual no se precargan.
- Generar TXT y TSV.

## 5. Dashboard paciente

- Abrir `dashboard_paciente.html?nhc=...`.
- Confirmar evolución IHS-4.
- Confirmar PROMs, eventos, tratamientos y tabla de visitas.
- Probar paciente con una sola visita.

## 6. Estadísticas

- Abrir estadísticas desde sesión cargada.
- Confirmar pacientes únicos.
- Confirmar visitas totales filtradas.
- Confirmar primeras visitas y seguimientos.
- Probar filtros.
- Confirmar tabla de últimas visitas por paciente.

## 7. Gestión

- Confirmar que fármacos inactivos no aparecen como activos.
- Confirmar que profesionales inactivos no aparecen como activos.
- Confirmar que añadir/eliminar en pantalla es temporal salvo copia manual al Excel.

## 8. Offline

- Bloquear red.
- Recargar `index.html`, primera visita, seguimiento, dashboard y estadísticas.
- Confirmar que no hay errores por CDN.
- Confirmar que iconos y gráficos cargan desde `vendor/`.

## 9. LibreOffice

- Pegar TSV en hoja `HS`.
- Confirmar una sola fila.
- Confirmar 195 columnas alineadas.
- Confirmar ausencia de BOM visible.
