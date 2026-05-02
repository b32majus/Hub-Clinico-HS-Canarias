# Contrato de Datos — Hub Clínico HS Canarias

> Versión: 1.0.0-rc1
> Fecha: 2026-05-02
> Identificador principal: **NHC** (Número de Historia Clínica)

---

## Resumen

El Hub Clínico HS Canarias captura datos estructurados de pacientes con **Hidradenitis Supurativa (CIE-10: L73.2)** en el Hospital Universitario de Canarias. El contrato define las 195 cabeceras de exportación, el score IHS-4, y el flujo de datos.

---

## Cabeceras de Exportación (195 columnas)

Las cabeceras están definidas en `modules/hsConfig.js` → `HS_EXPORT_HEADERS`, organizadas en 13 bloques:

| Bloque | Campos | Descripción |
|--------|--------|-------------|
| A — Identificación | 9 | NHC, Fecha_Visita, Tipo_Visita, Centro, Consulta, Profesional, Origen_Paciente, CIE10, Motivo_Consulta |
| B — Datos basales | 17 | Sexo, Edad, Año nacimiento, Año inicio síntomas, Año diagnóstico, Retraso diagnóstico, Antecedentes familiares, Tabaquismo, Peso, Talla, IMC |
| C — Comorbilidades | 20 | Diabetes, HTA, Dislipemia, Obesidad, Síndrome metabólico, ECV, Esteatosis hepática, EII, Crohn, Colitis ulcerosa, Artritis, Psoriasis, Acné, Sinus pilonidal, SOP, Depresión, Ansiedad, PASH/PAPASH, Pioderma gangrenoso, Foliculitis decalvante, Otras |
| D — Actividad clínica | 13 | Hurley, Nódulos/Abscesos/Fístulas/Fístulas drenantes (total), IHS-4 clínico + categoría, Dolor/Prurito/Supuración EVA, Brotes 3m, Visitas urgencias 6m, Antibióticos 6m |
| E — Lesiones por región | 49 | 12 regiones × 4 tipos de lesión + 1 descripción |
| F — Cicatrices | 4 | Cicatrices, Descripción, Túneles crónicos, Limitación funcional |
| G — Ecografía | 9 | Eco realizada, Eco nódulos/abscesos/fístulas/fístulas drenantes, IHS-4 ecográfico + categoría, Doppler, Hallazgos |
| H — PROMs | 10 | DLQI, HSQoL-24, EVA dolor paciente, EVA impacto global, EVA olor, EVA supuración, Días baja, Impacto laboral, Impacto sexual, Comentarios |
| I — Tratamiento | 24 | Tratamiento actual + fecha, Previos (antibióticos ×3, biológicos ×3, otros ×2 con dosis), Tratamiento indicado (antibiótico, biológico, tópico, otro con dosis) |
| J — Decisión terapéutica | 10 | Decisión, Continuar, Optimizar adherencia, Ajuste dosis, Cambio tratamiento + motivo, Efectos adversos + descripción, Suspensión + motivo |
| K — Cirugía/Comité | 13 | Requiere cirugía, Derivaciones (5 especialidades), Región quirúrgica, Prioridad, Cirugía realizada + fecha + resultado, Comité + decisión, Comentarios |
| L — Analítica/Preventiva | 10 | Analítica solicitada/realizada, Medicina preventiva solicitada/realizada, Vacunación, Cribado TB/Hepatitis/VIH, Observaciones |
| M — Cierre | 6 | Plan clínico, Próxima revisión, Comentarios adicionales, TXT generado, Fecha exportación, Versión app |

**Total: 195 cabeceras**

---

## Regiones Anatómicas (12)

1. Axila derecha
2. Axila izquierda
3. Inframamaria derecha
4. Inframamaria izquierda
5. Inguinal derecha
6. Inguinal izquierda
7. Genital
8. Perineal
9. Perianal
10. Glútea derecha
11. Glútea izquierda
12. Otra región

---

## Score IHS-4

**Fórmula:** `IHS-4 = Nódulos + 2 × Abscesos + 4 × Fístulas drenantes`

| Categoría | Rango |
|-----------|-------|
| Leve | 0–3 |
| Moderada | 4–10 |
| Grave | >10 |

Se calculan dos variantes:
- **IHS-4 Clínico** — basado en recuento clínico de lesiones
- **IHS-4 Ecográfico** — basado en recuento ecográfico

---

## Hojas Excel

| Hoja | Contenido |
|------|-----------|
| `HS` | Registros clínicos de pacientes (195 columnas) |
| `Profesionales` | Catálogo de profesionales del servicio |
| `Consultas` | Catálogo de consultas/clínicas |
| `Farmacos_HS` | Fármacos categorizados (Antibióticos, Biológicos, Tópicos, Sistémicos, Otros) |

---

## Campos Bloqueantes

| Campo | Motivo |
|-------|--------|
| `NHC` | Identificador único de paciente |
| `Fecha_Visita` | Fecha de la consulta |
| `Tipo_Visita` | Primera_Visita o Seguimiento |

---

## Flujo de Datos

```
Excel (.xlsx) → sessionStorage → Formulario → TXT (historia clínica)
                                          → TSV (1 fila, 195 columnas → pegar en Excel)
```

1. Carga del Excel maestro en navegador (FileReader + SheetJS)
2. Datos almacenados en `sessionStorage` (por sesión, no persistente)
3. Formulario de primera visita o seguimiento captura datos
4. Exportación dual:
   - **TXT** — texto formateado para pegar en historia clínica electrónica
   - **TSV** — 1 fila tabulada para pegar en hoja `HS` del Excel maestro
