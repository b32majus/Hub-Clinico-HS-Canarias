// modules/statsHS.js — Estadísticas poblacionales para Hidradenitis Supurativa
// Hub Clínico HS Canarias v1.0

(function () {
  'use strict';

  // ============================================================
  // ESTADO
  // ============================================================
  let allRecords = [];
  let latestPerPatient = [];
  let filteredRecords = [];
  let chartInstances = {};
  let currentPage = 1;
  const PAGE_SIZE = 10;
  let sortColumn = null;
  let sortDirection = 'asc';

  const COLORS = {
    leve: '#10B981',
    moderada: '#F59E0B',
    grave: '#EF4444',
    primary: '#2C3E4A',
    secondary: '#64748B',
    biologic: '#6F7F91',
    surgery: '#EC4899',
    ultrasound: '#06B6D4',
    hurley1: '#3B82F6',
    hurley2: '#F59E0B',
    hurley3: '#EF4444'
  };

  // ============================================================
  // UTILIDADES
  // ============================================================
  function toNum(val) {
    if (val === null || val === undefined || val === '') return null;
    var n = Number(val);
    return Number.isNaN(n) ? null : n;
  }

  function getField(rec) {
    var keys = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < keys.length; i++) {
      if (rec && rec[keys[i]] !== undefined && rec[keys[i]] !== null && rec[keys[i]] !== '') {
        return rec[keys[i]];
      }
    }
    return null;
  }

  function parseDate(dateStr) {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? new Date() : dateStr;
    var str = String(dateStr).trim();
    if (str.includes('/')) {
      var parts = str.split('/');
      var d = new Date(parts[2], parts[1] - 1, parts[0]);
      if (!isNaN(d.getTime())) return d;
    }
    var fb = new Date(str);
    return isNaN(fb.getTime()) ? new Date() : fb;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    if (typeof HubTools?.utils?.formatearFecha === 'function') {
      try {
        var f = HubTools.utils.formatearFecha(dateStr);
        if (f) return f;
      } catch (e) { /* fallback */ }
    }
    return dateStr;
  }

  function median(arr) {
    if (!arr.length) return null;
    var sorted = arr.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function debounce(func, wait) {
    var timeout;
    return function () {
      var args = arguments;
      var context = this;
      clearTimeout(timeout);
      timeout = setTimeout(function () { func.apply(context, args); }, wait);
    };
  }

  // ============================================================
  // INIT
  // ============================================================
  function initStatsHS() {
    console.log('📊 Iniciando estadísticas HS...');

    configureChartDefaults();
    initializeDatePresets();
    initializeTableControls();
    addEventListeners();
    initializeFilterTabs();
    initializeFiltersCollapsible();

    // Cargar datos
    loadData();

    // Escuchar carga de BD
    window.addEventListener('databaseLoaded', function () {
      setTimeout(function () {
        loadData();
        updateDashboard();
      }, 200);
    });

    // Si la BD ya está cargada
    if (typeof HubTools?.data?.isLoaded !== 'undefined' && HubTools.data.isLoaded) {
      setTimeout(function () {
        loadData();
        updateDashboard();
      }, 100);
    }
  }

  function configureChartDefaults() {
    if (typeof Chart !== 'undefined') {
      Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      Chart.defaults.font.size = 12;
      Chart.defaults.color = '#64748B';
      Chart.defaults.plugins.legend.position = 'bottom';
      Chart.defaults.plugins.legend.labels.usePointStyle = true;
      Chart.defaults.plugins.legend.labels.padding = 20;
      Chart.defaults.plugins.tooltip.backgroundColor = '#1E293B';
      Chart.defaults.plugins.tooltip.cornerRadius = 8;
      Chart.defaults.plugins.tooltip.padding = 12;
      Chart.defaults.responsive = true;
      Chart.defaults.maintainAspectRatio = false;
      Chart.defaults.animation.duration = 750;
      Chart.defaults.animation.easing = 'easeOutQuart';
    }
  }

  function loadData() {
    if (typeof HubTools?.data?.getAllHSRecords !== 'function') return;

    allRecords = HubTools.data.getAllHSRecords() || [];

    if (typeof HubTools?.data?.selectLatestVisitPerPatient === 'function') {
      latestPerPatient = HubTools.data.selectLatestVisitPerPatient(allRecords) || [];
    }

    filteredRecords = latestPerPatient.slice();
    currentPage = 1;

    console.log('📊 Datos HS cargados:', allRecords.length, 'registros,', latestPerPatient.length, 'pacientes únicos');
  }

  // ============================================================
  // FILTROS
  // ============================================================
  function getActiveFilters() {
    return {
      dateFrom: document.getElementById('filterDateFrom')?.value || '',
      dateTo: document.getElementById('filterDateTo')?.value || '',
      profesional: document.getElementById('filterProfesional')?.value || 'Todos',
      consulta: document.getElementById('filterConsulta')?.value || 'Todos',
      origen: document.getElementById('filterOrigen')?.value || 'Todos',
      severidad: document.getElementById('filterSeveridad')?.value || 'Todos',
      hurley: document.getElementById('filterHurley')?.value || 'Todos',
      tratamiento: document.getElementById('filterTratamiento')?.value || 'Todos',
      cirugia: document.getElementById('filterCirugia')?.value || 'Todos',
      ecografia: document.getElementById('filterEcografia')?.value || 'Todos'
    };
  }

  function applyStatsFilters(records, filters) {
    if (!filters) filters = getActiveFilters();

    return records.filter(function (r) {
      // Periodo
      if (filters.dateFrom) {
        var visitDate = parseDate(getField(r, 'Fecha_Visita', 'fechaVisita'));
        if (visitDate < new Date(filters.dateFrom)) return false;
      }
      if (filters.dateTo) {
        var visitDate2 = parseDate(getField(r, 'Fecha_Visita', 'fechaVisita'));
        var toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        if (visitDate2 > toDate) return false;
      }

      // Profesional
      if (filters.profesional !== 'Todos') {
        var prof = getField(r, 'Profesional', 'profesional');
        if (prof !== filters.profesional) return false;
      }

      // Consulta
      if (filters.consulta !== 'Todos') {
        var cons = getField(r, 'Consulta', 'consulta');
        if (cons !== filters.consulta) return false;
      }

      // Origen
      if (filters.origen !== 'Todos') {
        var orig = getField(r, 'Origen_Paciente', 'origenPaciente');
        if (orig !== filters.origen) return false;
      }

      // Severidad IHS-4
      if (filters.severidad !== 'Todos') {
        var cat = getField(r, 'IHS4_Clinico_Categoria', 'ihs4Categoria');
        if (cat !== filters.severidad) return false;
      }

      // Hurley
      if (filters.hurley !== 'Todos') {
        var hur = getField(r, 'Hurley', 'hurley');
        if (String(hur) !== String(filters.hurley)) return false;
      }

      // Tratamiento
      if (filters.tratamiento !== 'Todos') {
        var tto = getField(r, 'Tratamiento_Actual', 'tratamientoActual') || '';
        if (tto.indexOf(filters.tratamiento) === -1) return false;
      }

      // Cirugía
      if (filters.cirugia !== 'Todos') {
        var cir = getField(r, 'Requiere_Cirugia', 'Cirugia_Realizada');
        var cirVal = cir ? String(cir).toUpperCase() : '';
        var isSi = cirVal === 'SI' || cirVal === 'SÍ' || cirVal === 'S' || cirVal === 'TRUE' || cirVal === '1';
        if (filters.cirugia === 'Sí' && !isSi) return false;
        if (filters.cirugia === 'No' && isSi) return false;
      }

      // Ecografía
      if (filters.ecografia !== 'Todos') {
        var eco = getField(r, 'Ecografia_Realizada', 'ecografiaRealizada');
        var ecoVal = eco ? String(eco).toUpperCase() : '';
        var isSi = ecoVal === 'SI' || ecoVal === 'SÍ' || ecoVal === 'S' || ecoVal === 'TRUE' || ecoVal === '1';
        if (filters.ecografia === 'Sí' && !isSi) return false;
        if (filters.ecografia === 'No' && isSi) return false;
      }

      return true;
    });
  }

  // ============================================================
  // CÁLCULO DE ESTADÍSTICAS
  // ============================================================
  function calculateStats(records, visitRecords) {
    var activityRecords = Array.isArray(visitRecords) ? visitRecords : records;
    var stats = {
      totalPacientes: records.length,
      totalVisitas: activityRecords.length,
      primerasVisitas: 0,
      seguimientos: 0,
      ihs4Grave: 0,
      conBiologico: 0,
      derivadosCirugia: 0,
      conEcografia: 0,
      ihs4Media: null,
      ihs4Values: [],
      dlqiValues: [],
      evaDolorValues: [],
      severidadDist: { Leve: 0, Moderada: 0, Grave: 0, ND: 0 },
      hurleyDist: { I: 0, II: 0, III: 0, ND: 0 },
      tratamientoDist: {},
      origenDist: {},
      cirugiaDist: { Realizada: 0, Pendiente: 0, No: 0 },
      visitasPorMes: {}
    };

    activityRecords.forEach(function (r) {
      // Tipo de visita
      var tipo = getField(r, 'Tipo_Visita', 'tipoVisita') || '';
      if (tipo === 'Primera_Visita') stats.primerasVisitas++;
      else stats.seguimientos++;

      // Visitas por mes
      var fechaVisita = parseDate(getField(r, 'Fecha_Visita', 'fechaVisita'));
      var mesKey = fechaVisita.getFullYear() + '-' + String(fechaVisita.getMonth() + 1).padStart(2, '0');
      stats.visitasPorMes[mesKey] = (stats.visitasPorMes[mesKey] || 0) + 1;
    });

    records.forEach(function (r) {
      // IHS-4
      var ihs4 = toNum(getField(r, 'IHS4_Clinico', 'ihs4Clinico'));
      if (ihs4 !== null) {
        stats.ihs4Values.push(ihs4);
        var cat = getField(r, 'IHS4_Clinico_Categoria', 'ihs4Categoria');
        if (cat === 'Grave') stats.ihs4Grave++;
        if (cat && stats.severidadDist.hasOwnProperty(cat)) stats.severidadDist[cat]++;
        else if (!cat) stats.severidadDist['ND']++;
      }

      // Biológico
      var tto = getField(r, 'Tratamiento_Actual', 'tratamientoActual') || '';
      if (/biol|adali|infix|usteki|secuki|ixeki|bime|risank|golimum/gi.test(tto)) {
        stats.conBiologico++;
      }

      // Derivación cirugía
      var requiereCir = getField(r, 'Requiere_Cirugia', 'requiereCirugia');
      var cirugiaReal = getField(r, 'Cirugia_Realizada', 'cirugiaRealizada');
      if (cirugiaReal) {
        var cVal = String(cirugiaReal).toUpperCase();
        if (cVal === 'SI' || cVal === 'SÍ' || cVal === 'S' || cVal === 'TRUE' || cVal === '1') {
          stats.derivadosCirugia++;
          stats.cirugiaDist['Realizada']++;
        }
      } else if (requiereCir) {
        var rVal = String(requiereCir).toUpperCase();
        if (rVal === 'SI' || rVal === 'SÍ' || rVal === 'S' || rVal === 'TRUE' || rVal === '1') {
          stats.cirugiaDist['Pendiente']++;
        } else {
          stats.cirugiaDist['No']++;
        }
      } else {
        stats.cirugiaDist['No']++;
      }

      // Ecografía
      var eco = getField(r, 'Ecografia_Realizada', 'ecografiaRealizada');
      if (eco) {
        var eVal = String(eco).toUpperCase();
        if (eVal === 'SI' || eVal === 'SÍ' || eVal === 'S' || eVal === 'TRUE' || eVal === '1') {
          stats.conEcografia++;
        }
      }

      // DLQI
      var dlqi = toNum(getField(r, 'DLQI', 'dlqi'));
      if (dlqi !== null) stats.dlqiValues.push(dlqi);

      // EVA Dolor
      var eva = toNum(getField(r, 'Dolor_EVA', 'EVA_Dolor', 'evaDolor'));
      if (eva !== null) stats.evaDolorValues.push(eva);

      // Hurley
      var hurley = getField(r, 'Hurley', 'hurley');
      if (hurley) {
        var hKey = String(hurley).replace(/\s+/g, '');
        if (hKey === 'I' || hKey === '1') stats.hurleyDist['I']++;
        else if (hKey === 'II' || hKey === '2') stats.hurleyDist['II']++;
        else if (hKey === 'III' || hKey === '3') stats.hurleyDist['III']++;
        else stats.hurleyDist['ND']++;
      } else {
        stats.hurleyDist['ND']++;
      }

      // Tratamiento (top)
      if (tto) {
        // Simplificar nombre
        var ttoSimple = tto.split(' ')[0];
        stats.tratamientoDist[ttoSimple] = (stats.tratamientoDist[ttoSimple] || 0) + 1;
      }

      // Origen
      var origen = getField(r, 'Origen_Paciente', 'origenPaciente') || 'No especificado';
      stats.origenDist[origen] = (stats.origenDist[origen] || 0) + 1;
    });

    // Medias y medianas
    if (stats.ihs4Values.length) {
      stats.ihs4Media = stats.ihs4Values.reduce(function (a, b) { return a + b; }, 0) / stats.ihs4Values.length;
      stats.ihs4Mediana = median(stats.ihs4Values);
    }
    if (stats.dlqiValues.length) {
      stats.dlqiMedia = stats.dlqiValues.reduce(function (a, b) { return a + b; }, 0) / stats.dlqiValues.length;
      stats.dlqiMediana = median(stats.dlqiValues);
    }
    if (stats.evaDolorValues.length) {
      stats.evaDolorMedia = stats.evaDolorValues.reduce(function (a, b) { return a + b; }, 0) / stats.evaDolorValues.length;
      stats.evaDolorMediana = median(stats.evaDolorValues);
    }

    return stats;
  }

  // ============================================================
  // ACTUALIZAR DASHBOARD
  // ============================================================
  function updateDashboard() {
    var filters = getActiveFilters();
    filteredRecords = applyStatsFilters(latestPerPatient, filters);
    var filteredVisitRecords = applyStatsFilters(allRecords, filters);
    currentPage = 1;

    var stats = calculateStats(filteredRecords, filteredVisitRecords);

    renderStatsKPIs(stats);
    renderStatsCharts(stats, filteredRecords);
    renderStatsTable();
    updateActiveFiltersDisplay();
  }

  // ============================================================
  // KPIs
  // ============================================================
  function renderStatsKPIs(stats) {
    var mappings = [
      { id: 'kpiTotalPacientes', value: stats.totalPacientes },
      { id: 'kpiTotalVisitas', value: stats.totalVisitas },
      { id: 'kpiPrimerasVisitas', value: stats.primerasVisitas },
      { id: 'kpiSeguimientos', value: stats.seguimientos },
      { id: 'kpiIHS4Grave', value: stats.ihs4Grave },
      { id: 'kpiBiologicos', value: stats.conBiologico },
      { id: 'kpiCirugia', value: stats.derivadosCirugia },
      { id: 'kpiEcografia', value: stats.conEcografia },
      { id: 'kpiIHS4Media', value: stats.ihs4Media !== null ? stats.ihs4Media.toFixed(1) : '—' },
      { id: 'kpiDLQIMediana', value: stats.dlqiMediana !== null ? stats.dlqiMediana.toFixed(1) : 'Sin datos' }
    ];

    mappings.forEach(function (m) {
      var el = document.getElementById(m.id);
      if (el) el.textContent = m.value;
    });
  }

  // ============================================================
  // GRÁFICOS
  // ============================================================
  function renderStatsCharts(stats) {
    renderSeveridadChart(stats.severidadDist);
    renderHurleyChart(stats.hurleyDist);
    renderTratamientoChart(stats.tratamientoDist);
    renderOrigenChart(stats.origenDist);
    renderCirugiaChart(stats.cirugiaDist);
    renderVisitasEvolucionChart(stats.visitasPorMes);
    renderPROMsChart(stats);
  }

  function renderSeveridadChart(dist) {
    var canvasId = 'severidadChart';
    destroyChart(canvasId);
    var ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    var labels = ['Leve', 'Moderada', 'Grave'];
    var data = labels.map(function (l) { return dist[l] || 0; });
    var colors = [COLORS.leve, COLORS.moderada, COLORS.grave];

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: colors, borderColor: '#fff', borderWidth: 3, hoverOffset: 8 }]
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                return ctx.label + ': ' + ctx.raw + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

  function renderHurleyChart(dist) {
    var canvasId = 'hurleyChart';
    destroyChart(canvasId);
    var ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    var labels = ['Hurley I', 'Hurley II', 'Hurley III'];
    var data = [dist['I'] || 0, dist['II'] || 0, dist['III'] || 0];
    var colors = [COLORS.hurley1, COLORS.hurley2, COLORS.hurley3];

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: colors, borderRadius: 8, borderSkipped: false }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Pacientes' }, grid: { color: '#E2E8F0' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function renderTratamientoChart(dist) {
    var canvasId = 'tratamientoChart';
    destroyChart(canvasId);
    var ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    var sorted = Object.keys(dist).sort(function (a, b) { return dist[b] - dist[a]; }).slice(0, 10);
    var labels = sorted;
    var data = sorted.map(function (k) { return dist[k]; });

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Pacientes',
          data: data,
          backgroundColor: COLORS.primary,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, title: { display: true, text: 'Pacientes' }, grid: { color: '#E2E8F0' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  function renderOrigenChart(dist) {
    var canvasId = 'origenChart';
    destroyChart(canvasId);
    var ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    var labels = Object.keys(dist);
    var data = labels.map(function (k) { return dist[k]; });

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: data, borderColor: '#fff', borderWidth: 3, hoverOffset: 8 }]
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } }
        }
      }
    });
  }

  function renderCirugiaChart(dist) {
    var canvasId = 'cirugiaChart';
    destroyChart(canvasId);
    var ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    var labels = ['Realizada', 'Pendiente', 'No'];
    var data = labels.map(function (l) { return dist[l] || 0; });
    var colors = [COLORS.leve, COLORS.moderada, COLORS.secondary];

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: colors, borderRadius: 8, borderSkipped: false }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Pacientes' }, grid: { color: '#E2E8F0' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function renderVisitasEvolucionChart(visitasPorMes) {
    var canvasId = 'visitasEvolucionChart';
    destroyChart(canvasId);
    var ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    var sorted = Object.keys(visitasPorMes).sort();
    var labels = sorted;
    var data = sorted.map(function (k) { return visitasPorMes[k]; });

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Visitas',
          data: data,
          borderColor: COLORS.primary,
          backgroundColor: 'rgba(0, 135, 119, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: COLORS.primary
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Mes' }, grid: { color: '#E2E8F0' } },
          y: { beginAtZero: true, title: { display: true, text: 'Visitas' }, grid: { color: '#E2E8F0' } }
        }
      }
    });
  }

  function renderPROMsChart(stats) {
    var canvasId = 'promsStatsChart';
    destroyChart(canvasId);
    var ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    var datasets = [];
    if (stats.dlqiValues.length > 0) {
      datasets.push({
        label: 'DLQI (media)',
        data: stats.dlqiValues,
        borderColor: '#6F7F91',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        yAxisID: 'y'
      });
    }
    if (stats.evaDolorValues.length > 0) {
      datasets.push({
        label: 'EVA Dolor (media)',
        data: stats.evaDolorValues,
        borderColor: '#EC4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        yAxisID: 'y1'
      });
    }

    if (datasets.length === 0) {
      document.getElementById(canvasId).parentElement.innerHTML = '<p class="empty-message">Sin datos PROMs registrados en la cohorte.</p>';
      return;
    }

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels: datasets[0].data.map(function (_, i) { return i + 1; }), datasets: datasets },
      options: {
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16 } } },
        scales: {
          x: { title: { display: true, text: 'Paciente' }, grid: { color: '#E2E8F0' } },
          y: { beginAtZero: true, max: 30, title: { display: true, text: 'DLQI' }, grid: { color: '#E2E8F0' }, position: 'left' },
          y1: { beginAtZero: true, max: 10, title: { display: true, text: 'EVA Dolor' }, grid: { display: false }, position: 'right' }
        }
      }
    });
  }

  function destroyChart(canvasId) {
    if (chartInstances[canvasId]) {
      chartInstances[canvasId].destroy();
      delete chartInstances[canvasId];
    }
  }

  // ============================================================
  // TABLA
  // ============================================================
  function renderStatsTable() {
    var tbody = document.getElementById('statsTableBody');
    if (!tbody) return;

    var start = (currentPage - 1) * PAGE_SIZE;
    var end = start + PAGE_SIZE;
    var pageData = filteredRecords.slice(start, end);

    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-message">No se encontraron pacientes con los filtros seleccionados.</td></tr>';
      updatePaginationInfo();
      return;
    }

    var html = '';
    pageData.forEach(function (r) {
      var nhc = getField(r, 'NHC', 'nhc', 'NHC_Paciente') || '—';
      var ultimaVisita = formatDate(getField(r, 'Fecha_Visita', 'fechaVisita'));
      var ihs4 = toNum(getField(r, 'IHS4_Clinico', 'ihs4Clinico'));
      var cat = getField(r, 'IHS4_Clinico_Categoria', 'ihs4Categoria') || '—';
      var hurley = getField(r, 'Hurley', 'hurley') || '—';
      var tratamiento = getField(r, 'Tratamiento_Actual', 'tratamientoActual') || '—';
      var cirugia = getField(r, 'Requiere_Cirugia', 'Cirugia_Realizada');
      var cirugiaText = 'No';
      if (cirugia) {
        var cVal = String(cirugia).toUpperCase();
        if (cVal === 'SI' || cVal === 'SÍ' || cVal === 'S' || cVal === 'TRUE' || cVal === '1') cirugiaText = 'Sí';
      }
      var proxRev = formatDate(getField(r, 'Fecha_Proxima_Revision', 'fechaProximaRevision'));

      var catColor = cat === 'Grave' ? COLORS.grave : cat === 'Moderada' ? COLORS.moderada : COLORS.leve;

      html += '<tr>' +
        '<td><strong>' + nhc + '</strong></td>' +
        '<td>' + ultimaVisita + '</td>' +
        '<td style="font-weight:600;color:' + catColor + '">' + (ihs4 !== null ? ihs4 : '—') + '</td>' +
        '<td><span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:0.8rem;font-weight:600;background:' + catColor + '22;color:' + catColor + '">' + cat + '</span></td>' +
        '<td>H' + hurley + '</td>' +
        '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + tratamiento + '">' + tratamiento + '</td>' +
        '<td>' + cirugiaText + '</td>' +
        '<td>' + proxRev + '</td>' +
        '</tr>';
    });

    tbody.innerHTML = html;
    updatePaginationInfo();
  }

  function updatePaginationInfo() {
    var total = filteredRecords.length;
    var totalPages = Math.ceil(total / PAGE_SIZE);
    var start = total > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
    var end = Math.min(currentPage * PAGE_SIZE, total);

    var infoEl = document.getElementById('paginationInfo');
    if (infoEl) infoEl.textContent = 'Mostrando ' + start + '-' + end + ' de ' + total + ' pacientes';

    var prevBtn = document.getElementById('prevPageBtn');
    var nextBtn = document.getElementById('nextPageBtn');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    var pageNumbers = document.getElementById('pageNumbers');
    if (pageNumbers) {
      pageNumbers.innerHTML = '';
      var maxVisible = 5;
      var startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      var endPage = Math.min(totalPages, startPage + maxVisible - 1);
      if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

      for (var i = startPage; i <= endPage; i++) {
        var btn = document.createElement('button');
        btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', (function (p) { return function () { currentPage = p; renderStatsTable(); }; })(i));
        pageNumbers.appendChild(btn);
      }
    }
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  function addEventListeners() {
    // Filtros auto-aplican
    var filterInputs = document.querySelectorAll('.filters-panel input, .filters-panel select');
    filterInputs.forEach(function (input) {
      if (input.type === 'range') return;
      var handler = debounce(function () { updateDashboard(); }, 300);
      if (input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'date') {
        input.addEventListener('change', handler);
      } else {
        input.addEventListener('input', handler);
      }
    });

    // Limpiar filtros
    document.getElementById('clearAllFiltersBtn')?.addEventListener('click', clearAllFilters);

    // Export CSV
    document.getElementById('exportStatsBtn')?.addEventListener('click', exportStatsCSV);

    // Ordenamiento tabla
    var headers = document.querySelectorAll('.data-table th[data-sort]');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        var column = header.dataset.sort;
        if (sortColumn === column) sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        else { sortColumn = column; sortDirection = 'asc'; }

        filteredRecords.sort(function (a, b) {
          var valA = getSortValue(a, column);
          var valB = getSortValue(b, column);
          if (valA == null) return 1;
          if (valB == null) return -1;
          if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = (valB || '').toLowerCase();
          }
          if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
          if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });

        currentPage = 1;
        renderStatsTable();
      });
    });

    // Paginación
    document.getElementById('prevPageBtn')?.addEventListener('click', function () {
      if (currentPage > 1) { currentPage--; renderStatsTable(); }
    });
    document.getElementById('nextPageBtn')?.addEventListener('click', function () {
      var totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE);
      if (currentPage < totalPages) { currentPage++; renderStatsTable(); }
    });
  }

  function getSortValue(rec, column) {
    switch (column) {
      case 'NHC': return getField(rec, 'NHC', 'nhc', 'NHC_Paciente');
      case 'Fecha_Visita': return getField(rec, 'Fecha_Visita', 'fechaVisita');
      case 'IHS4': return toNum(getField(rec, 'IHS4_Clinico', 'ihs4Clinico'));
      case 'Categoria': return getField(rec, 'IHS4_Clinico_Categoria', 'ihs4Categoria');
      case 'Hurley': return getField(rec, 'Hurley', 'hurley');
      case 'Tratamiento': return getField(rec, 'Tratamiento_Actual', 'tratamientoActual');
      case 'Cirugia': return getField(rec, 'Requiere_Cirugia', 'Cirugia_Realizada');
      case 'Proxima_Revision': return getField(rec, 'Fecha_Proxima_Revision', 'fechaProximaRevision');
      default: return null;
    }
  }

  function clearAllFilters() {
    var inputs = document.querySelectorAll('.filters-panel input, .filters-panel select');
    inputs.forEach(function (input) {
      if (input.type === 'checkbox') input.checked = false;
      else if (input.tagName === 'SELECT') input.selectedIndex = 0;
      else input.value = '';
    });
    document.querySelectorAll('.date-preset-btn').forEach(function (btn) { btn.classList.remove('active'); });
    updateDashboard();
  }

  function exportStatsCSV() {
    if (filteredRecords.length === 0) { alert('No hay datos para exportar.'); return; }

    var headers = ['NHC', 'Última Visita', 'IHS-4', 'Categoría', 'Hurley', 'Tratamiento', 'Cirugía', 'Próxima Revisión'];
    var rows = filteredRecords.map(function (r) {
      var cirugia = getField(r, 'Requiere_Cirugia', 'Cirugia_Realizada');
      var cirugiaText = 'No';
      if (cirugia) {
        var cVal = String(cirugia).toUpperCase();
        if (cVal === 'SI' || cVal === 'SÍ' || cVal === 'S' || cVal === 'TRUE' || cVal === '1') cirugiaText = 'Sí';
      }
      return [
        getField(r, 'NHC', 'nhc', 'NHC_Paciente') || '',
        getField(r, 'Fecha_Visita', 'fechaVisita') || '',
        toNum(getField(r, 'IHS4_Clinico', 'ihs4Clinico')) || '',
        getField(r, 'IHS4_Clinico_Categoria', 'ihs4Categoria') || '',
        getField(r, 'Hurley', 'hurley') || '',
        getField(r, 'Tratamiento_Actual', 'tratamientoActual') || '',
        cirugiaText,
        getField(r, 'Fecha_Proxima_Revision', 'fechaProximaRevision') || ''
      ];
    });

    var csv = [headers.join(';')].concat(rows.map(function (r) { return r.join(';'); })).join('\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'estadisticas_HS_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
  }

  // ============================================================
  // UI HELPERS
  // ============================================================
  function initializeDatePresets() {
    var presetBtns = document.querySelectorAll('.date-preset-btn');
    var dateFrom = document.getElementById('filterDateFrom');
    var dateTo = document.getElementById('filterDateTo');

    presetBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var preset = btn.dataset.preset;
        var today = new Date();
        var fromDate = new Date();

        presetBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        switch (preset) {
          case 'month': fromDate.setMonth(today.getMonth() - 1); break;
          case 'quarter': fromDate.setMonth(today.getMonth() - 3); break;
          case 'year': fromDate.setFullYear(today.getFullYear() - 1); break;
          case 'all': fromDate = null; break;
        }

        if (dateFrom) dateFrom.value = fromDate ? fromDate.toISOString().split('T')[0] : '';
        if (dateTo) dateTo.value = today.toISOString().split('T')[0];

        updateDashboard();
      });
    });
  }

  function initializeTableControls() {
    // Search
    var searchInput = document.getElementById('statsTableSearch');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(function () {
        var term = searchInput.value.toLowerCase().trim();
        if (!term) {
          filteredRecords = applyStatsFilters(latestPerPatient, getActiveFilters());
        } else {
          var baseFiltered = applyStatsFilters(latestPerPatient, getActiveFilters());
          filteredRecords = baseFiltered.filter(function (r) {
            var nhc = (getField(r, 'NHC', 'nhc') || '').toLowerCase();
            var tto = (getField(r, 'Tratamiento_Actual', 'tratamientoActual') || '').toLowerCase();
            var cat = (getField(r, 'IHS4_Clinico_Categoria', 'ihs4Categoria') || '').toLowerCase();
            return nhc.indexOf(term) !== -1 || tto.indexOf(term) !== -1 || cat.indexOf(term) !== -1;
          });
        }
        currentPage = 1;
        renderStatsTable();
      }, 300));
    }
  }

  function initializeFilterTabs() {
    var tabs = document.querySelectorAll('.filter-tab');
    var contents = document.querySelectorAll('.filter-tab-content');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.dataset.tab;
        tabs.forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        contents.forEach(function (c) { c.classList.remove('active'); });
        var targetContent = document.getElementById('tab-' + target);
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  function initializeFiltersCollapsible() {
    var header = document.getElementById('filtersHeader');
    var content = document.querySelector('.filters-panel .collapsible-content');
    if (!header || !content) return;

    header.setAttribute('data-collapsible-initialized', 'true');

    header.addEventListener('click', function (event) {
      if (event.target.closest('.toggle-filters-btn') || event.currentTarget === header || event.target.closest('.card-title')) {
        header.classList.toggle('active');
        if (header.classList.contains('active')) {
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = '0px';
        }
      }
    });

    header.classList.remove('active');
    content.style.maxHeight = '0px';
  }

  function updateActiveFiltersDisplay() {
    var filters = getActiveFilters();
    var bar = document.getElementById('activeFiltersBar');
    var chips = document.getElementById('activeFiltersChips');
    var badge = document.getElementById('filtersCountBadge');
    if (!chips) return;

    chips.innerHTML = '';
    var count = 0;

    var filterLabels = {
      dateFrom: 'Desde',
      dateTo: 'Hasta',
      profesional: 'Profesional',
      consulta: 'Consulta',
      origen: 'Origen',
      severidad: 'Severidad',
      hurley: 'Hurley',
      tratamiento: 'Tratamiento',
      cirugia: 'Cirugía',
      ecografia: 'Ecografía'
    };

    Object.keys(filterLabels).forEach(function (key) {
      var val = filters[key];
      if (val && val !== 'Todos' && val !== '') {
        count++;
        var chip = document.createElement('span');
        chip.className = 'filter-chip';
        chip.innerHTML = '<span class="filter-chip-label">' + filterLabels[key] + ':</span>' +
          '<span class="filter-chip-value">' + val + '</span>' +
          '<button class="filter-chip-remove" data-filter="' + key + '"><i class="fas fa-times"></i></button>';
        chips.appendChild(chip);

        chip.querySelector('.filter-chip-remove').addEventListener('click', function () {
          var el = document.getElementById('filter' + key.charAt(0).toUpperCase() + key.slice(1));
          if (el) {
            if (el.tagName === 'SELECT') el.selectedIndex = 0;
            else el.value = '';
          }
          updateDashboard();
        });
      }
    });

    if (bar) bar.style.display = count > 0 ? 'flex' : 'none';
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'inline-flex' : 'none'; }
  }

  // ============================================================
  // POBLAR SELECTORES DINÁMICOS
  // ============================================================
  function populateDynamicSelectors() {
    if (latestPerPatient.length === 0) return;

    // Profesionales
    var profSelect = document.getElementById('filterProfesional');
    if (profSelect) {
      var profs = new Set();
      latestPerPatient.forEach(function (r) {
        var p = getField(r, 'Profesional', 'profesional');
        if (p) profs.add(p);
      });
      profs.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        profSelect.appendChild(opt);
      });
    }

    // Consultas
    var consSelect = document.getElementById('filterConsulta');
    if (consSelect) {
      var cons = new Set();
      latestPerPatient.forEach(function (r) {
        var c = getField(r, 'Consulta', 'consulta');
        if (c) cons.add(c);
      });
      cons.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        consSelect.appendChild(opt);
      });
    }

    // Origen
    var origenSelect = document.getElementById('filterOrigen');
    if (origenSelect) {
      var origenes = new Set();
      latestPerPatient.forEach(function (r) {
        var o = getField(r, 'Origen_Paciente', 'origenPaciente');
        if (o) origenes.add(o);
      });
      origenes.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        origenSelect.appendChild(opt);
      });
    }

    // Tratamientos
    var ttoSelect = document.getElementById('filterTratamiento');
    if (ttoSelect) {
      var ttos = new Set();
      latestPerPatient.forEach(function (r) {
        var t = getField(r, 'Tratamiento_Actual', 'tratamientoActual');
        if (t) ttos.add(t.split(' ')[0]);
      });
      ttos.forEach(function (t) {
        var opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        ttoSelect.appendChild(opt);
      });
    }
  }

  // ============================================================
  // EXPOSICIÓN GLOBAL
  // ============================================================
  window.StatsHS = {
    init: initStatsHS,
    updateDashboard: updateDashboard,
    calculateStats: calculateStats,
    applyFilters: applyStatsFilters
  };

  // Auto-init
  if (window.location.pathname.indexOf('estadisticas.html') !== -1) {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        if (typeof HubTools?.data?.isLoaded !== 'undefined' && HubTools.data.isLoaded) {
          initStatsHS();
          populateDynamicSelectors();
        } else if (typeof HubTools?.data?.initDatabaseFromStorage === 'function') {
          HubTools.data.initDatabaseFromStorage();
          window.addEventListener('databaseLoaded', function () {
            setTimeout(function () {
              initStatsHS();
              populateDynamicSelectors();
            }, 200);
          });
        }
      }, 200);
    });
  }

})();
