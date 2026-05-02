# Registro de Tests End-to-End — Hub Clínico HS Canarias

> Fecha: 2026-05-02
> Versión probada: v1.0.0
> Base de datos: `Hub_Clinico_HS_Canarias_BASE_SINTETICA_TEST.xlsx` (24 pacientes, 59 visitas)

---

## Resumen Ejecutivo

Todos los flujos principales del Hub Clínico HS Canarias han sido validados manualmente con Chrome DevTools usando la base sintética. El sistema está operativo para uso local con arquitectura local-first (Excel → sessionStorage → TSV export).

| Métrica | Valor |
|---------|-------|
| Pacientes sintéticos | 24 |
| Visitas totales | 59 |
| Profesionales en BD | 3 |
| Tests ejecutados | 14 |
| Tests aprobados | 14 |
| Tests fallidos | 0 |

---

## Fase 1: Carga de Base de Datos

| Test | Resultado | Notas |
|------|-----------|-------|
| Carga Excel sintético | ✅ PASSED | BD cargada correctamente, profesionales disponibles |
| Session gate (selección profesional) | ✅ PASSED | Gate funciona, redirige si no hay selección |

---

## Fase 2: Búsqueda y Quick View

| Test | Resultado | Notas |
|------|-----------|-------|
| Búsqueda NHC `TEST-HS-001` en sidebar | ✅ PASSED | Quick View muestra IHS-4=17 (Grave), Hurley=II, DLQI=27, EVA=9.5 |
| Búsqueda NHC `TEST-HS-001` en buscador central | ✅ PASSED | Sincronización sidebar/central correcta |
| Click icono búsqueda sidebar | ✅ PASSED | Busca y muestra Quick View |
| Click icono búsqueda central | ✅ PASSED | Busca y muestra Quick View |
| Paciente inexistente `TEST-NO-EXISTE` | ✅ PASSED | Muestra "Paciente No Encontrado" + enlace a primera visita |
| Botón clear búsqueda | ✅ PASSED | Cierra Quick View, limpia inputs, restaura dashboard |
| Tecla Enter en búsquedas | ✅ PASSED | Dispara búsqueda correctamente |

**Datos verificados en Quick View (`TEST-HS-001`):**
- NHC: TEST-HS-001
- Última visita: 19 ene 2026
- IHS-4: 17 (Grave)
- Categoría: Grave
- Hurley: II
- DLQI: 27
- EVA Dolor: 9.5
- Tratamiento activo: [correcto según BD]

---

## Fase 3: Dashboard Paciente

| Test | Resultado | Notas |
|------|-----------|-------|
| Dashboard abre con `?nhc=TEST-HS-001` | ✅ PASSED | Datos correctos |
| Evolución IHS-4 longitudinal | ✅ PASSED | Gráfico muestra evolución 6→17 con líneas de corte |
| KPIs (8 tarjetas) | ✅ PASSED | IHS-4 basal, último IHS-4, cambio absoluto, DLQI, EVA, cirugía, próxima revisión |
| Eventos clínicos | ✅ PASSED | Timeline con tratamientos, cirugía, comité |
| Tabla de visitas | ✅ PASSED | 4 visitas listadas con fecha, tipo, IHS-4, categoría, Hurley |

---

## Fase 4: Estadísticas Poblacionales

| Test | Resultado | Notas |
|------|-----------|-------|
| KPIs (10 tarjetas) | ✅ PASSED | 24 pacientes, 59 visitas, IHS-4 media=16.0, mediana DLQI=17.5 |
| Filtros funcionales | ✅ PASSED | 10 filtros con auto-aplicación debounce |
| Tabla paginada | ✅ PASSED | Columnas correctas, búsqueda, ordenamiento |
| Gráficos (7) | ✅ PASSED | Distribución severidad, Hurley, tratamientos, origen, cirugía, evolución temporal, PROMs |

---

## Fase 5: Primera Visita

| Test | Resultado | Notas |
|------|-----------|-------|
| Formulario carga sin errores | ✅ PASSED | 12 bloques colapsables |
| Matriz 12 regiones × 4 lesiones | ✅ PASSED | Inputs funcionan, totales auto-calculados |
| IHS-4 auto-calculado | ✅ PASSED | Prueba: Axila Der(2,1,0,1) + Inguinal Izq(1,0,0,0) → IHS-4=9 (Moderada) |
| Chips comorbilidades | ✅ PASSED | Toggle SI/NO funcionan |
| Ecografía condicional | ✅ PASSED | Campos eco aparecen solo si "Sí" |
| Selects fármacos poblados | ✅ PASSED | 4 selects de tratamiento desde `Farmacos_HS` |
| Exportación TXT | ✅ PASSED | Genera `TXT_Historia_Generado=SI` |
| Exportación TSV (gated) | ✅ PASSED | Exactamente 195 columnas alineadas |

---

## Fase 6: Seguimiento

| Test | Resultado | Notas |
|------|-----------|-------|
| Panel contexto última visita | ✅ PASSED | Muestra datos de última visita en solo lectura |
| Precarga datos estables | ✅ PASSED | Sexo, antropometría, comorbilidades precargados |
| Lesiones/IHS-4/PROMs NO precargados | ✅ PASSED | Campos de actividad quedan vacíos |
| Tipo_Visita="Seguimiento" forzado | ✅ PASSED | Input readonly con valor correcto |
| Gate TXT→TSV | ✅ PASSED | Mismo mecanismo que primera visita |

---

## Fase 7: Gestión de Catálogos

| Test | Resultado | Notas |
|------|-----------|-------|
| Gestión fármacos | ✅ PASSED | Lista desde BD, filtra activos |
| Gestión profesionales | ✅ PASSED | Lista desde BD, filtra activos |

---

## Bugs Corregidos Durante Tests

| # | Archivo | Bug | Corrección |
|---|---------|-----|------------|
| 1 | `modules/dashboardHS.js` | No cargaba BD al navegar directamente | `initDatabaseFromStorage()` en DOMContentLoaded |
| 2 | `modules/statsHS.js` | KPIs en 0 al navegar directamente | `initDatabaseFromStorage()` en DOMContentLoaded |
| 3 | `modules/formControllerHS.js` | Selects vacíos al navegar directamente | `initDatabaseFromStorage()` en DOMContentLoaded |
| 4 | `script.js` | Iconos/clear/búsqueda sin listeners | `initPatientSearch()` añadido |

---

## Entorno de Prueba

| Parámetro | Valor |
|-----------|-------|
| Navegador | Chrome (via Chrome DevTools) |
| Plataforma | Windows 11 Pro |
| Servidor | `file://` (local) |
| Base de datos | `Hub_Clinico_HS_Canarias_BASE_SINTETICA_TEST.xlsx` |
| Método de carga | Input file + `FileReader` + `XLSX` |

---

## Conclusión

El Hub Clínico HS Canarias v1.0.0 está **funcionalmente validado** para uso local. Todos los flujos críticos operan correctamente con la base sintética de 24 pacientes. No quedan referencias clínicas heredadas en código activo.

**Próximos pasos sugeridos:**
- Validación con datos reales del HUC
- Test de usabilidad con usuarios clínicos
- Definir flujo de backup de la base Excel
