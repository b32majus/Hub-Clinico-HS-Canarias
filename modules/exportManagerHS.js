// modules/exportManagerHS.js — Gestión de exportaciones HS (TXT + TSV)
// Hub Clínico HS Canarias v1.0

(function () {
  'use strict';

  // ─── Helpers de sanitización ───────────────────────────────────────────
  function sanitizeTSVValue(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/\t/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ');
  }

  function normalizarEstadoHS(value, fallback) {
    if (fallback === undefined || fallback === null) fallback = 'ND';
    if (value === null || value === undefined || value === '') return fallback;
    const normalized = String(value).trim().toUpperCase();
    if (['SI', 'S', 'YES', 'TRUE', '1'].includes(normalized)) return 'SI';
    if (['NO', 'N', 'FALSE', '0'].includes(normalized)) return 'NO';
    if (['NA', 'N/A', 'NO APLICA'].includes(normalized)) return 'NA';
    return fallback;
  }

  function resolveHSValue(datos, header) {
    if (datos && datos[header] !== undefined && datos[header] !== null) {
      return datos[header];
    }
    return '';
  }

  // ─── Generación de TXT clínico ─────────────────────────────────────────
  function generarTXT_HS(datos, tipoVisita) {
    if (!datos) return '';
    const lines = [];
    const visitLabel = (tipoVisita === 'Seguimiento') ? 'VISITA DE SEGUIMIENTO' : 'PRIMERA VISITA';

    lines.push('═══════════════════════════════════════════════════════');
    lines.push('  HUB CLÍNICO HS CANARIAS — ' + visitLabel);
    lines.push('  Hospital Universitario de Canarias');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');

    // Identificación
    lines.push('── IDENTIFICACIÓN Y CONTEXTO ──');
    lines.push('NHC: ' + (datos.NHC || '—'));
    lines.push('Fecha Visita: ' + (datos.Fecha_Visita || '—'));
    lines.push('Tipo Visita: ' + (datos.Tipo_Visita || '—'));
    lines.push('Centro: ' + (datos.Centro || '—'));
    lines.push('Consulta: ' + (datos.Consulta || '—'));
    lines.push('Profesional: ' + (datos.Profesional || '—'));
    if (datos.Origen_Paciente) lines.push('Origen: ' + datos.Origen_Paciente);
    lines.push('CIE-10: ' + (datos.CIE10 || 'L73.2'));
    if (datos.Motivo_Consulta) lines.push('Motivo: ' + datos.Motivo_Consulta);
    lines.push('');

    // Datos basales
    lines.push('── DATOS BASALES ──');
    lines.push('Sexo: ' + (datos.Sexo || '—'));
    lines.push('Edad: ' + (datos.Edad || '—'));
    lines.push('Año Nacimiento: ' + (datos.Anio_Nacimiento || '—'));
    lines.push('Año Inicio Síntomas: ' + (datos.Anio_Inicio_Sintomas || '—'));
    lines.push('Año Diagnóstico: ' + (datos.Anio_Diagnostico || '—'));
    if (datos.Retraso_Diagnostico_Anios) lines.push('Retraso Diagnóstico: ' + datos.Retraso_Diagnostico_Anios + ' años');
    lines.push('Antecedentes Familiares HS: ' + (datos.Antecedentes_Familiares_HS || '—'));
    lines.push('Fumador: ' + (datos.Fumador || '—'));
    if (datos.Fumador === 'SI') {
      lines.push('  Cigarros/día: ' + (datos.Cigarros_Dia || '—'));
      lines.push('  Años fumador: ' + (datos.Anios_Fumador || '—'));
    }
    lines.push('Exfumador: ' + (datos.Exfumador || '—'));
    lines.push('Peso: ' + (datos.Peso ? datos.Peso + ' kg' : '—'));
    lines.push('Talla: ' + (datos.Talla ? datos.Talla + ' cm' : '—'));
    lines.push('IMC: ' + (datos.IMC || '—'));
    lines.push('');

    // Comorbilidades
    const comorbPresent = [];
    const COMORBILIDADES_HS = [
      { key: 'Comorbilidad_Diabetes', label: 'Diabetes' },
      { key: 'Comorbilidad_HTA', label: 'HTA' },
      { key: 'Comorbilidad_Dislipemia', label: 'Dislipemia' },
      { key: 'Comorbilidad_Obesidad', label: 'Obesidad' },
      { key: 'Comorbilidad_Sindrome_Metabolico', label: 'Síndrome Metabólico' },
      { key: 'Comorbilidad_ECV', label: 'ECV' },
      { key: 'Comorbilidad_Esteatosis_Hepatica', label: 'Esteatosis Hepática' },
      { key: 'Comorbilidad_EII', label: 'EII' },
      { key: 'Comorbilidad_Crohn', label: 'Crohn' },
      { key: 'Comorbilidad_Colitis_Ulcerosa', label: 'Colitis Ulcerosa' },
      { key: 'Comorbilidad_Artritis', label: 'Artritis' },
      { key: 'Comorbilidad_Psoriasis', label: 'Psoriasis' },
      { key: 'Comorbilidad_Acne', label: 'Acné' },
      { key: 'Comorbilidad_Sinus_Pilonidal', label: 'Sinus Pilonidal' },
      { key: 'Comorbilidad_SOP', label: 'SOP' },
      { key: 'Comorbilidad_Depresion', label: 'Depresión' },
      { key: 'Comorbilidad_Ansiedad', label: 'Ansiedad' },
      { key: 'Comorbilidad_PASH_PAPASH', label: 'PASH/PAPASH' },
      { key: 'Comorbilidad_Pioderma_Gangrenoso', label: 'Pioderma Gangrenoso' },
      { key: 'Comorbilidad_Foliculitis_Decalvante', label: 'Foliculitis Decalvante' }
    ];
    COMORBILIDADES_HS.forEach(function (c) {
      const v = datos[c.key];
      if (v === 'SI') comorbPresent.push(c.label);
    });
    lines.push('── COMORBILIDADES ──');
    lines.push(comorbPresent.length ? comorbPresent.join(', ') : 'Ninguna registrada');
    if (datos.Comorbilidad_Otras) lines.push('Otras: ' + datos.Comorbilidad_Otras);
    lines.push('');

    // Actividad clínica
    lines.push('── ACTIVIDAD CLÍNICA HS ──');
    lines.push('Hurley: ' + (datos.Hurley || '—'));
    lines.push('Nódulos: ' + (datos.Nodulos_Total || '0') + ' | Abscesos: ' + (datos.Abscesos_Total || '0') + ' | Fístulas: ' + (datos.Fistulas_Total || '0') + ' | Fístulas drenantes: ' + (datos.Fistulas_Drenantes_Total || '0'));
    lines.push('IHS-4: ' + (datos.IHS4_Clinico || '0') + ' (' + (datos.IHS4_Clinico_Categoria || 'ND') + ')');
    lines.push('Dolor EVA: ' + (datos.Dolor_EVA || '—') + ' | Prurito EVA: ' + (datos.Prurito_EVA || '—') + ' | Supuración EVA: ' + (datos.Supuracion_EVA || '—'));
    lines.push('Brotes (3 meses): ' + (datos.Brotes_Ultimos_3_Meses || '0'));
    lines.push('Visitas Urgencias (6 meses): ' + (datos.Visitas_Urgencias_HS_Ultimos_6_Meses || '0'));
    lines.push('Antibióticos (6 meses): ' + (datos.Antibioticos_Ultimos_6_Meses || '0'));
    lines.push('');

    // Regiones con lesiones
    lines.push('── LESIONES POR REGIÓN ──');
    if (typeof HubTools !== 'undefined' && HubTools.hsConfig && HubTools.hsConfig.REGIONS) {
      HubTools.hsConfig.REGIONS.forEach(function (region) {
        var n = datos[region.key + '_Nodulos'] || '0';
        var a = datos[region.key + '_Abscesos'] || '0';
        var f = datos[region.key + '_Fistulas'] || '0';
        var fd = datos[region.key + '_Fistulas_Drenantes'] || '0';
        var total = toNum(n) + toNum(a) + toNum(f) + toNum(fd);
        if (total > 0) {
          lines.push('  ' + region.label + ': N=' + n + ' A=' + a + ' F=' + f + ' FD=' + fd);
        }
      });
    }
    lines.push('');

    // Cicatrices
    lines.push('── CICATRICES Y DAÑO ESTRUCTURAL ──');
    lines.push('Cicatrices: ' + (datos.Cicatrices || '—'));
    if (datos.Cicatrices_Descripcion) lines.push('  ' + datos.Cicatrices_Descripcion);
    lines.push('Túneles crónicos: ' + (datos.Tuneles_Cronicos || '—'));
    lines.push('Limitación funcional: ' + (datos.Limitacion_Funcional || '—'));
    if (datos.Limitacion_Funcional_Descripcion) lines.push('  ' + datos.Limitacion_Funcional_Descripcion);
    lines.push('');

    // Ecografía
    if (datos.Ecografia_Realizada === 'SI') {
      lines.push('── ECOGRAFÍA ──');
      lines.push('Eco Nódulos: ' + (datos.Eco_Nodulos_Total || '0') + ' | Abscesos: ' + (datos.Eco_Abscesos_Total || '0') + ' | Fístulas: ' + (datos.Eco_Fistulas_Total || '0') + ' | Drenantes: ' + (datos.Eco_Fistulas_Drenantes_Total || '0'));
      lines.push('IHS-4 Eco: ' + (datos.IHS4_Ecografico || '0') + ' (' + (datos.IHS4_Ecografico_Categoria || 'ND') + ')');
      lines.push('Doppler: ' + (datos.Doppler_Positivo || '—'));
      if (datos.Hallazgos_Ecograficos) lines.push('Hallazgos: ' + datos.Hallazgos_Ecograficos);
      lines.push('');
    }

    // PROMs
    lines.push('── PROMs ──');
    lines.push('DLQI: ' + (datos.DLQI || '—') + ' | HSQoL-24: ' + (datos.HSQoL24 || '—'));
    lines.push('EVA Dolor: ' + (datos.EVA_Dolor_Paciente || '—') + ' | Impacto Global: ' + (datos.EVA_Impacto_Global || '—'));
    lines.push('EVA Olor: ' + (datos.EVA_Olor || '—') + ' | Supuración: ' + (datos.EVA_Supuracion || '—'));
    lines.push('Días baja (6m): ' + (datos.Dias_Baja_Ultimos_6_Meses || '0'));
    lines.push('Impacto laboral: ' + (datos.Impacto_Laboral || '—') + ' | Impacto sexual: ' + (datos.Impacto_Sexual || '—'));
    if (datos.Comentarios_PROMs) lines.push('Comentarios: ' + datos.Comentarios_PROMs);
    lines.push('');

    // Tratamiento
    lines.push('── TRATAMIENTO ──');
    lines.push('Tratamiento actual: ' + (datos.Tratamiento_Actual || '—'));
    lines.push('Fecha inicio: ' + (datos.Fecha_Inicio_Tratamiento_Actual || '—'));

    for (var i = 1; i <= 3; i++) {
      var abx = datos['Previo_Antibiotico_' + i];
      if (abx) lines.push('  Previo Abx ' + i + ': ' + abx + ' (' + (datos['Previo_Antibiotico_Dosis_' + i] || '—') + ')');
    }
    for (var j = 1; j <= 3; j++) {
      var bio = datos['Previo_Biologico_' + j];
      if (bio) lines.push('  Previo Bio ' + j + ': ' + bio + ' (' + (datos['Previo_Biologico_Dosis_' + j] || '—') + ')');
    }
    for (var k = 1; k <= 2; k++) {
      var otro = datos['Previo_Otro_Sistemico_' + k];
      if (otro) lines.push('  Previo Otro ' + k + ': ' + otro + ' (' + (datos['Previo_Otro_Sistemico_Dosis_' + k] || '—') + ')');
    }

    if (datos.Trat_Antibiotico) lines.push('→ Antibiótico: ' + datos.Trat_Antibiotico + ' (' + (datos.Trat_Antibiotico_Dosis || '—') + ')');
    if (datos.Trat_Biologico) lines.push('→ Biológico: ' + datos.Trat_Biologico + ' (' + (datos.Trat_Biologico_Dosis || '—') + ')');
    if (datos.Trat_Topico) lines.push('→ Tópico: ' + datos.Trat_Topico + ' (' + (datos.Trat_Topico_Dosis || '—') + ')');
    if (datos.Trat_Otro) lines.push('→ Otro: ' + datos.Trat_Otro + ' (' + (datos.Trat_Otro_Dosis || '—') + ')');
    lines.push('');

    // Decisión
    lines.push('── DECISIÓN TERAPÉUTICA ──');
    lines.push('Decisión: ' + (datos.Decision_Terapeutica || '—'));
    lines.push('Continuar: ' + (datos.Continuar_Tratamiento || '—') + ' | Optimizar adherencia: ' + (datos.Optimizar_Adherencia || '—'));
    lines.push('Ajuste dosis: ' + (datos.Ajuste_Dosis || '—') + ' | Cambio: ' + (datos.Cambio_Tratamiento || '—'));
    if (datos.Cambio_Motivo) lines.push('Motivo cambio: ' + datos.Cambio_Motivo);
    lines.push('Efectos adversos: ' + (datos.Efectos_Adversos || '—'));
    if (datos.Efectos_Adversos_Descripcion) lines.push('  ' + datos.Efectos_Adversos_Descripcion);
    lines.push('Suspensión: ' + (datos.Suspension_Tratamiento || '—'));
    if (datos.Suspension_Motivo) lines.push('  Motivo: ' + datos.Suspension_Motivo);
    lines.push('');

    // Cirugía
    lines.push('── CIRUGÍA / COMITÉ ──');
    lines.push('Requiere cirugía: ' + (datos.Requiere_Cirugia || '—'));
    if (datos.Region_Quirurgica) lines.push('Región: ' + datos.Region_Quirurgica);
    lines.push('Prioridad: ' + (datos.Prioridad_Quirurgica || '—'));
    lines.push('Cirugía realizada: ' + (datos.Cirugia_Realizada || '—'));
    if (datos.Fecha_Cirugia) lines.push('Fecha: ' + datos.Fecha_Cirugia);
    if (datos.Resultado_Cirugia) lines.push('Resultado: ' + datos.Resultado_Cirugia);
    lines.push('Comité: ' + (datos.Comite_Multidisciplinar || '—'));
    if (datos.Decision_Comite) lines.push('Decisión: ' + datos.Decision_Comite);
    if (datos.Comentarios_Cirugia_Comite) lines.push('Comentarios: ' + datos.Comentarios_Cirugia_Comite);
    lines.push('');

    // Analítica
    lines.push('── ANALÍTICA / PREVENTIVA ──');
    lines.push('Analítica solicitada: ' + (datos.Analitica_Solicitada || '—') + ' | Realizada: ' + (datos.Analitica_Realizada || '—'));
    lines.push('Med. Preventiva solicitada: ' + (datos.Medicina_Preventiva_Solicitada || '—') + ' | Realizada: ' + (datos.Medicina_Preventiva_Realizada || '—'));
    lines.push('Vacunación revisada: ' + (datos.Vacunacion_Revisada || '—'));
    lines.push('Cribado TB: ' + (datos.Cribado_TB || '—') + ' | Hepatitis: ' + (datos.Cribado_Hepatitis || '—') + ' | VIH: ' + (datos.Cribado_VIH || '—'));
    if (datos.Observaciones_Preventiva) lines.push('Observaciones: ' + datos.Observaciones_Preventiva);
    lines.push('');

    // Cierre
    lines.push('── CIERRE ──');
    if (datos.Plan_Clinico) lines.push('Plan: ' + datos.Plan_Clinico);
    lines.push('Próxima revisión: ' + (datos.Fecha_Proxima_Revision || '—'));
    if (datos.Comentarios_Adicionales) lines.push('Comentarios: ' + datos.Comentarios_Adicionales);
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('Generado: ' + new Date().toLocaleString('es-ES'));
    lines.push('Versión App: ' + (datos.Version_App || '1.0.0'));

    return lines.join('\n');
  }

  // ─── ITERACIÓN 2: TXT clínico resumido (por defecto) ───────────────────
  function generarTXTResumen_HS(datos, tipoVisita) {
    if (!datos) return '';
    const lines = [];
    const visitLabel = (tipoVisita === 'Seguimiento') ? 'Seguimiento' : 'Primera Visita';

    lines.push('HUB CLÍNICO HS CANARIAS — ' + visitLabel);
    lines.push('Hospital Universitario de Canarias · CIE-10: L73.2');
    lines.push('');

    // Identificación
    lines.push('NHC: ' + (datos.NHC || '—'));
    lines.push('Fecha: ' + (datos.Fecha_Visita || '—'));
    lines.push('Profesional: ' + (datos.Profesional || '—'));
    if (datos.Consulta) lines.push('Consulta: ' + datos.Consulta);
    if (datos.Motivo_Consulta) lines.push('Motivo: ' + datos.Motivo_Consulta);
    lines.push('');

    // Actividad
    lines.push('Hurley: ' + (datos.Hurley || '—'));
    lines.push('IHS-4: ' + (datos.IHS4_Clinico || '0') + ' (' + (datos.IHS4_Clinico_Categoria || 'ND') + ')');
    if (datos.Dolor_EVA || datos.Prurito_EVA || datos.Supuracion_EVA) {
      lines.push('EVA — Dolor: ' + (datos.Dolor_EVA || '—') + ' | Prurito: ' + (datos.Prurito_EVA || '—') + ' | Supuración: ' + (datos.Supuracion_EVA || '—'));
    }
    if (datos.Brotes_Ultimos_3_Meses) lines.push('Brotes (3m): ' + datos.Brotes_Ultimos_3_Meses);

    // Regiones con lesiones (solo las que tienen >0)
    if (typeof HubTools !== 'undefined' && HubTools.hsConfig && HubTools.hsConfig.REGIONS) {
      const affected = [];
      HubTools.hsConfig.REGIONS.forEach(function (region) {
        var n = toNum(datos[region.key + '_Nodulos'] || 0);
        var a = toNum(datos[region.key + '_Abscesos'] || 0);
        var f = toNum(datos[region.key + '_Fistulas'] || 0);
        var fd = toNum(datos[region.key + '_Fistulas_Drenantes'] || 0);
        if (n + a + f + fd > 0) {
          var parts = [];
          if (n > 0) parts.push('N=' + n);
          if (a > 0) parts.push('A=' + a);
          if (f > 0) parts.push('F=' + f);
          if (fd > 0) parts.push('FD=' + fd);
          affected.push(region.label + ' (' + parts.join(', ') + ')');
        }
      });
      if (affected.length) lines.push('Lesiones: ' + affected.join('; '));
    }
    lines.push('');

    // PROMs (solo si constan)
    if (datos.DLQI || datos.HSQoL24) {
      lines.push('DLQI: ' + (datos.DLQI || '—') + ' | HSQoL-24: ' + (datos.HSQoL24 || '—'));
    }
    lines.push('');

    // Tratamiento
    if (datos.Tratamiento_Actual) lines.push('Tratamiento actual: ' + datos.Tratamiento_Actual);
    var tratIndicado = [];
    if (datos.Trat_Antibiotico) tratIndicado.push('Abx: ' + datos.Trat_Antibiotico + (datos.Trat_Antibiotico_Dosis ? ' (' + datos.Trat_Antibiotico_Dosis + ')' : ''));
    if (datos.Trat_Biologico) tratIndicado.push('Bio: ' + datos.Trat_Biologico + (datos.Trat_Biologico_Dosis ? ' (' + datos.Trat_Biologico_Dosis + ')' : ''));
    if (datos.Trat_Topico) tratIndicado.push('Tópico: ' + datos.Trat_Topico + (datos.Trat_Topico_Dosis ? ' (' + datos.Trat_Topico_Dosis + ')' : ''));
    if (datos.Trat_Otro) tratIndicado.push('Otro: ' + datos.Trat_Otro + (datos.Trat_Otro_Dosis ? ' (' + datos.Trat_Otro_Dosis + ')' : ''));
    if (tratIndicado.length) lines.push('Tratamiento indicado: ' + tratIndicado.join('; '));
    lines.push('');

    // Decisión terapéutica
    if (datos.Decision_Terapeutica) lines.push('Decisión: ' + datos.Decision_Terapeutica);
    if (datos.Cambio_Motivo) lines.push('Motivo cambio: ' + datos.Cambio_Motivo);
    lines.push('');

    // Cirugía/comité (si aplica)
    if (datos.Requiere_Cirugia === 'SI' || datos.Comite_Multidisciplinar === 'SI' || datos.Cirugia_Realizada === 'SI' || datos.Cirugia_Realizada === 'Pendiente') {
      if (datos.Requiere_Cirugia === 'SI') lines.push('Cirugía requerida' + (datos.Region_Quirurgica ? ' — ' + datos.Region_Quirurgica : '') + (datos.Prioridad_Quirurgica ? ' (' + datos.Prioridad_Quirurgica + ')' : ''));
      if (datos.Cirugia_Realizada) lines.push('Cirugía realizada: ' + datos.Cirugia_Realizada + (datos.Fecha_Cirugia ? ' (' + datos.Fecha_Cirugia + ')' : ''));
      if (datos.Comite_Multidisciplinar === 'SI') lines.push('Comité multidisciplinar: Sí' + (datos.Decision_Comite ? ' — ' + datos.Decision_Comite : ''));
      lines.push('');
    }

    // Ecografía (si realizada)
    if (datos.Ecografia_Realizada === 'SI') {
      lines.push('Ecografía: realizada');
      if (datos.Hallazgos_Ecograficos) lines.push('Hallazgos: ' + datos.Hallazgos_Ecograficos);
      if (datos.IHS4_Ecografico) lines.push('IHS-4 Eco: ' + datos.IHS4_Ecografico + ' (' + (datos.IHS4_Ecografico_Categoria || 'ND') + ')');
      if (datos.Doppler_Positivo) lines.push('Doppler: ' + datos.Doppler_Positivo);
      lines.push('');
    }

    // Plan y próxima revisión
    if (datos.Plan_Clinico) lines.push('Plan: ' + datos.Plan_Clinico);
    if (datos.Fecha_Proxima_Revision) lines.push('Próxima revisión: ' + datos.Fecha_Proxima_Revision);
    if (datos.Comentarios_Adicionales) lines.push('Notas: ' + datos.Comentarios_Adicionales);

    lines.push('');
    lines.push('Generado: ' + new Date().toLocaleString('es-ES'));
    lines.push('Versión App: ' + (datos.Version_App || '1.0.0'));

    return lines.join('\n');
  }

  function toNum(v) {
    var n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }

  // ─── Exportar TXT (usa resumen por defecto) ────────────────────────────
  function exportarTXT_HS(datos, tipoVisita) {
    // ITERACIÓN 2: usar resumen por defecto
    var txt = generarTXTResumen_HS(datos, tipoVisita);

    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        if (typeof HubTools !== 'undefined' && HubTools.utils && typeof HubTools.utils.mostrarNotificacion === 'function') {
          HubTools.utils.mostrarNotificacion('TXT copiado al portapapeles para historia clínica', 'success');
        }
        setExportFlags();
      } catch (e) {
        if (typeof HubTools !== 'undefined' && HubTools.utils && typeof HubTools.utils.mostrarNotificacion === 'function') {
          HubTools.utils.mostrarNotificacion('No se pudo copiar automáticamente. Seleccione y copie manualmente.', 'warning');
        }
      }
      document.body.removeChild(ta);
    }

    function setExportFlags() {
      var txtField = document.getElementById('TXT_Historia_Generado');
      if (txtField) txtField.value = 'SI';
      var fechaField = document.getElementById('Fecha_Exportacion');
      if (fechaField) fechaField.value = new Date().toISOString();
      initTxtBeforeTsvGate();
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(txt).then(function () {
        if (typeof HubTools !== 'undefined' && HubTools.utils && typeof HubTools.utils.mostrarNotificacion === 'function') {
          HubTools.utils.mostrarNotificacion('TXT copiado al portapapeles para historia clínica', 'success');
        }
        setExportFlags();
      }).catch(function () {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  }

  // ─── Generar fila TSV ─────────────────────────────────────────────────
  function generarFilaTSV_HS(datos) {
    var headers = (typeof HubTools !== 'undefined' && HubTools.hsConfig && HubTools.hsConfig.EXPORT_HEADERS) || [];
    if (!headers.length) return '';
    return headers.map(function (h) {
      return sanitizeTSVValue(resolveHSValue(datos, h));
    }).join('\t');
  }

  // ─── Exportar TSV ──────────────────────────────────────────────────────
  function exportarYCopiarTSV_HS(datos, tipoVisita) {
    var txtGenerated = (document.getElementById('TXT_Historia_Generado') || {}).value;
    if (txtGenerated !== 'SI') {
      if (typeof HubTools !== 'undefined' && HubTools.utils && typeof HubTools.utils.mostrarNotificacion === 'function') {
        HubTools.utils.mostrarNotificacion('Primero debe generar el TXT para historia clínica.', 'warning');
      }
      return;
    }

    var tsv = generarFilaTSV_HS(datos);
    if (!tsv) {
      if (typeof HubTools !== 'undefined' && HubTools.utils && typeof HubTools.utils.mostrarNotificacion === 'function') {
        HubTools.utils.mostrarNotificacion('Error: cabeceras de exportación no disponibles.', 'error');
      }
      return;
    }

    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = tsv;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        if (typeof HubTools !== 'undefined' && HubTools.utils && typeof HubTools.utils.mostrarNotificacion === 'function') {
          HubTools.utils.mostrarNotificacion('Fila TSV copiada. Péguela en la hoja HS del archivo maestro.', 'success');
        }
      } catch (e) {
        if (typeof HubTools !== 'undefined' && HubTools.utils && typeof HubTools.utils.mostrarNotificacion === 'function') {
          HubTools.utils.mostrarNotificacion('No se pudo copiar automáticamente.', 'warning');
        }
      }
      document.body.removeChild(ta);
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(tsv).then(function () {
        if (typeof HubTools !== 'undefined' && HubTools.utils && typeof HubTools.utils.mostrarNotificacion === 'function') {
          HubTools.utils.mostrarNotificacion('Fila TSV copiada. Péguela en la hoja HS del archivo maestro.', 'success');
        }
      }).catch(function () {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  }

  // ─── Gate TXT antes de TSV ─────────────────────────────────────────────
  function initTxtBeforeTsvGate() {
    var tsvBtn = document.getElementById('btnCopiarTSV');
    var txtGenerated = (document.getElementById('TXT_Historia_Generado') || {}).value === 'SI';
    if (tsvBtn) tsvBtn.disabled = !txtGenerated;
  }

  // ─── Exponer en HubTools.export ────────────────────────────────────────
  if (typeof HubTools !== 'undefined') {
    HubTools.export.sanitizeTSVValue = sanitizeTSVValue;
    HubTools.export.normalizarEstadoHS = normalizarEstadoHS;
    HubTools.export.resolveHSValue = resolveHSValue;
    HubTools.export.generarTXT_HS = generarTXT_HS;
    HubTools.export.generarTXTCompleto_HS = generarTXT_HS;
    HubTools.export.generarTXTResumen_HS = generarTXTResumen_HS;
    HubTools.export.exportarTXT_HS = exportarTXT_HS;
    HubTools.export.generarFilaTSV_HS = generarFilaTSV_HS;
    HubTools.export.exportarYCopiarTSV_HS = exportarYCopiarTSV_HS;
    HubTools.export.initTxtBeforeTsvGate = initTxtBeforeTsvGate;
  }

})();
