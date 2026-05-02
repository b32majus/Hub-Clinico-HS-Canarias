// modules/dataManager.js — Gestión de datos para Hub Clínico HS Canarias v1
// Adaptado para Hidradenitis Suppurativa: hojas HS, Profesionales, Consultas, Farmacos_HS

let appState = { isLoaded: false, db: null, lastLoadedTime: null };
const DB_CACHE_STORAGE = window.sessionStorage;
const LEGACY_DB_KEYS = ['hubClinicoDB', 'hubClinicoDB_loadTime', 'hubClinicoDB_limited'];

function normalizeSheetKey(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Guarda la base de datos en sessionStorage con manejo inteligente de tamaño.
 */
function saveToSessionStorage() {
  function tryStore(visitLimit) {
    const dbToStore = visitLimit
      ? {
          ...appState.db,
          HS: (appState.db?.HS || []).slice(-visitLimit)
        }
      : appState.db;

    const json = JSON.stringify(dbToStore);
    DB_CACHE_STORAGE.setItem('hubClinicoDB', json);
    DB_CACHE_STORAGE.setItem('hubClinicoDB_limited', visitLimit ? 'true' : 'false');
    return json;
  }

  try {
    const data = JSON.stringify(appState.db);
    const sizeKB = new Blob([data]).size / 1024;
    const sizeMB = sizeKB / 1024;

    if (sizeKB <= 4096) {
      tryStore(null);
      DB_CACHE_STORAGE.removeItem('hubClinicoDB_limited');
      console.log(`Base de datos completa guardada en sessionStorage (${sizeKB.toFixed(0)}KB).`);
      return;
    }

    console.warn(`Base de datos grande (${sizeMB.toFixed(2)}MB). Intentando versión limitada.`);

    var stored = false;
    var limits = [100, 30];
    for (var i = 0; i < limits.length; i++) {
      try {
        tryStore(limits[i]);
        console.log('Base de datos limitada guardada (' + limits[i] + ' visitas).');
        if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
          HubTools.utils.mostrarNotificacion(
            'BD grande. Caché limitada a últimas ' + limits[i] + ' visitas.',
            'warning'
          );
        }
        stored = true;
        break;
      } catch (innerErr) {
        if (innerErr.name === 'QuotaExceededError' || innerErr.code === 22) {
          continue;
        }
        throw innerErr;
      }
    }

    if (!stored) {
      throw new Error('No se pudo guardar ni con 30 visitas.');
    }
  } catch (e) {
    console.error('Error al guardar en sessionStorage:', e);
    DB_CACHE_STORAGE.removeItem('hubClinicoDB');
    DB_CACHE_STORAGE.removeItem('hubClinicoDB_limited');
    if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
      HubTools.utils.mostrarNotificacion(
        'Error: No se pudo guardar la BD en caché. Funcionalidad limitada entre páginas.',
        'error'
      );
    }
  }
}

// ============================================================
// VALIDACIÓN DE CABECERAS
// ============================================================

function createHeaderRule(label, aliases) {
  return {
    label: label,
    aliases: Array.isArray(aliases) && aliases.length ? aliases : [label]
  };
}

// Cabeceras bloqueantes: sin ellas no se puede operar
var HS_BLOCKING_HEADERS = [
  createHeaderRule('NHC'),
  createHeaderRule('Fecha_Visita'),
  createHeaderRule('Tipo_Visita')
];

// Cabeceras críticas no bloqueantes: aviso si faltan pero no impiden carga
var HS_NON_BLOCKING_HEADERS = [
  createHeaderRule('Consulta'),
  createHeaderRule('Profesional'),
  createHeaderRule('Sexo'),
  createHeaderRule('Nodulos_Total'),
  createHeaderRule('Abscesos_Total'),
  createHeaderRule('Fistulas_Total'),
  createHeaderRule('Fistulas_Drenantes_Total'),
  createHeaderRule('IHS4_Clinico'),
  createHeaderRule('IHS4_Clinico_Categoria'),
  createHeaderRule('Hurley'),
  createHeaderRule('Tratamiento_Actual'),
  createHeaderRule('Decision_Terapeutica'),
  createHeaderRule('Fecha_Proxima_Revision')
];

