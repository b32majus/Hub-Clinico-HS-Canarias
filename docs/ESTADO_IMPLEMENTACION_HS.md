# Estado de Implementación — Hub Clínico HS Canarias

> Versión: **v1.0.0-rc1**
> Fecha: 2026-05-02
> Entorno: Hospital Universitario de Canarias (HUC)

---

## Fases Completadas

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Configuración base y estructura de módulos | ✅ Completada |
| 2 | Formulario primera visita (12 bloques colapsables) | ✅ Completada |
| 3 | Formulario seguimiento (precarga selectiva) | ✅ Completada |
| 4 | Cálculo IHS-4 clínico y ecográfico | ✅ Completada |
| 5 | Exportación TXT + TSV (195 columnas) | ✅ Completada |
| 6 | Dashboard paciente (evolución longitudinal) | ✅ Completada |
| 7 | Estadísticas poblacionales (KPIs, filtros, gráficos) | ✅ Completada |
| 8 | Gestión de catálogos (fármacos, profesionales) | ✅ Completada |
| 9 | Session gate (selección de profesional) | ✅ Completada |
| 10 | Vendorización de dependencias (modo offline) | ✅ Completada |

---

## Módulos Funcionales

| Módulo | Archivo | Función |
|--------|---------|---------|
| Namespace | `modules/hubTools.js` | Utilidades globales del Hub |
| Utilidades | `modules/utils.js` | Helpers genéricos |
| Selects custom | `modules/customSelect.js` | Componentes de selección personalizados |
| Normalizador | `modules/fieldNormalizer.js` | Normalización de campos |
| Datos | `modules/dataManager.js` | Gestión de datos (carga, búsqueda, cache) |
| Configuración HS | `modules/hsConfig.js` | Cabeceras, regiones, tipos de lesión |
| Scores | `modules/scoresHS.js` | Cálculo IHS-4 clínico y ecográfico |
| Exportación | `modules/exportManagerHS.js` | Generación TXT y TSV |
| Dashboard | `modules/dashboardHS.js` | Cuadro de mando individual |
| Estadísticas | `modules/statsHS.js` | Cuadro de mando poblacional |
| Script principal | `script.js` | Búsqueda, session gate, navegación |
| Gestión fármacos | `scripts/script_manage_drugs.js` | CRUD catálogo fármacos |
| Gestión profesionales | `scripts/script_manage_professionals.js` | CRUD catálogo profesionales |

---

## Páginas

| Página | Archivo | Estado |
|--------|---------|--------|
| Inicio | `index.html` | ✅ |
| Primera visita | `primera_visita.html` | ✅ |
| Seguimiento | `seguimiento.html` | ✅ |
| Dashboard paciente | `dashboard_paciente.html` | ✅ |
| Estadísticas | `estadisticas.html` | ✅ |
| Gestión fármacos | `manage_drugs.html` | ✅ |
| Gestión profesionales | `manage_professionals.html` | ✅ |

---

## Dependencias Vendorizadas (modo offline)

| Librería | Archivo vendor | Tamaño |
|----------|---------------|--------|
| SheetJS (XLSX) | `vendor/xlsx.full.min.js` | 861 KB |
| Chart.js | `vendor/chart.umd.min.js` | 200 KB |
| Chart.js date-fns adapter | `vendor/chartjs-adapter-date-fns.bundle.min.js` | 50 KB |
| Chart.js annotation plugin | `vendor/chartjs-plugin-annotation.min.js` | 34 KB |
| Font Awesome CSS | `vendor/fontawesome/all.min.css` | 82 KB |
| Font Awesome webfonts (4) | `vendor/fontawesome/webfonts/*.woff2` | 253 KB |

**Total vendorizado: ~1.5 MB** — la app funciona sin conexión a internet.

---

## Pendientes Conocidos

| Prioridad | Descripción |
|-----------|-------------|
| Media | Validación con datos reales del HUC |
| Baja | Test de usabilidad con usuarios clínicos |
| Baja | Definir flujo de backup de la base Excel |
| Baja | Mejorar responsive en tablets |

---

## Estado

**v1.0.0-rc1 — Listo para test con datos reales.**

Todos los flujos críticos han sido validados con base sintética (24 pacientes, 59 visitas). La app funciona completamente offline gracias a la vendorización de dependencias.
