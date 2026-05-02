// modules/scoresHS.js — Cálculo de puntuaciones para Hidradenitis Supurativa

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

function calculateIHS4({ nodulos, abscesos, fistulasDrenantes }) {
  return toNumber(nodulos) + (toNumber(abscesos) * 2) + (toNumber(fistulasDrenantes) * 4);
}

function categorizeIHS4(score) {
  if (score === null || score === undefined || score === '') return 'ND';
  const num = toNumber(score);
  if (num <= 3) return 'Leve';
  if (num <= 10) return 'Moderada';
  return 'Grave';
}

function calculateIMC(peso, tallaCm) {
  const p = toNumber(peso, null);
  const t = toNumber(tallaCm, null);
  if (p === null || t === null || t === 0) return null;
  const tallaM = t / 100;
  return parseFloat((p / (tallaM * tallaM)).toFixed(2));
}

function calculateDiagnosticDelay(anioInicio, anioDiagnostico) {
  const inicio = toNumber(anioInicio, null);
  const diag = toNumber(anioDiagnostico, null);
  if (inicio === null || diag === null) return null;
  return diag - inicio;
}

function validatePROMValue(value, min, max) {
  const num = toNumber(value, null);
  if (num === null) return true; // vacío es válido (no obligatorio)
  return num >= min && num <= max;
}

function sumRegionLesions(regionData) {
  // regionData: objeto con claves {Region}_{Tipo}
  // IMPORTANTE: usar endsWith para detectar correctamente Fistulas_Drenantes
  // (split('_') y tomar última parte falla: Axila_Der_Fistulas_Drenantes → "Drenantes")
  const totals = { Nodulos: 0, Abscesos: 0, Fistulas: 0, Fistulas_Drenantes: 0 };
  Object.keys(regionData).forEach(key => {
    const val = toNumber(regionData[key]);
    if (key.endsWith('_Fistulas_Drenantes')) totals.Fistulas_Drenantes += val;
    else if (key.endsWith('_Fistulas')) totals.Fistulas += val;
    else if (key.endsWith('_Abscesos')) totals.Abscesos += val;
    else if (key.endsWith('_Nodulos')) totals.Nodulos += val;
  });
  return totals;
}

// Exponer globalmente si HubTools existe
if (typeof HubTools !== 'undefined') {
  HubTools.scoresHS = {
    toNumber,
    calculateIHS4,
    categorizeIHS4,
    calculateIMC,
    calculateDiagnosticDelay,
    validatePROMValue,
    sumRegionLesions
  };
}