function validateSheetHeaders(actualHeaders) {
  var missingBlocking = HS_BLOCKING_HEADERS.filter(function(rule) {
    return !rule.aliases.some(function(alias) {
      return actualHeaders.indexOf(alias) !== -1;
    });
  }).map(function(rule) { return rule.label; });

  var missingNonBlocking = HS_NON_BLOCKING_HEADERS.filter(function(rule) {
    return !rule.aliases.some(function(alias) {
      return actualHeaders.indexOf(alias) !== -1;
    });
  }).map(function(rule) { return rule.label; });

  return { missingBlocking: missingBlocking, missingNonBlocking: missingNonBlocking };
}

// ============================================================
// CARGA DE BASE DE DATOS
// ============================================================

async function loadDatabase(file) {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    const dbData = {};

    // Hojas clínicas esperadas: solo HS
    var requiredSheets = ['HS'];
    var missingSheets = requiredSheets.filter(function(s) { return !workbook.Sheets[s]; });
    if (missingSheets.length > 0) {
      console.warn('Hojas faltantes en el Excel: ' + missingSheets.join(', '));
      if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
        HubTools.utils.mostrarNotificacion(
          'Error: El Excel no contiene la hoja HS. No se pueden cargar datos clínicos.',
          'error'
        );
      }
      return false;
    }

    // Cargar hoja HS
    if (workbook.Sheets['HS']) {
      var headerMatrix = XLSX.utils.sheet_to_json(workbook.Sheets['HS'], { header: 1, range: 0, blankrows: false });
      var actualHeaders = Array.isArray(headerMatrix[0]) ? headerMatrix[0].filter(function(value) {
        return value !== undefined && value !== null && value !== '';
      }) : [];

      var validation = validateSheetHeaders(actualHeaders);

      if (validation.missingBlocking.length > 0) {
        console.error('Cabeceras bloqueantes faltantes en HS: ' + validation.missingBlocking.join(', '));
        if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
          HubTools.utils.mostrarNotificacion(
            'Error: Faltan columnas críticas en la hoja HS: ' + validation.missingBlocking.join(', ') + '. No se puede cargar.',
            'error'
          );
        }
        return false;
      }

      if (validation.missingNonBlocking.length > 0) {
        console.warn('Cabeceras no bloqueantes faltantes en HS: ' + validation.missingNonBlocking.join(', '));
        if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
          HubTools.utils.mostrarNotificacion(
            'Aviso: Faltan columnas opcionales en HS: ' + validation.missingNonBlocking.join(', ') + '. Funcionalidad parcial.',
            'warning'
          );
        }
      }

      dbData['HS'] = XLSX.utils.sheet_to_json(workbook.Sheets['HS']);
      console.log('Hoja HS cargada: ' + dbData['HS'].length + ' registros.');
    }

    // Cargar Profesionales
    if (workbook.Sheets['Profesionales']) {
      dbData['Profesionales'] = XLSX.utils.sheet_to_json(workbook.Sheets['Profesionales']);
      console.log('Hoja Profesionales cargada: ' + dbData['Profesionales'].length + ' registros.');
    }

    // Cargar Consultas
    if (workbook.Sheets['Consultas']) {
      dbData['Consultas'] = XLSX.utils.sheet_to_json(workbook.Sheets['Consultas']);
      console.log('Hoja Consultas cargada: ' + dbData['Consultas'].length + ' registros.');
    }

    // Cargar Farmacos_HS
    if (workbook.Sheets['Farmacos_HS']) {
      dbData['Farmacos_HS'] = XLSX.utils.sheet_to_json(workbook.Sheets['Farmacos_HS']);
      console.log('Hoja Farmacos_HS cargada: ' + dbData['Farmacos_HS'].length + ' registros.');
    }

    // Actualizar estado
    appState.db = dbData;
    appState.isLoaded = true;
    appState.lastLoadedTime = Date.now();
    DB_CACHE_STORAGE.setItem('hubClinicoDB_loadTime', String(appState.lastLoadedTime));

    console.log('Base de datos HS cargada y procesada con éxito.');
    saveToSessionStorage();

    window.dispatchEvent(new CustomEvent('databaseLoaded', { detail: appState.db }));
    console.log('Evento databaseLoaded disparado.');

    return true;
  } catch (error) {
    console.error('Error crítico al cargar o procesar la base de datos:', error);
    appState.isLoaded = false;
    appState.db = null;
    return false;
  }
}

// ============================================================
// BÚSQUEDA DE PACIENTES POR NHC
// ============================================================

