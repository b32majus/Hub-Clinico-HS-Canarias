// modules/hsConfig.js — Configuración específica para Hidradenitis Suppurativa
// Hub Clínico HS Canarias v1.0

const HS_APP_CONFIG = {
  appName: 'Hub Clínico HS Canarias',
  hospitalName: 'Hospital Universitario de Canarias',
  version: '1.0.0',
  clinicalSheet: 'HS',
  professionalsSheet: 'Profesionales',
  consultationsSheet: 'Consultas',
  drugsSheet: 'Farmacos_HS',
  patientIdField: 'NHC',
  defaultCIE10: 'L73.2'
};

const HS_VISIT_TYPES = {
  FIRST: 'Primera_Visita',
  FOLLOW_UP: 'Seguimiento'
};

const HS_IHS4_CATEGORIES = {
  MILD: 'Leve',
  MODERATE: 'Moderada',
  SEVERE: 'Grave'
};

const HS_REGIONS = [
  { key: 'Axila_Der', label: 'Axila derecha' },
  { key: 'Axila_Izq', label: 'Axila izquierda' },
  { key: 'Inframamaria_Der', label: 'Inframamaria derecha' },
  { key: 'Inframamaria_Izq', label: 'Inframamaria izquierda' },
  { key: 'Inguinal_Der', label: 'Inguinal derecha' },
  { key: 'Inguinal_Izq', label: 'Inguinal izquierda' },
  { key: 'Genital', label: 'Genital' },
  { key: 'Perineal', label: 'Perineal' },
  { key: 'Perianal', label: 'Perianal' },
  { key: 'Glutea_Der', label: 'Glútea derecha' },
  { key: 'Glutea_Izq', label: 'Glútea izquierda' },
  { key: 'Otra_Region', label: 'Otra región' }
];

const HS_LESION_TYPES = [
  { key: 'Nodulos', label: 'Nódulos' },
  { key: 'Abscesos', label: 'Abscesos' },
  { key: 'Fistulas', label: 'Fístulas' },
  { key: 'Fistulas_Drenantes', label: 'Fístulas drenantes' }
];

