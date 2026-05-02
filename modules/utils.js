// ============================================
// HUB CLÍNICO HS CANARIAS — UTILIDADES
// ============================================
// Módulo de funciones utilitarias compartidas
//
// FUNCIONES INCLUIDAS:
// ✅ getFormattedDate: Formatea fechas a YYYY-MM-DD
// ✅ calcularIMC: Calcula el índice de masa corporal
// ✅ mostrarNotificacion: Muestra notificaciones temporales
// ✅ formatearFecha: Convierte DD/MM/YYYY a fecha legible
// ✅ calcularEdad: Calcula edad desde fecha de nacimiento
// ============================================

// =====================================
// UTILIDADES DE FECHAS
// =====================================

function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';

    let date;

    if (fechaStr.includes('/')) {
        const [day, month, year] = fechaStr.split('/');
        date = new Date(year, month - 1, day);
    } else if (fechaStr.includes('-')) {
        date = new Date(fechaStr);
    } else {
        return fechaStr;
    }

    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const año = date.getFullYear();

    return `${dia} de ${mes} de ${año}`;
}

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;

    let fechaNac;

    if (fechaNacimiento.includes('/')) {
        const [day, month, year] = fechaNacimiento.split('/');
        fechaNac = new Date(year, month - 1, day);
    } else if (fechaNacimiento.includes('-')) {
        fechaNac = new Date(fechaNacimiento);
    } else {
        return null;
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();

    const mesActual = hoy.getMonth();
    const mesNacimiento = fechaNac.getMonth();

    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }

    return edad;
}

// =====================================
// UTILIDADES DE CÁLCULOS
// =====================================

function calcularIMC() {
    const pesoInput = document.getElementById('peso');
    const tallaInput = document.getElementById('talla');
    const imcInput = document.getElementById('imc');

    if (!pesoInput || !tallaInput || !imcInput) return;

    const peso = parseFloat(pesoInput.value);
    const tallaCm = parseFloat(tallaInput.value);
    if (!isNaN(peso) && !isNaN(tallaCm) && tallaCm > 0) {
        const tallaM = tallaCm / 100;
        const imc = peso / (tallaM * tallaM);
        imcInput.value = imc.toFixed(2);
    } else {
        imcInput.value = '';
    }
}

// =====================================
// UTILIDADES DE UI
// =====================================

function mostrarNotificacion(mensaje, tipo = 'success') {
    const isWarning = tipo === 'warning';
    const background = tipo === 'success' ? '#28a745' : isWarning ? '#ffc107' : '#dc3545';
    const foreground = isWarning ? '#1f2937' : '#ffffff';
    const durationMs = isWarning ? 10000 : tipo === 'error' ? 6000 : 3000;
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${background};
        color: ${foreground};
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.45;
        max-width: 540px;
        animation: slideIn 0.3s ease;
        cursor: pointer;
    `;
    notif.innerHTML = `<i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${mensaje}`;
    notif.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    notif.setAttribute('title', 'Clic para cerrar');
    document.body.appendChild(notif);

    const dismiss = () => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    };

    notif.addEventListener('click', dismiss);
    setTimeout(dismiss, durationMs);
}

// =====================================
// VALIDACIÓN DE FORMULARIOS
// =====================================

const REQUIRED_FIELDS = {
    primera_visita: ['NHC', 'Fecha_Visita', 'Consulta', 'Profesional'],
    seguimiento: ['NHC', 'Fecha_Visita', 'Consulta', 'Profesional']
};

function validarCamposRequeridos(tipoFormulario) {
    const requeridos = REQUIRED_FIELDS[tipoFormulario] || [];
    const errores = [];

    requeridos.forEach(id => {
        const elem = document.getElementById(id);
        if (!elem || !elem.value.trim()) {
            errores.push(id);
            if (elem) {
                elem.style.borderColor = '#dc3545';
                elem.style.borderWidth = '2px';
            }
        } else if (elem) {
            elem.style.borderColor = '';
            elem.style.borderWidth = '';
        }
    });

    return errores;
}

// =====================================
// EXPOSICIÓN AL NAMESPACE HUBTOOLS
// =====================================

if (typeof HubTools !== 'undefined') {
    HubTools.utils.getFormattedDate = getFormattedDate;
    HubTools.utils.formatearFecha = formatearFecha;
    HubTools.utils.calcularEdad = calcularEdad;
    HubTools.utils.calcularIMC = calcularIMC;
    HubTools.utils.mostrarNotificacion = mostrarNotificacion;
    HubTools.utils.validarCamposRequeridos = validarCamposRequeridos;
    HubTools.utils.REQUIRED_FIELDS = REQUIRED_FIELDS;

    console.log('✅ Módulo utils cargado (HS)');
} else {
    console.error('❌ Error: HubTools namespace no encontrado.');
}