function findPatientByNHC(nhc) {
  if (!nhc || !appState.isLoaded) return null;

  const records = appState.db?.HS || [];
  const patientRecords = records.filter(p => {
    const val = p.NHC || p.nhc || p.NHC_Paciente;
    return val !== undefined && val !== null && String(val).trim() === String(nhc).trim();
  });

  if (!patientRecords.length) return null;

  const latest = selectLatestVisitPerPatient(patientRecords)[0];
  const normalizeRecord = HubTools?.normalizer?.normalizeRecordHS;

  return typeof normalizeRecord === 'function'
    ? normalizeRecord(latest)
    : { ...latest };
}

// Alias para compatibilidad
function findPatientById(patientId) {
  return findPatientByNHC(patientId);
}

// ============================================================
// HISTORIAL DEL PACIENTE
// ============================================================

function getPatientHistory(nhc) {
  const emptyHistory = { allVisits: [], latestVisit: null, firstVisit: null, treatmentHistory: [], keyEvents: [] };

  if (!nhc || !appState.isLoaded) return emptyHistory;

  const records = appState.db?.HS || [];
  const visits = records.filter(p => {
    const val = p.NHC || p.nhc || p.NHC_Paciente;
    return val !== undefined && val !== null && String(val).trim() === String(nhc).trim();
  });

  if (visits.length === 0) return emptyHistory;

  // Ordenar por Fecha_Visita descendente
  visits.sort((a, b) => {
    try {
      const dateA = parseVisitDate(a.Fecha_Visita || a.fechaVisita);
      const dateB = parseVisitDate(b.Fecha_Visita || b.fechaVisita);
      return dateB - dateA;
    } catch (e) {
      return 0;
    }
  });

  const normalizeRecord = HubTools?.normalizer?.normalizeRecordHS;
  const normalizedVisits = visits.map(v =>
    typeof normalizeRecord === 'function' ? normalizeRecord(v) : { ...v }
  );

  const treatmentHistory = extractTreatmentHistoryHS(normalizedVisits);
  const keyEvents = extractKeyEventsHS(normalizedVisits);

  return {
    allVisits: normalizedVisits,
    latestVisit: normalizedVisits[0],
    firstVisit: normalizedVisits[normalizedVisits.length - 1],
    treatmentHistory: treatmentHistory,
    keyEvents: keyEvents
  };
}

// ============================================================
// ÚLTIMA VISITA POR PACIENTE
// ============================================================

function selectLatestVisitPerPatient(records) {
  if (!Array.isArray(records) || records.length === 0) return [];

  var latestByPatient = new Map();

  records.forEach(function(record, index) {
    var nhc = String(record.NHC || record.nhc || record.NHC_Paciente || '').trim();
    if (!nhc) nhc = 'unknown_' + index;

    var candidateDate = parseVisitDate((record && (record.Fecha_Visita || record.fechaVisita)) || '');
    var existing = latestByPatient.get(nhc);

    if (!existing) {
      latestByPatient.set(nhc, {
        record: record,
        visitDate: candidateDate,
        sourceIndex: index
      });
      return;
    }

    var candidateTime = candidateDate.getTime();
    var existingTime = existing.visitDate.getTime();
    if (candidateTime > existingTime || (candidateTime === existingTime && index > existing.sourceIndex)) {
      latestByPatient.set(nhc, {
        record: record,
        visitDate: candidateDate,
        sourceIndex: index
      });
    }
  });

  return Array.from(latestByPatient.values())
    .sort(function(a, b) {
      return b.visitDate.getTime() - a.visitDate.getTime();
    })
    .map(function(entry) {
      return entry.record;
    });
}

// ============================================================
// CONSULTAS
// ============================================================

function getConsultas() {
  if (!appState.isLoaded) return [];
  const consultas = appState.db?.Consultas || [];
  // Si existe columna Activo, filtrar solo activos
  return consultas.filter(function(c) {
    if (c.Activo !== undefined && c.Activo !== null) {
      var val = String(c.Activo).trim().toUpperCase();
      return val === 'SI' || val === 'SÍ' || val === 'S' || val === 'TRUE' || val === '1';
    }
    return true; // Sin columna Activo = todas activas
  });
}

// ============================================================
// FÁRMACOS POR TIPO
// ============================================================

