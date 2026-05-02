// modules/fieldNormalizer.js — Normalización canónica de campos para HS
// Sobrescribe el normalizer genérico del repo base

const HS_FIELD_ALIASES = {
  nhc: ['NHC', 'nhc', 'NHC_Paciente', 'Numero_Historia', 'Historia_Clinica'],
  fechaVisita: ['Fecha_Visita', 'fechaVisita', 'Fecha'],
  tipoVisita: ['Tipo_Visita', 'tipoVisita'],
  profesional: ['Profesional', 'Medico', 'Dermatologo'],
  consulta: ['Consulta', 'Tipo_Consulta'],
  sexo: ['Sexo', 'sexoPaciente'],
  hurley: ['Hurley', 'Estadio_Hurley'],
  ihs4Clinico: ['IHS4_Clinico', 'IHS4', 'IHS_4'],
  ihs4Categoria: ['IHS4_Clinico_Categoria', 'IHS4_Categoria'],
  tratamientoActual: ['Tratamiento_Actual', 'tratamientoActual'],
  decisionTerapeutica: ['Decision_Terapeutica', 'decisionTerapeutica'],
  fechaProximaRevision: ['Fecha_Proxima_Revision', 'fechaProximaRevision']
};

function getCanonicalField(record, fieldName, fallback = null) {
  if (!record || typeof record !== 'object') return fallback;
  const aliases = HS_FIELD_ALIASES[fieldName] || [fieldName];
  for (const key of aliases) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
      return record[key];
    }
  }
  return fallback;
}

function normalizeRecordHS(record, extra) {
  const normalized = {
    ...record,
    nhc: getCanonicalField(record, 'nhc', ''),
    fechaVisita: getCanonicalField(record, 'fechaVisita', ''),
    tipoVisita: getCanonicalField(record, 'tipoVisita', ''),
    profesional: getCanonicalField(record, 'profesional', ''),
    consulta: getCanonicalField(record, 'consulta', ''),
    sexo: getCanonicalField(record, 'sexo', ''),
    hurley: getCanonicalField(record, 'hurley', ''),
    ihs4Clinico: getCanonicalField(record, 'ihs4Clinico', ''),
    ihs4Categoria: getCanonicalField(record, 'ihs4Categoria', ''),
    tratamientoActual: getCanonicalField(record, 'tratamientoActual', ''),
    decisionTerapeutica: getCanonicalField(record, 'decisionTerapeutica', ''),
    fechaProximaRevision: getCanonicalField(record, 'fechaProximaRevision', '')
  };
  return { ...normalized, ...(extra || {}) };
}

if (typeof HubTools !== 'undefined') {
  HubTools.normalizer.HS_FIELD_ALIASES = HS_FIELD_ALIASES;
  HubTools.normalizer.getCanonicalField = getCanonicalField;
  HubTools.normalizer.normalizeRecordHS = normalizeRecordHS;
}
