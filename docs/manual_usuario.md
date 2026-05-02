# Manual de Usuario - Hub Clínico HS Canarias

## 1. Qué es esta herramienta

Aplicación local para registrar visitas de hidradenitis supurativa en el Hospital Universitario de Canarias.

Genera:

- TXT clínico para pegar en historia clínica.
- TSV estructurado para pegar una fila en la hoja `HS` del Excel maestro.

No necesita instalación, servidor externo ni conexión a internet una vez descargada la carpeta completa.

## 2. Antes de empezar

Necesitas:

- Acceso al archivo `Hub_Clinico_HS_Canarias.xlsx`.
- Navegador actualizado.
- Carpeta completa de la app, incluida `vendor/`.

## 3. Inicio de sesión de trabajo

1. Abrir `index.html`.
2. Pulsar **Cargar Base de Datos (.xlsx)**.
3. Seleccionar `Hub_Clinico_HS_Canarias.xlsx`.
4. Seleccionar profesional.
5. Confirmar que el indicador lateral muestra la BD cargada.

## 4. Registrar una primera visita

1. Entrar en **Primera visita HS**.
2. Completar datos obligatorios y bloques clínicos.
3. Revisar el cálculo automático de IHS-4.
4. Generar y copiar primero el **TXT** para historia clínica.
5. Copiar el **TSV**.
6. Pegar la fila en la hoja `HS` del Excel maestro.

## 5. Registrar un seguimiento

1. Buscar el paciente por NHC.
2. Entrar en **Visita de seguimiento** desde quick view o dashboard.
3. Revisar el contexto de última visita.
4. Completar la actividad clínica actual.
5. Generar TXT y después TSV.
6. Pegar la nueva fila en la hoja `HS`.

## 6. Dashboards

- Quick view: resumen rápido tras búsqueda por NHC.
- Dashboard paciente: evolución longitudinal de IHS-4, PROMs, tratamientos, eventos y tabla de visitas.
- Estadísticas: visión poblacional con separación entre estado actual de pacientes y actividad asistencial.

## 7. Regla crítica de actualización

La app no sincroniza automáticamente con el Excel.

Si alguien añade filas nuevas en Excel, la sesión abierta no las verá hasta recargar la base de datos.

## 8. Buenas prácticas

- Pegar siempre en una fila nueva de la hoja `HS`.
- No modificar el orden de columnas del Excel maestro.
- Generar siempre TXT antes que TSV.
- Recargar la BD si se sospecha que el Excel compartido ha cambiado.
- Usar nomenclatura consistente en fármacos, consultas y profesionales.

## 9. Errores frecuentes

- **No encuentro un paciente:** recargar BD y repetir búsqueda por NHC.
- **No salen cambios en estadísticas:** la sesión puede tener una versión antigua del Excel.
- **No puedo copiar TSV:** primero hay que generar TXT.
- **Fila mal pegada:** revisar que se pegó en la hoja `HS` y que no se desplazaron columnas.

## 10. Archivos de referencia

- Contrato de datos: `docs/CONTRATO_DATOS_HS.md`.
- Estado de implementación: `docs/ESTADO_IMPLEMENTACION_HS.md`.
- Checklist clínico: `docs/CHECKLIST_E2E_CLINICO.md`.