function getFarmacosPorTipo(tipo) {
  if (!appState.isLoaded) return [];

  const farmacos = appState.db?.Farmacos_HS || [];
  if (!farmacos.length) return [];

  // Mapeo de tipos aceptados
  var tipoMapping = {
    'Antibiotico': ['Antibiotico', 'Antibiótico', 'antibiotico', 'antibiotico_topico'],
    'Biologico': ['Biologico', 'Biológico', 'biologico', 'biologico_sistemico'],
    'Topico': ['Topico', 'Tópico', 'topico'],
    'Sistemico_No_Biologico': ['Sistemico_No_Biologico', 'Sistémico_No_Biológico', 'sistemico', 'sistemico_no_biologico'],
    'Otros': ['Otros', 'otros', 'Otro']
  };

  var possibleKeys = tipoMapping[tipo] || [tipo];

  return farmacos.filter(function(f) {
    // Verificar categoría
    var cat = f.Categoria || f.categoria || '';
    var catMatch = possibleKeys.some(function(pk) {
      return String(cat).trim().toLowerCase() === String(pk).toLowerCase();
    });
    if (!catMatch) return false;

    // Verificar activo
    if (f.Activo !== undefined && f.Activo !== null) {
      var val = String(f.Activo).trim().toUpperCase();
      return val === 'SI' || val === 'SÍ' || val === 'S' || val === 'TRUE' || val === '1';
    }
    return true;
  });
}

// ============================================================
// PROFESIONALES
// ============================================================

function getProfesionales() {
  if (!appState.isLoaded) return [];
  var profesionales = appState.db?.Profesionales || [];
  // Si existe columna Activo, filtrar solo activos
  return profesionales.filter(function(p) {
    if (p.Activo !== undefined && p.Activo !== null) {
      var val = String(p.Activo).trim().toUpperCase();
      return val === 'SI' || val === 'SÍ' || val === 'S' || val === 'TRUE' || val === '1';
    }
    return true; // Sin columna Activo = todos activos
  });
}

// ============================================================
// UTILIDADES DE FECHA
// ============================================================

function parseVisitDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? new Date() : dateStr;

  var str = String(dateStr).trim();

  // DD/MM/YYYY
  if (str.includes('/')) {
    var parts = str.split('/');
    var parsed = new Date(parts[2], parts[1] - 1, parts[0]);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // YYYY-MM-DD u otros
  var fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;

  console.warn('parseVisitDate: fecha no válida "' + dateStr + '", usando fecha actual.');
  return new Date();
}

// ============================================================
// HISTORIAL DE TRATAMIENTO HS
// ============================================================

function extractTreatmentHistoryHS(visits) {
  if (!visits || visits.length === 0) return [];

  const treatments = [];
  const seenTreatments = new Set();

  // Recorrer de antiguo a reciente
  for (let i = visits.length - 1; i >= 0; i--) {
    const visit = visits[i];
    const currentTreatment = visit.Tratamiento_Actual || visit.tratamientoActual || null;

    if (currentTreatment && !seenTreatments.has(currentTreatment)) {
      seenTreatments.add(currentTreatment);
      treatments.push({
        startDate: visit.Fecha_Visita || visit.fechaVisita || new Date(),
        name: currentTreatment,
        reason: visit.Decision_Terapeutica || visit.decisionTerapeutica || 'Tratamiento activo'
      });
    }
  }

  return treatments;
}

// ============================================================
// EVENTOS CLÍNICOS CLAVE HS
// ============================================================

function extractKeyEventsHS(visits) {
  if (!visits || visits.length < 2) return [];

  // ITERACIÓN 2: Ordenar cronológicamente ASCENDENTE (más antigua primero)
  const sorted = [...visits].sort((a, b) => {
    const dateA = parseVisitDate(a.Fecha_Visita || a.fechaVisita);
    const dateB = parseVisitDate(b.Fecha_Visita || b.fechaVisita);
    return dateA - dateB;
  });

  const events = [];

  // Comparar visits[i] con visits[i-1] (anterior → actual)
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];
    const visitDate = current.Fecha_Visita || current.fechaVisita;

    // Cambio de tratamiento
    const currentTx = current.Tratamiento_Actual || current.tratamientoActual;
    const previousTx = previous.Tratamiento_Actual || previous.tratamientoActual;

    if (currentTx && previousTx && currentTx !== previousTx) {
      events.push({
        date: visitDate,
        type: 'treatment',
        description: 'Cambio de tratamiento: ' + previousTx + ' → ' + currentTx
      });
    }

    // Inicio de biológico
    if (!previousTx && currentTx && /biol/i.test(currentTx)) {
      events.push({
        date: visitDate,
        type: 'biologic_start',
        description: 'Inicio de biológico: ' + currentTx
      });
    }

    // Cirugía
    if (current.Cirugia_Realizada === 'SI' || current.cirugiaRealizada === 'SI') {
      events.push({
        date: visitDate,
        type: 'surgery',
        description: 'Cirugía realizada' + (current.Fecha_Cirugia ? ' (' + current.Fecha_Cirugia + ')' : '')
      });
    }

    // Comité multidisciplinar
    if (current.Comite_Multidisciplinar === 'SI') {
      events.push({
        date: visitDate,
        type: 'committee',
        description: 'Comité multidisciplinar' + (current.Decision_Comite ? ': ' + current.Decision_Comite : '')
      });
    }

    // Brote: IHS4 aumenta significativamente
    const currIHS4 = HubTools?.scoresHS?.toNumber(current.IHS4_Clinico, null);
    const prevIHS4 = HubTools?.scoresHS?.toNumber(previous.IHS4_Clinico, null);

    if (currIHS4 !== null && prevIHS4 !== null && currIHS4 > prevIHS4 + 4) {
      events.push({
        date: visitDate,
        type: 'flare',
        description: 'Brote clínico: IHS4 subió de ' + prevIHS4 + ' a ' + currIHS4
      });
    }

    // Efectos adversos
    if (current.Efectos_Adversos === 'SI' || current.efectosAdversos === 'SI') {
      events.push({
        date: visitDate,
        type: 'adverse',
        description: 'Efectos adversos reportados' + (current.Efectos_Adversos_Descripcion ? ': ' + current.Efectos_Adversos_Descripcion : '')
      });
    }
  }

  // Ya están en orden ascendente por construcción
  return events;
}

