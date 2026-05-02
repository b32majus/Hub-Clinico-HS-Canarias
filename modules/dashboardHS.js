// modules/dashboardHS.js — Dashboard individual de paciente para Hidradenitis Supurativa
// Hub Clínico HS Canarias v1.0

(function () {
  'use strict';

  // ============================================================
  // ESTADO
  // ============================================================
  let patientNHC = null;
  let patientHistory = null;
  let ihs4ChartInstance = null;
  let promsChartInstance = null;
  let regionChartInstance = null;

  const COLORS = {
    leve: '#10B981',
    moderada: '#F59E0B',
    grave: '#EF4444',
    primary: '#2C3E4A',
    secondary: '#64748B',
    biologic: '#6F7F91',
    surgery: '#EC4899',
    ultrasound: '#06B6D4'
  };

  // ============================================================
  // UTILIDADES
  // ============================================================
  function toNum(val) {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
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

  function ihs4Color(cat) {
    if (!cat) return COLORS.secondary;
    var c = String(cat).toLowerCase();
    if (c === 'leve') return COLORS.leve;
    if (c === 'moderada') return COLORS.moderada;
    return COLORS.grave;
  }

  function ihs4BadgeClass(cat) {
    if (!cat) return '';
    var c = String(cat).toLowerCase();
    if (c === 'leve') return 'kpi-card--success';
    if (c === 'moderada') return 'kpi-card--warning';
    return 'kpi-card--danger';
  }

  // ============================================================
  // INIT
  // ============================================================
  function initDashboardHS() {
    var params = new URLSearchParams(window.location.search);
    patientNHC = params.get('nhc');

    if (!patientNHC) {
      showEmptyState('Busca un paciente para cargar su cuadro de mando.');
      return;
    }

    if (typeof HubTools?.data?.getPatientHistory !== 'function') {
      showEmptyState('Módulo de datos no disponible. Recargue la página.');
      return;
    }

    patientHistory = HubTools.data.getPatientHistory(patientNHC);

    if (!patientHistory || !patientHistory.allVisits || patientHistory.allVisits.length === 0) {
      showEmptyState('No se encontraron datos para el NHC ' + patientNHC + '.');
      return;
    }

    // Ocultar empty state, mostrar contenido
    var emptyEl = document.getElementById('emptyState');
    var contentEl = document.getElementById('dashboardContent');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');

    renderPatientHeader();
    renderKPIs();
    renderIHS4Chart();
    renderPROMsChart();
    renderTreatmentTimeline();
    renderRegionSummary();
    renderEventsTimeline();
    renderVisitsTable();

    // Botón seguimiento
    var btnSeg = document.getElementById('btnSeguimiento');
    if (btnSeg) {
      btnSeg.href = 'seguimiento.html?nhc=' + encodeURIComponent(patientNHC);
    }

    // Export CSV
    var exportBtn = document.getElementById('exportVisitsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportVisitsCSV);
    }

    console.log('✅ Dashboard HS cargado para NHC ' + patientNHC);
  }

  function showEmptyState(msg) {
    var emptyEl = document.getElementById('emptyState');
    var contentEl = document.getElementById('dashboardContent');
    if (contentEl) contentEl.classList.add('hidden');
    if (emptyEl) {
      emptyEl.classList.remove('hidden');
      var subtitle = emptyEl.querySelector('p');
      if (subtitle) subtitle.textContent = msg;
    }
  }

  // ============================================================
  // CABECERA
  // ============================================================
  function renderPatientHeader() {
    var latest = patientHistory.latestVisit || {};
    var nhc = getField(latest, 'nhc', 'NHC', 'NHC_Paciente') || patientNHC;
    var totalVisits = patientHistory.allVisits.length;
    var primeraFecha = patientHistory.firstVisit ? formatDate(getField(patientHistory.firstVisit, 'fechaVisita', 'Fecha_Visita')) : '—';
    var ultimaFecha = formatDate(getField(latest, 'fechaVisita', 'Fecha_Visita'));
    var tratamiento = getField(latest, 'tratamientoActual', 'Tratamiento_Actual') || 'Sin tratamiento';
    var ihs4Cat = getField(latest, 'ihs4Categoria', 'IHS4_Clinico_Categoria', 'IHS4_Categoria') || 'ND';

    // Nombre del paciente (si existe)
    var nombre = getField(latest, 'Nombre_Paciente', 'nombrePaciente', 'Nombre') || 'Paciente HS';

    document.getElementById('patientIdBadge').textContent = nhc;
    document.getElementById('patientName').textContent = nombre;
    document.getElementById('patientDiagnosis').textContent = 'Hidradenitis Supurativa (L73.2)';

    // Meta info
    var metaEl = document.querySelector('.patient-meta');
    if (metaEl) {
      metaEl.innerHTML =
        '<span><i class="fas fa-calendar-check"></i> Visitas: ' + totalVisits + '</span>' +
        '<span><i class="fas fa-calendar-alt"></i> Primera visita: ' + primeraFecha + '</span>' +
        '<span><i class="fas fa-calendar-day"></i> Última visita: ' + ultimaFecha + '</span>' +
        '<span><i class="fas fa-venus-mars"></i> ' + (getField(latest, 'sexo', 'Sexo') || '—') + '</span>';
    }

    // Status badge basado en IHS-4
    var badge = document.getElementById('patientStatusBadge');
    var statusText = document.getElementById('patientStatusText');
    if (badge) {
      badge.className = 'patient-status-badge';
      if (ihs4Cat === 'Grave') badge.classList.add('patient-status-badge--active');
      else if (ihs4Cat === 'Moderada') badge.classList.add('patient-status-badge--moderate');
      else if (ihs4Cat === 'Leve') badge.classList.add('patient-status-badge--low');
    }
    if (statusText) statusText.textContent = 'IHS-4: ' + ihs4Cat;

    // Treatment info in header actions
    var actionsEl = document.querySelector('.patient-header-actions');
    if (actionsEl) {
      actionsEl.innerHTML =
        '<a href="#" id="btnSeguimiento" class="btn btn-primary"><i class="fas fa-clipboard-list"></i> Registrar Seguimiento</a>' +
        '<span style="margin-left:auto;font-size:0.9rem;color:var(--color-text-secondary);"><i class="fas fa-pills"></i> ' + tratamiento + '</span>';
    }
  }

  // ============================================================
  // KPIs
  // ============================================================
  function renderKPIs() {
    var allVisits = patientHistory.allVisits;
    var first = patientHistory.firstVisit || {};
    var latest = patientHistory.latestVisit || {};
    var isBaseline = allVisits.length === 1;

    var ihs4Basal = toNum(getField(first, 'ihs4Clinico', 'IHS4_Clinico', 'IHS4'));
    var ihs4Ultimo = toNum(getField(latest, 'ihs4Clinico', 'IHS4_Clinico', 'IHS4'));
    var cambio = (ihs4Basal !== null && ihs4Ultimo !== null) ? (ihs4Ultimo - ihs4Basal) : null;
    var catActual = getField(latest, 'ihs4Categoria', 'IHS4_Clinico_Categoria') || 'ND';
    var dlqi = toNum(getField(latest, 'DLQI', 'dlqi'));
    var evaDolor = toNum(getField(latest, 'Dolor_EVA', 'EVA_Dolor', 'evaDolor'));
    var cirugia = getField(latest, 'Cirugia_Realizada', 'cirugiaRealizada') || getField(latest, 'Requiere_Cirugia', 'requiereCirugia');
    var proximaRevision = formatDate(getField(latest, 'fechaProximaRevision', 'Fecha_Proxima_Revision'));

    var kpisContainer = document.getElementById('patientKpis');
    if (!kpisContainer) return;

    var cards = '';

    // IHS-4 Basal
    cards += buildKPICard('kpiIHS4Basal', 'fa-chart-line',
      ihs4Basal !== null ? String(ihs4Basal) : '—',
      'IHS-4 Basal',
      ihs4Basal !== null ? HubTools?.scoresHS?.categorizeIHS4(ihs4Basal) || '' : '',
      isBaseline ? '' : ihs4Color(getField(first, 'ihs4Categoria', 'IHS4_Clinico_Categoria')),
      'Primera visita'
    );

    // Último IHS-4
    var catClass = ihs4BadgeClass(catActual);
    cards += buildKPICard('kpiIHS4Ultimo', 'fa-fire',
      ihs4Ultimo !== null ? String(ihs4Ultimo) : '—',
      'Último IHS-4',
      catActual,
      catClass,
      'Categoría actual'
    );

    // Cambio IHS-4
    var cambioText = cambio !== null ? (cambio > 0 ? '+' : '') + cambio : '—';
    var cambioClass = cambio !== null ? (cambio < 0 ? 'kpi-card--success' : cambio > 0 ? 'kpi-card--danger' : 'kpi-card--info') : '';
    cards += buildKPICard('kpiCambio', 'fa-exchange-alt',
      cambioText,
      'Cambio IHS-4',
      cambio !== null ? (cambio < 0 ? 'Mejora' : cambio > 0 ? 'Empeora' : 'Estable') : '',
      cambioClass,
      isBaseline ? 'Sin comparativa' : 'Último − Basal'
    );

    // DLQI
    cards += buildKPICard('kpiDLQI', 'fa-clipboard-check',
      dlqi !== null ? String(dlqi) : '—',
      'Último DLQI',
      dlqi !== null ? (dlqi <= 5 ? 'Mínimo' : dlqi <= 10 ? 'Moderado' : dlqi <= 20 ? 'Muy alto' : 'Extremo') : 'Sin datos PROMs',
      dlqi !== null ? (dlqi <= 5 ? 'kpi-card--success' : dlqi <= 10 ? 'kpi-card--warning' : 'kpi-card--danger') : '',
      ''
    );

    // EVA Dolor
    cards += buildKPICard('kpiEVA', 'fa-thermometer-half',
      evaDolor !== null ? String(evaDolor) + '/10' : '—',
      'EVA Dolor',
      evaDolor !== null ? (evaDolor < 4 ? 'Leve' : evaDolor < 7 ? 'Moderado' : 'Severo') : 'Sin datos',
      evaDolor !== null ? (evaDolor < 4 ? 'kpi-card--success' : evaDolor < 7 ? 'kpi-card--warning' : 'kpi-card--danger') : '',
      ''
    );

    // Cirugía
    var cirugiaText = 'No';
    var cirugiaClass = 'kpi-card--success';
    if (cirugia) {
      var cVal = String(cirugia).toUpperCase();
      if (cVal === 'SI' || cVal === 'SÍ' || cVal === 'S' || cVal === 'TRUE' || cVal === '1') {
        cirugiaText = 'Sí';
        cirugiaClass = 'kpi-card--warning';
      }
    }
    var requiere = getField(latest, 'Requiere_Cirugia', 'requiereCirugia');
    if (requiere && !cirugia) {
      var rVal = String(requiere).toUpperCase();
      if (rVal === 'SI' || rVal === 'SÍ' || rVal === 'S' || rVal === 'TRUE' || rVal === '1') {
        cirugiaText = 'Pendiente';
        cirugiaClass = 'kpi-card--danger';
      }
    }
    cards += buildKPICard('kpiCirugia', 'fa-procedures',
      cirugiaText,
      'Cirugía',
      '',
      cirugiaClass,
      ''
    );

    // Próxima revisión
    cards += buildKPICard('kpiRevision', 'fa-calendar-alt',
      proximaRevision,
      'Próxima Revisión',
      '',
      'kpi-card--info',
      ''
    );

    kpisContainer.innerHTML = cards;
  }

  function buildKPICard(id, icon, value, label, status, colorClass, threshold) {
    return '<div class="kpi-card ' + (colorClass || '') + '" id="' + id + '">' +
      '<div class="kpi-icon"><i class="fas ' + icon + '"></i></div>' +
      '<span class="kpi-value">' + value + '</span>' +
      '<span class="kpi-label">' + label + '</span>' +
      (status ? '<span class="kpi-status">' + status + '</span>' : '') +
      (threshold ? '<span class="kpi-threshold">' + threshold + '</span>' : '') +
      '</div>';
  }

  // ============================================================
  // GRÁFICO IHS-4
  // ============================================================
  function renderIHS4Chart() {
    var canvas = document.getElementById('ihs4Chart');
    var emptyMsg = document.getElementById('emptyIHS4Chart');
    if (!canvas) return;

    var visits = patientHistory.allVisits.slice().sort(function (a, b) {
      return parseDate(getField(a, 'fechaVisita', 'Fecha_Visita')) - parseDate(getField(b, 'fechaVisita', 'Fecha_Visita'));
    });

    var labels = [];
    var data = [];
    var bgColors = [];

    visits.forEach(function (v) {
      var score = toNum(getField(v, 'ihs4Clinico', 'IHS4_Clinico', 'IHS4'));
      if (score !== null) {
        labels.push(getField(v, 'fechaVisita', 'Fecha_Visita') || '');
        data.push(score);
        var cat = getField(v, 'ihs4Categoria', 'IHS4_Clinico_Categoria');
        bgColors.push(ihs4Color(cat));
      }
    });

    if (data.length < 2) {
      if (emptyMsg) emptyMsg.classList.remove('hidden');
      canvas.classList.add('hidden');
      if (ihs4ChartInstance) { ihs4ChartInstance.destroy(); ihs4ChartInstance = null; }
      return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');
    canvas.classList.remove('hidden');

    if (ihs4ChartInstance) ihs4ChartInstance.destroy();

    var annotations = {};
    // Líneas de corte IHS-4
    annotations.lineLeve = {
      type: 'line', yMin: 3, yMax: 3, borderColor: COLORS.leve, borderDash: [6, 4], borderWidth: 1,
      label: { display: true, content: 'Leve (3)', position: 'start', backgroundColor: COLORS.leve, font: { size: 10 } }
    };
    annotations.lineModerada = {
      type: 'line', yMin: 10, yMax: 10, borderColor: COLORS.moderada, borderDash: [6, 4], borderWidth: 1,
      label: { display: true, content: 'Moderada (10)', position: 'start', backgroundColor: COLORS.moderada, font: { size: 10 } }
    };

    // Marcadores de cambio de tratamiento
    var treatmentHistory = patientHistory.treatmentHistory || [];
    treatmentHistory.forEach(function (t, idx) {
      var tDate = typeof t.startDate === 'string' ? t.startDate : '';
      var labelIdx = labels.indexOf(tDate);
      if (labelIdx >= 0) {
        annotations['tx_' + idx] = {
          type: 'line', xMin: labelIdx, xMax: labelIdx, borderColor: COLORS.biologic, borderWidth: 2, borderDash: [4, 4],
          label: { display: true, content: 'Tx: ' + (t.name || '').substring(0, 20), rotation: -90, position: 'start', backgroundColor: COLORS.biologic, font: { size: 9 } }
        };
      }
    });

    var ctx = canvas.getContext('2d');
    ihs4ChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'IHS-4 Clínico',
          data: data,
          borderColor: COLORS.primary,
          backgroundColor: 'rgba(0, 135, 119, 0.1)',
          pointBackgroundColor: bgColors,
          pointBorderColor: bgColors,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
          tooltip: {
            backgroundColor: '#1E293B', cornerRadius: 8, padding: 12,
            callbacks: {
              afterLabel: function (ctx) {
                var v = visits[ctx.dataIndex];
                if (!v) return '';
                var cat = getField(v, 'ihs4Categoria', 'IHS4_Clinico_Categoria');
                var hurley = getField(v, 'hurley', 'Hurley');
                var lines = [];
                if (cat) lines.push('Categoría: ' + cat);
                if (hurley) lines.push('Hurley: ' + hurley);
                return lines.join('\n');
              }
            }
          },
          annotation: { annotations: annotations }
        },
        scales: {
          x: { title: { display: true, text: 'Fecha' }, grid: { color: '#E2E8F0' } },
          y: { beginAtZero: true, title: { display: true, text: 'IHS-4' }, grid: { color: '#E2E8F0' } }
        }
      }
    });
  }

  // ============================================================
  // GRÁFICO PROMs (DLQI + EVA Dolor)
  // ============================================================
  function renderPROMsChart() {
    var canvas = document.getElementById('promsChart');
    var emptyMsg = document.getElementById('emptyPROMsChart');
    if (!canvas) return;

    var visits = patientHistory.allVisits.slice().sort(function (a, b) {
      return parseDate(getField(a, 'fechaVisita', 'Fecha_Visita')) - parseDate(getField(b, 'fechaVisita', 'Fecha_Visita'));
    });

    var labels = [];
    var dlqiData = [];
    var evaData = [];

    visits.forEach(function (v) {
      var dlqi = toNum(getField(v, 'DLQI', 'dlqi'));
      var eva = toNum(getField(v, 'Dolor_EVA', 'EVA_Dolor', 'evaDolor'));
      if (dlqi !== null || eva !== null) {
        labels.push(getField(v, 'fechaVisita', 'Fecha_Visita') || '');
        dlqiData.push(dlqi);
        evaData.push(eva);
      }
    });

    if (labels.length === 0) {
      if (emptyMsg) emptyMsg.classList.remove('hidden');
      canvas.classList.add('hidden');
      if (promsChartInstance) { promsChartInstance.destroy(); promsChartInstance = null; }
      return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');
    canvas.classList.remove('hidden');

    if (promsChartInstance) promsChartInstance.destroy();

    var datasets = [];
    if (dlqiData.some(function (d) { return d !== null; })) {
      datasets.push({
        label: 'DLQI',
        data: dlqiData,
        borderColor: '#6F7F91',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        pointRadius: 5, tension: 0.3, fill: true, yAxisID: 'y'
      });
    }
    if (evaData.some(function (d) { return d !== null; })) {
      datasets.push({
        label: 'EVA Dolor',
        data: evaData,
        borderColor: '#EC4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        pointRadius: 5, tension: 0.3, fill: true, yAxisID: 'y1'
      });
    }

    if (datasets.length === 0) {
      if (emptyMsg) { emptyMsg.textContent = 'Sin datos PROMs registrados'; emptyMsg.classList.remove('hidden'); }
      canvas.classList.add('hidden');
      return;
    }

    var ctx = canvas.getContext('2d');
    promsChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
          tooltip: { backgroundColor: '#1E293B', cornerRadius: 8, padding: 12 }
        },
        scales: {
          x: { title: { display: true, text: 'Fecha' }, grid: { color: '#E2E8F0' } },
          y: { beginAtZero: true, max: 30, title: { display: true, text: 'DLQI' }, grid: { color: '#E2E8F0' }, position: 'left' },
          y1: { beginAtZero: true, max: 10, title: { display: true, text: 'EVA Dolor' }, grid: { display: false }, position: 'right' }
        }
      }
    });
  }

  // ============================================================
  // TIMELINE DE TRATAMIENTO
  // ============================================================
  function renderTreatmentTimeline() {
    var container = document.getElementById('treatmentTimeline');
    if (!container) return;

    var treatments = patientHistory.treatmentHistory || [];
    if (!treatments.length) {
      container.innerHTML = '<p class="empty-message">No hay historial de tratamientos.</p>';
      return;
    }

    var html = '';
    treatments.forEach(function (t) {
      var isBiologic = /biol|adali|infix|usteki|secuki|ixeki|bime|risank/gi.test(t.name || '');
      var typeClass = isBiologic ? 'event-type-treatment' : 'event-type-remission';
      html += '<div class="timeline-item ' + typeClass + '">' +
        '<div class="timeline-marker"></div>' +
        '<div class="timeline-date">' + formatDate(t.startDate) + '</div>' +
        '<div class="timeline-content">' +
        '<div class="timeline-title">' + (isBiologic ? '<i class="fas fa-syringe"></i> ' : '<i class="fas fa-pills"></i> ') + (t.name || 'Tratamiento') + '</div>' +
        '<div class="timeline-description">' + (t.reason || '') + '</div>' +
        '</div></div>';
    });

    container.innerHTML = html;
  }

  // ============================================================
  // RESUMEN DE REGIONES AFECTAS
  // ============================================================
  function renderRegionSummary() {
    var canvas = document.getElementById('regionChart');
    if (!canvas) return;

    var allVisits = patientHistory.allVisits;
    var regionTotals = {};
    var hsConfig = HubTools?.hsConfig?.REGIONS || [];

    hsConfig.forEach(function (r) {
      regionTotals[r.key] = 0;
    });

    allVisits.forEach(function (v) {
      hsConfig.forEach(function (r) {
        var nod = toNum(v[r.key + '_Nodulos']) || 0;
        var abs = toNum(v[r.key + '_Abscesos']) || 0;
        var fis = toNum(v[r.key + '_Fistulas']) || 0;
        var fisD = toNum(v[r.key + '_Fistulas_Drenantes']) || 0;
        regionTotals[r.key] += nod + abs + fis + fisD;
      });
    });

    var activeRegions = hsConfig.filter(function (r) { return regionTotals[r.key] > 0; });
    if (activeRegions.length === 0) {
      canvas.parentElement.innerHTML = '<p class="empty-message">Sin datos de regiones afectas.</p>';
      return;
    }

    activeRegions.sort(function (a, b) { return regionTotals[b.key] - regionTotals[a.key]; });

    if (regionChartInstance) regionChartInstance.destroy();

    var ctx = canvas.getContext('2d');
    regionChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: activeRegions.map(function (r) { return r.label; }),
        datasets: [{
          label: 'Lesiones acumuladas',
          data: activeRegions.map(function (r) { return regionTotals[r.key]; }),
          backgroundColor: COLORS.primary,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, title: { display: true, text: 'Total lesiones' }, grid: { color: '#E2E8F0' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // ============================================================
  // TIMELINE DE EVENTOS
  // ============================================================
  function renderEventsTimeline() {
    var container = document.getElementById('eventsTimeline');
    if (!container) return;

    var events = patientHistory.keyEvents || [];
    var allVisits = patientHistory.allVisits;

    // Añadir eventos de cirugía y ecografía desde las visitas
    allVisits.forEach(function (v) {
      var fecha = getField(v, 'fechaVisita', 'Fecha_Visita');
      var cirugiaReal = getField(v, 'Cirugia_Realizada', 'cirugiaRealizada');
      var ecoReal = getField(v, 'Ecografia_Realizada', 'ecografiaRealizada');
      var comite = getField(v, 'Comite_Multidisciplinar', 'comiteMultidisciplinar');

      if (cirugiaReal) {
        var cVal = String(cirugiaReal).toUpperCase();
        if (cVal === 'SI' || cVal === 'SÍ' || cVal === 'S' || cVal === 'TRUE' || cVal === '1') {
          events.push({ date: fecha, type: 'surgery', description: 'Cirugía realizada' + (getField(v, 'Resultado_Cirugia') ? ': ' + getField(v, 'Resultado_Cirugia') : '') });
        }
      }
      if (ecoReal) {
        var eVal = String(ecoReal).toUpperCase();
        if (eVal === 'SI' || eVal === 'SÍ' || eVal === 'S' || eVal === 'TRUE' || eVal === '1') {
          events.push({ date: fecha, type: 'ultrasound', description: 'Ecografía realizada' + (getField(v, 'IHS4_Ecografico') ? ' (IHS-4 eco: ' + getField(v, 'IHS4_Ecografico') + ')' : '') });
        }
      }
      if (comite) {
        var mVal = String(comite).toUpperCase();
        if (mVal === 'SI' || mVal === 'SÍ' || mVal === 'S' || mVal === 'TRUE' || mVal === '1') {
          events.push({ date: fecha, type: 'committee', description: 'Comité multidisciplinar' + (getField(v, 'Decision_Comite') ? ': ' + getField(v, 'Decision_Comite') : '') });
        }
      }
    });

    // Ordenar por fecha
    events.sort(function (a, b) { return parseDate(a.date) - parseDate(b.date); });

    // Eliminar duplicados
    var seen = new Set();
    events = events.filter(function (e) {
      var key = e.date + '|' + e.type + '|' + e.description;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!events.length) {
      container.innerHTML = '<p class="empty-message">No hay eventos clínicos registrados.</p>';
      return;
    }

    var html = '';
    events.forEach(function (e) {
      var typeClass = 'event-type-' + e.type;
      var icon = 'fa-circle';
      if (e.type === 'surgery') icon = 'fa-procedures';
      else if (e.type === 'ultrasound') icon = 'fa-wave-square';
      else if (e.type === 'committee') icon = 'fa-users';
      else if (e.type === 'flare') icon = 'fa-fire';
      else if (e.type === 'treatment') icon = 'fa-pills';
      else if (e.type === 'adverse') icon = 'fa-exclamation-triangle';

      html += '<div class="timeline-item ' + typeClass + '">' +
        '<div class="timeline-marker"></div>' +
        '<div class="timeline-date">' + formatDate(e.date) + '</div>' +
        '<div class="timeline-content">' +
        '<div class="timeline-title"><i class="fas ' + icon + '"></i> ' + capitalize(e.type) + '</div>' +
        '<div class="timeline-description">' + e.description + '</div>' +
        '</div></div>';
    });

    container.innerHTML = html;
  }

  function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ============================================================
  // TABLA DE VISITAS
  // ============================================================
  function renderVisitsTable() {
    var tbody = document.getElementById('visitsTableBody');
    if (!tbody) return;

    var visits = patientHistory.allVisits.slice().sort(function (a, b) {
      return parseDate(getField(b, 'fechaVisita', 'Fecha_Visita')) - parseDate(getField(a, 'fechaVisita', 'Fecha_Visita'));
    });

    if (visits.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-message">No hay visitas registradas.</td></tr>';
      return;
    }

    var html = '';
    visits.forEach(function (v) {
      var fecha = formatDate(getField(v, 'fechaVisita', 'Fecha_Visita'));
      var tipo = getField(v, 'tipoVisita', 'Tipo_Visita') || '—';
      var ihs4 = toNum(getField(v, 'ihs4Clinico', 'IHS4_Clinico'));
      var cat = getField(v, 'ihs4Categoria', 'IHS4_Clinico_Categoria') || '—';
      var hurley = getField(v, 'hurley', 'Hurley') || '—';
      var tratamiento = getField(v, 'tratamientoActual', 'Tratamiento_Actual') || '—';
      var decision = getField(v, 'decisionTerapeutica', 'Decision_Terapeutica') || '—';
      var proxRev = formatDate(getField(v, 'fechaProximaRevision', 'Fecha_Proxima_Revision'));

      var catColor = ihs4Color(cat);

      html += '<tr>' +
        '<td>' + fecha + '</td>' +
        '<td>' + tipo + '</td>' +
        '<td style="font-weight:600;color:' + catColor + '">' + (ihs4 !== null ? ihs4 : '—') + '</td>' +
        '<td><span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:0.8rem;font-weight:600;background:' + catColor + '22;color:' + catColor + '">' + cat + '</span></td>' +
        '<td>Hurley ' + hurley + '</td>' +
        '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + tratamiento + '">' + tratamiento + '</td>' +
        '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + decision + '">' + decision + '</td>' +
        '<td>' + proxRev + '</td>' +
        '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ============================================================
  // EXPORT CSV
  // ============================================================
  function exportVisitsCSV() {
    var visits = patientHistory.allVisits.slice().sort(function (a, b) {
      return parseDate(getField(a, 'fechaVisita', 'Fecha_Visita')) - parseDate(getField(b, 'fechaVisita', 'Fecha_Visita'));
    });

    if (visits.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    var headers = ['Fecha', 'Tipo', 'IHS-4', 'Categoría', 'Hurley', 'DLQI', 'EVA Dolor', 'Tratamiento', 'Decisión', 'Próxima Revisión'];
    var rows = visits.map(function (v) {
      return [
        getField(v, 'fechaVisita', 'Fecha_Visita') || '',
        getField(v, 'tipoVisita', 'Tipo_Visita') || '',
        toNum(getField(v, 'ihs4Clinico', 'IHS4_Clinico')) || '',
        getField(v, 'ihs4Categoria', 'IHS4_Clinico_Categoria') || '',
        getField(v, 'hurley', 'Hurley') || '',
        toNum(getField(v, 'DLQI', 'dlqi')) || '',
        toNum(getField(v, 'Dolor_EVA', 'EVA_Dolor')) || '',
        getField(v, 'tratamientoActual', 'Tratamiento_Actual') || '',
        getField(v, 'decisionTerapeutica', 'Decision_Terapeutica') || '',
        getField(v, 'fechaProximaRevision', 'Fecha_Proxima_Revision') || ''
      ];
    });

    var csvContent = [headers.join(';')].concat(rows.map(function (r) { return r.join(';'); })).join('\n');
    var blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'historial_HS_' + patientNHC + '.csv';
    link.click();
  }

  // ============================================================
  // EXPOSICIÓN GLOBAL
  // ============================================================
  window.DashboardHS = {
    init: initDashboardHS
  };

  // Auto-init si estamos en dashboard_paciente.html
  if (window.location.pathname.indexOf('dashboard_paciente.html') !== -1) {
    var dashboardInitialized = false;

    function tryInit() {
      if (dashboardInitialized) return;
      if (typeof HubTools?.data?.getPatientHistory !== 'function') return;
      dashboardInitialized = true;
      initDashboardHS();
    }

    document.addEventListener('DOMContentLoaded', function () {
      if (typeof HubTools?.data?.isLoaded !== 'undefined' && HubTools.data.isLoaded) {
        tryInit();
      } else {
        // Try to init from sessionStorage first
        if (typeof HubTools?.data?.initDatabaseFromStorage === 'function') {
          HubTools.data.initDatabaseFromStorage();
        }
        window.addEventListener('databaseLoaded', function () {
          setTimeout(tryInit, 100);
        });
        // Fallback: intentar después de un tiempo
        setTimeout(tryInit, 2000);
      }
    });
  }

})();