// 195 cabeceras de exportación — orden estricto
const HS_EXPORT_HEADERS = [
  // Bloque A — Identificación (9)
  'NHC', 'Fecha_Visita', 'Tipo_Visita', 'Centro', 'Consulta', 'Profesional', 'Origen_Paciente', 'CIE10', 'Motivo_Consulta',
  // Bloque B — Datos basales (17)
  'Sexo', 'Edad', 'Anio_Nacimiento', 'Anio_Inicio_Sintomas', 'Anio_Diagnostico', 'Retraso_Diagnostico_Anios', 'Antecedentes_Familiares_HS', 'Fumador', 'Cigarros_Dia', 'Anios_Fumador', 'Exfumador', 'Peso', 'Talla', 'IMC',
  // Bloque C — Comorbilidades (20)
  'Comorbilidad_Diabetes', 'Comorbilidad_HTA', 'Comorbilidad_Dislipemia', 'Comorbilidad_Obesidad', 'Comorbilidad_Sindrome_Metabolico', 'Comorbilidad_ECV', 'Comorbilidad_Esteatosis_Hepatica', 'Comorbilidad_EII', 'Comorbilidad_Crohn', 'Comorbilidad_Colitis_Ulcerosa', 'Comorbilidad_Artritis', 'Comorbilidad_Psoriasis', 'Comorbilidad_Acne', 'Comorbilidad_Sinus_Pilonidal', 'Comorbilidad_SOP', 'Comorbilidad_Depresion', 'Comorbilidad_Ansiedad', 'Comorbilidad_PASH_PAPASH', 'Comorbilidad_Pioderma_Gangrenoso', 'Comorbilidad_Foliculitis_Decalvante', 'Comorbilidad_Otras',
  // Bloque D — Actividad clínica (13)
  'Hurley', 'Nodulos_Total', 'Abscesos_Total', 'Fistulas_Total', 'Fistulas_Drenantes_Total', 'IHS4_Clinico', 'IHS4_Clinico_Categoria', 'Dolor_EVA', 'Prurito_EVA', 'Supuracion_EVA', 'Brotes_Ultimos_3_Meses', 'Visitas_Urgencias_HS_Ultimos_6_Meses', 'Antibioticos_Ultimos_6_Meses',
  // Bloque E — Lesiones por región (12 regiones × 4 tipos + 1 descripción = 49)
  'Axila_Der_Nodulos', 'Axila_Der_Abscesos', 'Axila_Der_Fistulas', 'Axila_Der_Fistulas_Drenantes',
  'Axila_Izq_Nodulos', 'Axila_Izq_Abscesos', 'Axila_Izq_Fistulas', 'Axila_Izq_Fistulas_Drenantes',
  'Inframamaria_Der_Nodulos', 'Inframamaria_Der_Abscesos', 'Inframamaria_Der_Fistulas', 'Inframamaria_Der_Fistulas_Drenantes',
  'Inframamaria_Izq_Nodulos', 'Inframamaria_Izq_Abscesos', 'Inframamaria_Izq_Fistulas', 'Inframamaria_Izq_Fistulas_Drenantes',
  'Inguinal_Der_Nodulos', 'Inguinal_Der_Abscesos', 'Inguinal_Der_Fistulas', 'Inguinal_Der_Fistulas_Drenantes',
  'Inguinal_Izq_Nodulos', 'Inguinal_Izq_Abscesos', 'Inguinal_Izq_Fistulas', 'Inguinal_Izq_Fistulas_Drenantes',
  'Genital_Nodulos', 'Genital_Abscesos', 'Genital_Fistulas', 'Genital_Fistulas_Drenantes',
  'Perineal_Nodulos', 'Perineal_Abscesos', 'Perineal_Fistulas', 'Perineal_Fistulas_Drenantes',
  'Perianal_Nodulos', 'Perianal_Abscesos', 'Perianal_Fistulas', 'Perianal_Fistulas_Drenantes',
  'Glutea_Der_Nodulos', 'Glutea_Der_Abscesos', 'Glutea_Der_Fistulas', 'Glutea_Der_Fistulas_Drenantes',
  'Glutea_Izq_Nodulos', 'Glutea_Izq_Abscesos', 'Glutea_Izq_Fistulas', 'Glutea_Izq_Fistulas_Drenantes',
  'Otra_Region_Nodulos', 'Otra_Region_Abscesos', 'Otra_Region_Fistulas', 'Otra_Region_Fistulas_Drenantes',
  'Otra_Region_Descripcion',
  // Bloque F — Cicatrices (4)
  'Cicatrices', 'Cicatrices_Descripcion', 'Tuneles_Cronicos', 'Limitacion_Funcional', 'Limitacion_Funcional_Descripcion',
  // Bloque G — Ecografía (9)
  'Ecografia_Realizada', 'Eco_Nodulos_Total', 'Eco_Abscesos_Total', 'Eco_Fistulas_Total', 'Eco_Fistulas_Drenantes_Total', 'IHS4_Ecografico', 'IHS4_Ecografico_Categoria', 'Doppler_Positivo', 'Hallazgos_Ecograficos',
  // Bloque H — PROMs (10)
  'DLQI', 'HSQoL24', 'EVA_Dolor_Paciente', 'EVA_Impacto_Global', 'EVA_Olor', 'EVA_Supuracion', 'Dias_Baja_Ultimos_6_Meses', 'Impacto_Laboral', 'Impacto_Sexual', 'Comentarios_PROMs',
  // Bloque I — Tratamiento (24)
  'Tratamiento_Actual', 'Fecha_Inicio_Tratamiento_Actual', 'Previo_Antibiotico_1', 'Previo_Antibiotico_Dosis_1', 'Previo_Antibiotico_2', 'Previo_Antibiotico_Dosis_2', 'Previo_Antibiotico_3', 'Previo_Antibiotico_Dosis_3', 'Previo_Biologico_1', 'Previo_Biologico_Dosis_1', 'Previo_Biologico_2', 'Previo_Biologico_Dosis_2', 'Previo_Biologico_3', 'Previo_Biologico_Dosis_3', 'Previo_Otro_Sistemico_1', 'Previo_Otro_Sistemico_Dosis_1', 'Previo_Otro_Sistemico_2', 'Previo_Otro_Sistemico_Dosis_2', 'Trat_Antibiotico', 'Trat_Antibiotico_Dosis', 'Trat_Biologico', 'Trat_Biologico_Dosis', 'Trat_Topico', 'Trat_Topico_Dosis', 'Trat_Otro', 'Trat_Otro_Dosis',
  // Bloque J — Decisión terapéutica (10)
  'Decision_Terapeutica', 'Continuar_Tratamiento', 'Optimizar_Adherencia', 'Ajuste_Dosis', 'Cambio_Tratamiento', 'Cambio_Motivo', 'Efectos_Adversos', 'Efectos_Adversos_Descripcion', 'Suspension_Tratamiento', 'Suspension_Motivo',
  // Bloque K — Cirugía/comité (13)
  'Requiere_Cirugia', 'Derivacion_Dermatologia_Quirurgica', 'Derivacion_Cirugia_General', 'Derivacion_Cirugia_Plastica', 'Derivacion_Ginecologia', 'Derivacion_Urologia', 'Region_Quirurgica', 'Prioridad_Quirurgica', 'Cirugia_Realizada', 'Fecha_Cirugia', 'Resultado_Cirugia', 'Comite_Multidisciplinar', 'Decision_Comite', 'Comentarios_Cirugia_Comite',
  // Bloque L — Analítica/preventiva (10)
  'Analitica_Solicitada', 'Analitica_Realizada', 'Medicina_Preventiva_Solicitada', 'Medicina_Preventiva_Realizada', 'Vacunacion_Revisada', 'Cribado_TB', 'Cribado_Hepatitis', 'Cribado_VIH', 'Observaciones_Preventiva',
  // Bloque M — Cierre (6)
  'Plan_Clinico', 'Fecha_Proxima_Revision', 'Comentarios_Adicionales', 'TXT_Historia_Generado', 'Fecha_Exportacion', 'Version_App'
];

// Exponer globalmente
if (typeof HubTools !== 'undefined') {
  HubTools.hsConfig = {
    APP_CONFIG: HS_APP_CONFIG,
    VISIT_TYPES: HS_VISIT_TYPES,
    IHS4_CATEGORIES: HS_IHS4_CATEGORIES,
    REGIONS: HS_REGIONS,
    LESION_TYPES: HS_LESION_TYPES,
    EXPORT_HEADERS: HS_EXPORT_HEADERS
  };
}