// ============================================================
// INICIALIZACIÓN DESDE STORAGE
// ============================================================

function initDatabaseFromStorage() {
  if (appState.isLoaded) {
    console.log('DB ya cargada, omitiendo carga desde sessionStorage.');
    return true;
  }

  try {
    const storedDb = DB_CACHE_STORAGE.getItem('hubClinicoDB');
    if (storedDb) {
      const dbData = JSON.parse(storedDb);
      appState.db = dbData;
      appState.isLoaded = true;
      appState.lastLoadedTime = parseInt(DB_CACHE_STORAGE.getItem('hubClinicoDB_loadTime') || '', 10) || null;
      console.log('Base de datos HS cargada desde sessionStorage.');

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('databaseLoaded', { detail: appState.db }));
        console.log('Evento databaseLoaded disparado desde sessionStorage.');
      }, 100);

      return true;
    }
  } catch (e) {
    console.error('Error al cargar la base de datos desde sessionStorage:', e);
    DB_CACHE_STORAGE.removeItem('hubClinicoDB');
    DB_CACHE_STORAGE.removeItem('hubClinicoDB_loadTime');
    DB_CACHE_STORAGE.removeItem('hubClinicoDB_limited');
  }

  LEGACY_DB_KEYS.forEach(function(key) {
    localStorage.removeItem(key);
  });

  return false;
}

// ============================================================
// OBTENER TODOS LOS PACIENTES (únicos por NHC)
// ============================================================

function getAllPatients() {
    if (!appState.isLoaded) return [];

    const records = appState.db?.HS || [];
    // Usar selectLatestVisitPerPatient para devolver la última visita por NHC
    return selectLatestVisitPerPatient(records);
}

// ============================================================
// OBTENER TODOS LOS REGISTROS HS (para estadísticas)
// ============================================================

function getAllHSRecords() {
    if (!appState.isLoaded) return [];
    return appState.db?.HS || [];
}

// ============================================================
// REGISTRO EN HubTools.data
// ============================================================

if (typeof HubTools !== 'undefined') {
    HubTools.data.loadDatabase = loadDatabase;
    HubTools.data.findPatientByNHC = findPatientByNHC;
    HubTools.data.findPatientById = findPatientById;
    HubTools.data.getPatientHistory = getPatientHistory;
    HubTools.data.getAllPatients = getAllPatients;
    HubTools.data.getAllHSRecords = getAllHSRecords;
    HubTools.data.getProfesionales = getProfesionales;
    HubTools.data.getConsultas = getConsultas;
    HubTools.data.getFarmacosPorTipo = getFarmacosPorTipo;
    HubTools.data.selectLatestVisitPerPatient = selectLatestVisitPerPatient;
    HubTools.data.parseVisitDate = parseVisitDate;
    HubTools.data.initDatabaseFromStorage = initDatabaseFromStorage;
    HubTools.data.saveToSessionStorage = saveToSessionStorage;
    Object.defineProperty(HubTools.data, 'isLoaded', {
        get: function () { return appState.isLoaded; }
    });
    console.log('✅ dataManager HS registrado en HubTools.data');
}
