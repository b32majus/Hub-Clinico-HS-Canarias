// modules/formControllerHS.js — Controlador del formulario de Primera Visita HS
// Hub Clínico HS Canarias v1.0 — Iteración 2

(function () {
  'use strict';

  // ─── Helpers ───────────────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const val = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  const show = (id) => { const el = document.getElementById(id); if (el) el.classList.remove('conditional-field-hidden'); };
  const hide = (id) => { const el = document.getElementById(id); if (el) el.classList.add('conditional-field-hidden'); };

  // ─── Comorbilidades canónicas ──────────────────────────────────────────
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

  // ─── ITERACIÓN 2: Comorbilidad chips (toggle buttons) ──────────────────
  function renderComorbidityChips() {
    const grid = document.getElementById('comorbidityGrid');
    if (!grid) return;
    grid.innerHTML = COMORBILIDADES_HS.map(({ key, label }) => {
      return `<button type="button" class="comorbidity-chip" data-field="${key}" aria-pressed="false">${label}</button>
<input type="hidden" id="${key}" value="NO">`;
    }).join('');

    // Listeners: toggle clase + actualizar hidden input
    grid.querySelectorAll('.comorbidity-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const isActive = chip.classList.toggle('active');
        chip.setAttribute('aria-pressed', String(isActive));
        const hiddenInput = document.getElementById(chip.dataset.field);
        if (hiddenInput) hiddenInput.value = isActive ? 'SI' : 'NO';
        if (typeof window.markFormDirty === 'function') window.markFormDirty();
      });
    });
  }

  // ─── ITERACIÓN 2: Matriz compacta de regiones ──────────────────────────
  function renderRegionMatrix() {
    const tbody = document.getElementById('regionMatrixBody');
    if (!tbody || !HubTools?.hsConfig?.REGIONS) return;

    const regions = HubTools.hsConfig.REGIONS;
    const lesionTypes = HubTools.hsConfig.LESION_TYPES; // Nodulos, Abscesos, Fistulas, Fistulas_Drenantes

    tbody.innerHTML = regions.map((region) => {
      const cells = lesionTypes.map((lt) => {
        const fieldId = `${region.key}_${lt.key}`;
        return `<td><input type="number" id="${fieldId}" data-region="${region.key}" data-type="${lt.key}" min="0" class="region-lesion-input" value="0"></td>`;
      }).join('');
      return `<tr><td>${region.label}</td>${cells}</tr>`;
    }).join('');

    // También renderizar el grid de tarjetas legacy (si existe el contenedor) para compatibilidad
    // pero el principal es la matriz
  }

  // ─── Población de selects desde BD ─────────────────────────────────────
  function populateSelect(selectId, items, valueKey, labelKey, prependEmpty) {
    const sel = document.getElementById(selectId);
    if (!sel || !Array.isArray(items)) return;
    if (prependEmpty !== false) {
      sel.innerHTML = '<option value="">Seleccionar...</option>';
    } else {
      sel.innerHTML = '';
    }
    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item[valueKey] || '';
      opt.textContent = item[labelKey] || '';
      sel.appendChild(opt);
    });
  }

  // ─── Normalizar fármacos para selects de tratamiento ─────────────────────
  function normalizeDrugList(list) {
    return (list || []).map(f => ({
      Nombre: f.Nombre || f.Farmaco || f.nombre || '',
      Categoria: f.Categoria || '',
      Principio_Activo: f.Principio_Activo || ''
    })).filter(f => f.Nombre);
  }

  function populateConsultas() {
    const consultas = HubTools?.data?.getConsultas?.() || [];
    const valueKey = consultas.length && consultas[0].Consulta !== undefined ? 'Consulta' : 'Nombre';
    populateSelect('Consulta', consultas, valueKey, valueKey);
  }

  function populateProfesionales() {
    const profesionales = HubTools?.data?.getProfesionales?.() || [];
    populateSelect('Profesional', profesionales, 'Nombre_Completo', 'Nombre_Completo');
    const stored = localStorage.getItem('hubSelectedProfessional');
    if (stored) {
      const sel = document.getElementById('Profesional');
      if (sel) {
        for (const opt of sel.options) {
          if (opt.value === stored) { opt.selected = true; break; }
        }
      }
    }
  }

  // ─── ITERACIÓN 2: Poblar 4 selects de tratamiento por categoría ────────
  function populateFarmacosHS() {
    // Tratamiento_Actual: todos los fármacos combinados
    const tipos = ['Antibiotico', 'Biologico', 'Topico', 'Sistemico_No_Biologico', 'Otros'];
    const allFarmacos = [];
    tipos.forEach((tipo) => {
      const farmacos = HubTools?.data?.getFarmacosPorTipo?.(tipo) || [];
      farmacos.forEach((f) => {
        allFarmacos.push({ Nombre: f.Nombre || f.nombre || f.Farmaco || '', Tipo: tipo });
      });
    });
    populateSelect('Tratamiento_Actual', allFarmacos, 'Nombre', 'Nombre');

    // Selects de tratamiento indicado por categoría
    const abx = normalizeDrugList(HubTools?.data?.getFarmacosPorTipo?.('Antibiotico'));
    const bio = normalizeDrugList(HubTools?.data?.getFarmacosPorTipo?.('Biologico'));
    const top = normalizeDrugList(HubTools?.data?.getFarmacosPorTipo?.('Topico'));
    const sist = normalizeDrugList(HubTools?.data?.getFarmacosPorTipo?.('Sistemico_No_Biologico'));
    const otros = normalizeDrugList(HubTools?.data?.getFarmacosPorTipo?.('Otros'));

    populateSelect('Trat_Antibiotico', abx, 'Nombre', 'Nombre');
    populateSelect('Trat_Biologico', bio, 'Nombre', 'Nombre');
    populateSelect('Trat_Topico', top, 'Nombre', 'Nombre');
    populateSelect('Trat_Otro', normalizeDrugList([...sist, ...otros]), 'Nombre', 'Nombre');

    // Si no hay BD cargada, añadir opción informativa
    if (!HubTools?.data?.isLoaded) {
      ['Trat_Antibiotico', 'Trat_Biologico', 'Trat_Topico', 'Trat_Otro'].forEach((id) => {
        const sel = document.getElementById(id);
        if (sel && sel.options.length <= 1) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Cargue BD para ver fármacos';
          opt.disabled = true;
          sel.appendChild(opt);
        }
      });
    }
  }

  // ─── Cálculos automáticos ──────────────────────────────────────────────
  function toNum(v) {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }

  function recalculateDiagnosticDelay() {
    const inicio = toNum(val('Anio_Inicio_Sintomas'));
    const diag = toNum(val('Anio_Diagnostico'));
    if (inicio > 0 && diag > 0) {
      setVal('Retraso_Diagnostico_Anios', diag - inicio);
    } else {
      setVal('Retraso_Diagnostico_Anios', '');
    }
  }

  function recalculateIMC() {
    const peso = toNum(val('Peso'));
    const tallaCm = toNum(val('Talla'));
    if (peso > 0 && tallaCm > 0) {
      const tallaM = tallaCm / 100;
      setVal('IMC', (peso / (tallaM * tallaM)).toFixed(2));
    } else {
      setVal('IMC', '');
    }
  }

  function recalculateEcoIHS4() {
    const ecoN = toNum(val('Eco_Nodulos_Total'));
    const ecoA = toNum(val('Eco_Abscesos_Total'));
    const ecoF = toNum(val('Eco_Fistulas_Total'));
    const ecoFD = toNum(val('Eco_Fistulas_Drenantes_Total'));
    const score = ecoN + (ecoA * 2) + ((ecoF + ecoFD) * 4);
    setVal('IHS4_Ecografico', score);
    setVal('IHS4_Ecografico_Categoria', HubTools?.scoresHS?.categorizeIHS4?.(score) || '');
  }

  // ─── Totales de regiones + IHS-4 (unificado con matriz) ────────────────
  function updateHSActivityTotals() {
    if (!HubTools?.hsConfig?.REGIONS || !HubTools?.hsConfig?.LESION_TYPES) return;

    const regions = HubTools.hsConfig.REGIONS;
    const lesionTypes = HubTools.hsConfig.LESION_TYPES;

    let totalNodulos = 0;
    let totalAbscesos = 0;
    let totalFistulas = 0;
    let totalFistulasDrenantes = 0;

    regions.forEach((region) => {
      lesionTypes.forEach((lt) => {
        const fieldId = `${region.key}_${lt.key}`;
        const v = toNum(val(fieldId));
        if (lt.key === 'Nodulos') totalNodulos += v;
        if (lt.key === 'Abscesos') totalAbscesos += v;
        if (lt.key === 'Fistulas') totalFistulas += v;
        if (lt.key === 'Fistulas_Drenantes') totalFistulasDrenantes += v;
      });
    });

    // Hidden inputs para exportación
    setVal('Nodulos_Total', totalNodulos);
    setVal('Abscesos_Total', totalAbscesos);
    setVal('Fistulas_Total', totalFistulas);
    setVal('Fistulas_Drenantes_Total', totalFistulasDrenantes);

    const ihs4 = HubTools?.scoresHS?.calculateIHS4?.({
      nodulos: totalNodulos,
      abscesos: totalAbscesos,
      fistulas: totalFistulas,
      fistulasDrenantes: totalFistulasDrenantes
    });

    setVal('IHS4_Clinico', ihs4);

    const cat = HubTools?.scoresHS?.categorizeIHS4?.(ihs4) || 'ND';
    setVal('IHS4_Clinico_Categoria', cat);

    const badge = document.getElementById('IHS4_Clinico_Categoria_Badge');
    if (badge) {
      badge.textContent = cat;
      badge.className = 'ihs4-badge';
      if (cat === 'Leve') badge.classList.add('ihs4-badge--mild');
      else if (cat === 'Moderada') badge.classList.add('ihs4-badge--moderate');
      else if (cat === 'Grave') badge.classList.add('ihs4-badge--severe');
      else badge.classList.add('ihs4-badge--nd');
    }
  }

  // ─── Listeners de matriz de regiones ───────────────────────────────────
  function initRegionInputsHS() {
    const tbody = document.getElementById('regionMatrixBody');
    if (!tbody) return;

    tbody.addEventListener('input', (e) => {
      if (e.target.classList.contains('region-lesion-input')) {
        updateHSActivityTotals();
      }
    });
  }

  // ─── Listeners condicionales ───────────────────────────────────────────
  function initConditionalFields() {
    // Fumador → mostrar cigarros/años
    const fumador = document.getElementById('Fumador');
    if (fumador) {
      fumador.addEventListener('change', () => {
        if (fumador.value === 'SI') {
          show('Cigarros_Dia_group');
          show('Anios_Fumador_group');
        } else {
          hide('Cigarros_Dia_group');
          hide('Anios_Fumador_group');
          setVal('Cigarros_Dia', '');
          setVal('Anios_Fumador', '');
        }
      });
    }

    // Ecografía → mostrar campos eco (ITERACIÓN 2: mostrar/ocultar inmediatamente)
    const eco = document.getElementById('Ecografia_Realizada');
    if (eco) {
      eco.addEventListener('change', () => {
        if (eco.value === 'SI') {
          show('ecoFields');
        } else {
          hide('ecoFields');
          // Limpiar campos eco al ocultar (opcional, no bloquea exportación)
        }
      });
    }
  }

  // ─── Listeners de cálculo ──────────────────────────────────────────────
  function initCalculationListeners() {
    ['Anio_Inicio_Sintomas', 'Anio_Diagnostico'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', recalculateDiagnosticDelay);
    });

    ['Peso', 'Talla'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', recalculateIMC);
    });

    ['Eco_Nodulos_Total', 'Eco_Abscesos_Total', 'Eco_Fistulas_Total', 'Eco_Fistulas_Drenantes_Total'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', recalculateEcoIHS4);
    });
  }

  // ─── Collapsibles ──────────────────────────────────────────────────────
  function initCollapsibles() {
    $$('.collapsible-header').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const content = btn.nextElementSibling;
        if (!content) return;
        if (btn.classList.contains('active')) {
          content.style.maxHeight = content.scrollHeight + 'px';
        } else {
          content.style.maxHeight = '0';
        }
      });
    });
  }

  // ─── Recolección de datos ──────────────────────────────────────────────
  function collectRegionDataHS() {
    if (!HubTools?.hsConfig?.REGIONS || !HubTools?.hsConfig?.LESION_TYPES) return {};
    const data = {};
    HubTools.hsConfig.REGIONS.forEach((region) => {
      HubTools.hsConfig.LESION_TYPES.forEach((lt) => {
        const fieldId = `${region.key}_${lt.key}`;
        data[fieldId] = val(fieldId);
      });
    });
    data['Otra_Region_Descripcion'] = val('Otra_Region_Descripcion') || '';
    return data;
  }

  function collectBaseDataHS() {
    return {
      NHC: val('NHC'),
      Fecha_Visita: val('Fecha_Visita'),
      Tipo_Visita: val('Tipo_Visita'),
      Centro: val('Centro'),
      Consulta: val('Consulta'),
      Profesional: val('Profesional'),
      Origen_Paciente: val('Origen_Paciente'),
      CIE10: val('CIE10'),
      Motivo_Consulta: val('Motivo_Consulta'),
      Sexo: val('Sexo'),
      Edad: val('Edad'),
      Anio_Nacimiento: val('Anio_Nacimiento'),
      Anio_Inicio_Sintomas: val('Anio_Inicio_Sintomas'),
      Anio_Diagnostico: val('Anio_Diagnostico'),
      Retraso_Diagnostico_Anios: val('Retraso_Diagnostico_Anios'),
      Antecedentes_Familiares_HS: val('Antecedentes_Familiares_HS'),
      Fumador: val('Fumador'),
      Cigarros_Dia: val('Cigarros_Dia'),
      Anios_Fumador: val('Anios_Fumador'),
      Exfumador: val('Exfumador'),
      Peso: val('Peso'),
      Talla: val('Talla'),
      IMC: val('IMC')
    };
  }

  // ─── ITERACIÓN 2: Leer comorbilidades desde hidden inputs ──────────────
  function collectComorbiditiesHS() {
    const data = {};
    COMORBILIDADES_HS.forEach(({ key }) => {
      data[key] = val(key);
    });
    data['Comorbilidad_Otras'] = val('Comorbilidad_Otras');
    return data;
  }

  function collectClinicalActivityHS() {
    return {
      Hurley: val('Hurley'),
      Nodulos_Total: val('Nodulos_Total'),
      Abscesos_Total: val('Abscesos_Total'),
      Fistulas_Total: val('Fistulas_Total'),
      Fistulas_Drenantes_Total: val('Fistulas_Drenantes_Total'),
      IHS4_Clinico: val('IHS4_Clinico'),
      IHS4_Clinico_Categoria: val('IHS4_Clinico_Categoria'),
      Dolor_EVA: val('Dolor_EVA'),
      Prurito_EVA: val('Prurito_EVA'),
      Supuracion_EVA: val('Supuracion_EVA'),
      Brotes_Ultimos_3_Meses: val('Brotes_Ultimos_3_Meses'),
      Visitas_Urgencias_HS_Ultimos_6_Meses: val('Visitas_Urgencias_HS_Ultimos_6_Meses'),
      Antibioticos_Ultimos_6_Meses: val('Antibioticos_Ultimos_6_Meses')
    };
  }

  function collectScarringHS() {
    return {
      Cicatrices: val('Cicatrices'),
      Cicatrices_Descripcion: val('Cicatrices_Descripcion'),
      Tuneles_Cronicos: val('Tuneles_Cronicos'),
      Limitacion_Funcional: val('Limitacion_Funcional'),
      Limitacion_Funcional_Descripcion: val('Limitacion_Funcional_Descripcion')
    };
  }

  function collectUltrasoundHS() {
    return {
      Ecografia_Realizada: val('Ecografia_Realizada'),
      Eco_Nodulos_Total: val('Eco_Nodulos_Total'),
      Eco_Abscesos_Total: val('Eco_Abscesos_Total'),
      Eco_Fistulas_Total: val('Eco_Fistulas_Total'),
      Eco_Fistulas_Drenantes_Total: val('Eco_Fistulas_Drenantes_Total'),
      IHS4_Ecografico: val('IHS4_Ecografico'),
      IHS4_Ecografico_Categoria: val('IHS4_Ecografico_Categoria'),
      Doppler_Positivo: val('Doppler_Positivo'),
      Hallazgos_Ecograficos: val('Hallazgos_Ecograficos')
    };
  }

  function collectPROMsHS() {
    return {
      DLQI: val('DLQI'),
      HSQoL24: val('HSQoL24'),
      EVA_Dolor_Paciente: val('EVA_Dolor_Paciente'),
      EVA_Impacto_Global: val('EVA_Impacto_Global'),
      EVA_Olor: val('EVA_Olor'),
      EVA_Supuracion: val('EVA_Supuracion'),
      Dias_Baja_Ultimos_6_Meses: val('Dias_Baja_Ultimos_6_Meses'),
      Impacto_Laboral: val('Impacto_Laboral'),
      Impacto_Sexual: val('Impacto_Sexual'),
      Comentarios_PROMs: val('Comentarios_PROMs')
    };
  }

  function collectTreatmentHS() {
    const data = {
      Tratamiento_Actual: val('Tratamiento_Actual'),
      Fecha_Inicio_Tratamiento_Actual: val('Fecha_Inicio_Tratamiento_Actual')
    };

    const abxNombres = $$('.previo-abx-nombre');
    const abxDosis = $$('.previo-abx-dosis');
    abxNombres.forEach((el, i) => {
      data[`Previo_Antibiotico_${i + 1}`] = el.value;
      data[`Previo_Antibiotico_Dosis_${i + 1}`] = (abxDosis[i] ? abxDosis[i].value : '');
    });

    const bioNombres = $$('.previo-bio-nombre');
    const bioDosis = $$('.previo-bio-dosis');
    bioNombres.forEach((el, i) => {
      data[`Previo_Biologico_${i + 1}`] = el.value;
      data[`Previo_Biologico_Dosis_${i + 1}`] = (bioDosis[i] ? bioDosis[i].value : '');
    });

    const otroNombres = $$('.previo-otro-nombre');
    const otroDosis = $$('.previo-otro-dosis');
    otroNombres.forEach((el, i) => {
      data[`Previo_Otro_Sistemico_${i + 1}`] = el.value;
      data[`Previo_Otro_Sistemico_Dosis_${i + 1}`] = (otroDosis[i] ? otroDosis[i].value : '');
    });

    ['Trat_Antibiotico', 'Trat_Antibiotico_Dosis', 'Trat_Biologico', 'Trat_Biologico_Dosis',
      'Trat_Topico', 'Trat_Topico_Dosis', 'Trat_Otro', 'Trat_Otro_Dosis'
    ].forEach((id) => { data[id] = val(id); });

    return data;
  }

  function collectDecisionHS() {
    return {
      Decision_Terapeutica: val('Decision_Terapeutica'),
      Continuar_Tratamiento: val('Continuar_Tratamiento'),
      Optimizar_Adherencia: val('Optimizar_Adherencia'),
      Ajuste_Dosis: val('Ajuste_Dosis'),
      Cambio_Tratamiento: val('Cambio_Tratamiento'),
      Cambio_Motivo: val('Cambio_Motivo'),
      Efectos_Adversos: val('Efectos_Adversos'),
      Efectos_Adversos_Descripcion: val('Efectos_Adversos_Descripcion'),
      Suspension_Tratamiento: val('Suspension_Tratamiento'),
      Suspension_Motivo: val('Suspension_Motivo')
    };
  }

  function collectSurgeryHS() {
    const data = {
      Requiere_Cirugia: val('Requiere_Cirugia'),
      Region_Quirurgica: val('Region_Quirurgica'),
      Prioridad_Quirurgica: val('Prioridad_Quirurgica'),
      Cirugia_Realizada: val('Cirugia_Realizada'),
      Fecha_Cirugia: val('Fecha_Cirugia'),
      Resultado_Cirugia: val('Resultado_Cirugia'),
      Comite_Multidisciplinar: val('Comite_Multidisciplinar'),
      Decision_Comite: val('Decision_Comite'),
      Comentarios_Cirugia_Comite: val('Comentarios_Cirugia_Comite')
    };

    $$('input[name="derivacion"]:checked').forEach((cb) => {
      const safeVal = cb.value.replace(/[^a-zA-Z0-9]/g, '_');
      data[`Derivacion_${safeVal}`] = 'SI';
    });
    ['Dermatologia_Quirurgica', 'Cirugia_General', 'Cirugia_Plastica', 'Ginecologia', 'Urologia'].forEach((d) => {
      const key = `Derivacion_${d}`;
      if (data[key] !== 'SI') data[key] = 'NO';
    });

    return data;
  }

  function collectLabHS() {
    return {
      Analitica_Solicitada: val('Analitica_Solicitada'),
      Analitica_Realizada: val('Analitica_Realizada'),
      Medicina_Preventiva_Solicitada: val('Medicina_Preventiva_Solicitada'),
      Medicina_Preventiva_Realizada: val('Medicina_Preventiva_Realizada'),
      Vacunacion_Revisada: val('Vacunacion_Revisada'),
      Cribado_TB: val('Cribado_TB'),
      Cribado_Hepatitis: val('Cribado_Hepatitis'),
      Cribado_VIH: val('Cribado_VIH'),
      Observaciones_Preventiva: val('Observaciones_Preventiva')
    };
  }

  function collectClosingHS() {
    return {
      Plan_Clinico: val('Plan_Clinico'),
      Fecha_Proxima_Revision: val('Fecha_Proxima_Revision'),
      Comentarios_Adicionales: val('Comentarios_Adicionales'),
      TXT_Historia_Generado: val('TXT_Historia_Generado'),
      Fecha_Exportacion: val('Fecha_Exportacion'),
      Version_App: val('Version_App')
    };
  }

  function recopilarDatosPrimeraVisitaHS() {
    return Object.assign(
      {},
      collectBaseDataHS(),
      collectComorbiditiesHS(),
      collectClinicalActivityHS(),
      collectRegionDataHS(),
      collectScarringHS(),
      collectUltrasoundHS(),
      collectPROMsHS(),
      collectTreatmentHS(),
      collectDecisionHS(),
      collectSurgeryHS(),
      collectLabHS(),
      collectClosingHS()
    );
  }

  // ─── Validación ────────────────────────────────────────────────────────
  function validarFormularioPrimeraVisitaHS() {
    const errores = [];
    const required = [
      { id: 'NHC', label: 'NHC' },
      { id: 'Fecha_Visita', label: 'Fecha Visita' },
      { id: 'Consulta', label: 'Consulta' },
      { id: 'Profesional', label: 'Profesional' }
    ];

    required.forEach((field) => {
      const el = document.getElementById(field.id);
      if (!el || !el.value.trim()) {
        errores.push(`El campo "${field.label}" es obligatorio.`);
        if (el) {
          el.style.borderColor = '#dc3545';
          el.style.borderWidth = '2px';
          el.addEventListener('input', () => {
            el.style.borderColor = '';
            el.style.borderWidth = '';
          }, { once: true });
        }
      }
    });

    return { valido: errores.length === 0, errores };
  }

  // ─── Gate TXT antes de TSV ─────────────────────────────────────────────
  function initTxtBeforeTsvGate() {
    if (typeof HubTools?.export?.initTxtBeforeTsvGate === 'function') {
      HubTools.export.initTxtBeforeTsvGate();
    }
  }

  // ─── NHC desde URL ─────────────────────────────────────────────────────
  function initNHCFromURL() {
    const params = new URLSearchParams(window.location.search);
    const nhc = params.get('nhc');
    if (nhc) {
      setVal('NHC', nhc);
    }
  }

  function resolveFormModeFromURL() {
    const params = new URLSearchParams(window.location.search);
    const mode = (params.get('mode') || '').toLowerCase();
    if (mode === 'followup' || mode === 'seguimiento') {
      return 'followup';
    }
    if (mode === 'first' || mode === 'primera') {
      return 'first';
    }
    return null;
  }

  function applyModePresentation(mode) {
    const titleEl = document.getElementById('visitModeTitle');
    if (titleEl) {
      titleEl.innerHTML = mode === 'followup'
        ? 'HUB CLÍNICO — VISITA DE SEGUIMIENTO <span class="highlight">Hidradenitis Supurativa</span>'
        : 'HUB CLÍNICO — PRIMERA VISITA <span class="highlight">Hidradenitis Supurativa</span>';
    }

    setVal('Tipo_Visita', mode === 'followup' ? 'Seguimiento' : 'Primera_Visita');
  }

  // ─── Fecha por defecto ─────────────────────────────────────────────────
  function initDefaultDate() {
    const today = new Date().toISOString().slice(0, 10);
    setVal('Fecha_Visita', today);
  }

  // ─── Dirty form tracking ───────────────────────────────────────────────
  function initDirtyTracking() {
    document.addEventListener('input', () => {
      if (typeof window.markFormDirty === 'function') {
        window.markFormDirty();
      }
    });
  }

  // ─── SEGUIMIENTO: Recolección de datos ─────────────────────────────────
  function recopilarDatosSeguimientoHS() {
    return Object.assign(
      {},
      collectBaseDataHS(),
      collectComorbiditiesHS(),
      collectClinicalActivityHS(),
      collectRegionDataHS(),
      collectScarringHS(),
      collectUltrasoundHS(),
      collectPROMsHS(),
      collectTreatmentHS(),
      collectDecisionHS(),
      collectSurgeryHS(),
      collectLabHS(),
      collectClosingHS()
    );
  }

  // ─── SEGUIMIENTO: Validación ───────────────────────────────────────────
  function validarFormularioSeguimientoHS() {
    const errores = [];
    const required = [
      { id: 'NHC', label: 'NHC' },
      { id: 'Fecha_Visita', label: 'Fecha Visita' },
      { id: 'Profesional', label: 'Profesional' }
    ];

    required.forEach((field) => {
      const el = document.getElementById(field.id);
      if (!el || !el.value.trim()) {
        errores.push(`El campo "${field.label}" es obligatorio.`);
        if (el) {
          el.style.borderColor = '#dc3545';
          el.style.borderWidth = '2px';
          el.addEventListener('input', () => {
            el.style.borderColor = '';
            el.style.borderWidth = '';
          }, { once: true });
        }
      }
    });

    return { valido: errores.length === 0, errores };
  }

  // ─── SEGUIMIENTO: Renderizar contexto de última visita ─────────────────
  function renderLastVisitContextHS(payload) {
    const container = document.getElementById('lastVisitContext');
    const grid = document.getElementById('contextGrid');
    if (!container || !grid || !payload) return;

    const items = [];

    if (payload.Fecha_Visita) items.push({ label: 'Última fecha', value: payload.Fecha_Visita });
    if (payload.IHS4_Clinico) items.push({ label: 'Último IHS-4', value: payload.IHS4_Clinico + (payload.IHS4_Clinico_Categoria ? ' (' + payload.IHS4_Clinico_Categoria + ')' : '') });
    if (payload.Hurley) items.push({ label: 'Último Hurley', value: payload.Hurley });
    if (payload.Tratamiento_Actual) items.push({ label: 'Tratamiento actual', value: payload.Tratamiento_Actual });
    if (payload.Decision_Terapeutica) items.push({ label: 'Última decisión', value: payload.Decision_Terapeutica });
    if (payload.Requiere_Cirugia === 'SI' || payload.Cirugia_Realizada === 'Pendiente') {
      items.push({ label: 'Cirugía/comité', value: payload.Cirugia_Realizada === 'Pendiente' ? 'Pendiente' : 'Derivada' });
    }
    if (payload.Fecha_Proxima_Revision) items.push({ label: 'Próxima revisión previa', value: payload.Fecha_Proxima_Revision });

    const affectedRegions = [];
    if (HubTools?.hsConfig?.REGIONS) {
      HubTools.hsConfig.REGIONS.forEach((region) => {
        const n = toNum(payload[`${region.key}_Nodulos`] || 0);
        const a = toNum(payload[`${region.key}_Abscesos`] || 0);
        const f = toNum(payload[`${region.key}_Fistulas`] || 0);
        const fd = toNum(payload[`${region.key}_Fistulas_Drenantes`] || 0);
        if (n + a + f + fd > 0) affectedRegions.push(region.label);
      });
    }
    if (affectedRegions.length) items.push({ label: 'Regiones más afectas', value: affectedRegions.join(', ') });

    if (!items.length) { container.style.display = 'none'; return; }

    grid.innerHTML = items.map((item) => {
      return `<div class="context-item">
        <span class="context-item__label">${item.label}</span>
        <span class="context-item__value">${item.value}</span>
      </div>`;
    }).join('');

    container.style.display = '';
  }

  // ─── SEGUIMIENTO: Precargar datos estables ─────────────────────────────
  function prefillSeguimientoHS(nhc) {
    if (!nhc) return;

    const history = HubTools?.data?.getPatientHistory?.(nhc);
    if (!history || !history.latestVisit) {
      console.warn('No se encontró historial para NHC:', nhc);
      return;
    }

    const latest = history.latestVisit;

    // Precargar datos ESTABLES (editables)
    setInputValue('NHC', latest.NHC || nhc);
    setInputValue('Sexo', latest.Sexo || '');
    setInputValue('Anio_Nacimiento', latest.Anio_Nacimiento || '');
    setInputValue('Anio_Inicio_Sintomas', latest.Anio_Inicio_Sintomas || '');
    setInputValue('Anio_Diagnostico', latest.Anio_Diagnostico || '');
    setInputValue('Antecedentes_Familiares_HS', latest.Antecedentes_Familiares_HS || '');
    setInputValue('Peso', latest.Peso || '');
    setInputValue('Talla', latest.Talla || '');

    // ITERACIÓN 2: Precargar comorbilidades como chips
    COMORBILIDADES_HS.forEach(({ key }) => {
      const chip = document.querySelector(`.comorbidity-chip[data-field="${key}"]`);
      const hiddenInput = document.getElementById(key);
      const isActive = latest[key] === 'SI' || latest[key] === 'SÍ';
      if (chip) {
        chip.classList.toggle('active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
      }
      if (hiddenInput) hiddenInput.value = isActive ? 'SI' : 'NO';
    });

    // Precargar tratamiento actual si existe
    if (latest.Tratamiento_Actual) setInputValue('Tratamiento_Actual', latest.Tratamiento_Actual);
    if (latest.Fecha_Inicio_Tratamiento_Actual) setInputValue('Fecha_Inicio_Tratamiento_Actual', latest.Fecha_Inicio_Tratamiento_Actual);

    // Mostrar contexto de última visita (NO editable)
    renderLastVisitContextHS({
      Fecha_Visita: latest.Fecha_Visita,
      IHS4_Clinico: latest.IHS4_Clinico,
      IHS4_Clinico_Categoria: latest.IHS4_Clinico_Categoria,
      Hurley: latest.Hurley,
      Tratamiento_Actual: latest.Tratamiento_Actual,
      Decision_Terapeutica: latest.Decision_Terapeutica,
      Fecha_Proxima_Revision: latest.Fecha_Proxima_Revision
    });

    recalculateDiagnosticDelay();
    recalculateIMC();

    console.log('✅ Seguimiento: datos precargados para NHC', nhc);
  }

  // Helper seguro para setear valores
  function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
      el.value = String(value);
    }
  }

  // ─── INIT PÚBLICO ──────────────────────────────────────────────────────
  function initHSForm(options) {
    const opts = options || {};
    const mode = opts.mode || 'first';

    initDefaultDate();
    initNHCFromURL();
    applyModePresentation(mode);

    // ITERACIÓN 2: Chips en vez de grid de selects
    renderComorbidityChips();

    // ITERACIÓN 2: Matriz compacta en vez de tarjetas
    renderRegionMatrix();

    populateConsultas();
    populateProfesionales();
    populateFarmacosHS();

    initCollapsibles();
    initRegionInputsHS();
    initConditionalFields();
    initCalculationListeners();
    initTxtBeforeTsvGate();

    // Botones de exportación
    const txtBtn = document.getElementById('btnExportarTXT');
    if (txtBtn) {
      txtBtn.addEventListener('click', () => {
        const validator = mode === 'followup' ? validarFormularioSeguimientoHS : validarFormularioPrimeraVisitaHS;
        const collector = mode === 'followup' ? recopilarDatosSeguimientoHS : recopilarDatosPrimeraVisitaHS;
        const validation = validator();
        if (!validation.valido) {
          if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
            HubTools.utils.mostrarNotificacion(
              'Campos obligatorios pendientes: ' + validation.errores.join(' | '),
              'error'
            );
          }
          return;
        }
        const datos = collector();
        datos.Tipo_Visita = mode === 'followup' ? 'Seguimiento' : 'Primera_Visita';
        datos.Version_App = HS_APP_CONFIG?.version || '1.0.0';
        HubTools.export.exportarTXT_HS(datos, datos.Tipo_Visita);
      });
    }

    const tsvBtn = document.getElementById('btnCopiarTSV');
    if (tsvBtn) {
      tsvBtn.addEventListener('click', () => {
        const collector = mode === 'followup' ? recopilarDatosSeguimientoHS : recopilarDatosPrimeraVisitaHS;
        const datos = collector();
        datos.Tipo_Visita = mode === 'followup' ? 'Seguimiento' : 'Primera_Visita';
        datos.Version_App = HS_APP_CONFIG?.version || '1.0.0';
        HubTools.export.exportarYCopiarTSV_HS(datos, datos.Tipo_Visita);
      });
    }

    initDirtyTracking();

    if (mode === 'followup') {
      const nhc = val('NHC');
      if (nhc) prefillSeguimientoHS(nhc);
      const nhcInput = document.getElementById('NHC');
      if (nhcInput) {
        nhcInput.addEventListener('blur', () => {
          const v = nhcInput.value.trim();
          if (v) prefillSeguimientoHS(v);
        });
      }
    }

    console.log('✅ formControllerHS inicializado (mode: ' + mode + ')');
  }

  // ─── Exponer al namespace ──────────────────────────────────────────────
  if (typeof HubTools !== 'undefined') {
    HubTools.form.initHSForm = initHSForm;
    HubTools.form.updateHSActivityTotals = updateHSActivityTotals;
    HubTools.form.collectRegionDataHS = collectRegionDataHS;
    HubTools.form.collectBaseDataHS = collectBaseDataHS;
    HubTools.form.recopilarDatosPrimeraVisitaHS = recopilarDatosPrimeraVisitaHS;
    HubTools.form.validarFormularioPrimeraVisitaHS = validarFormularioPrimeraVisitaHS;
    HubTools.form.recopilarDatosSeguimientoHS = recopilarDatosSeguimientoHS;
    HubTools.form.validarFormularioSeguimientoHS = validarFormularioSeguimientoHS;
    HubTools.form.prefillSeguimientoHS = prefillSeguimientoHS;
    HubTools.form.renderLastVisitContextHS = renderLastVisitContextHS;
  }

  // Auto-init
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const initForm = () => {
        const modeFromQuery = resolveFormModeFromURL();
        const isSeguimiento = window.location.pathname.includes('seguimiento');
        initHSForm({ mode: modeFromQuery || (isSeguimiento ? 'followup' : 'first') });
      };
      
      if (typeof HubTools?.data?.isLoaded !== 'undefined' && HubTools.data.isLoaded) {
        initForm();
      } else if (typeof HubTools?.data?.initDatabaseFromStorage === 'function') {
        HubTools.data.initDatabaseFromStorage();
        window.addEventListener('databaseLoaded', initForm);
      } else {
        initForm();
      }
    });
  }

})();
