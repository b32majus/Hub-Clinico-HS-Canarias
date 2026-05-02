/**
 * Hub Clínico HS Canarias — Namespace Global
 *
 * Este archivo define el namespace principal que contiene todos los módulos
 * de la aplicación en formato clásico (sin import/export) para compatibilidad
 * con file:// protocol.
 *
 * IMPORTANTE: Este archivo debe cargarse PRIMERO antes que cualquier otro módulo.
 */

// Definir namespace global
window.HubTools = {
    // Utilidades generales
    utils: {},

    // Calculadoras de scores HS
    scores: {},
    scoresHS: {},

    // Gestión de datos y base de datos
    data: {},

    // Normalización canónica de campos
    normalizer: {},

    // Gestión de exportaciones HS
    export: {},

    // Control de formularios HS
    form: {},
    formControllerHS: {},

    // Configuración HS
    hsConfig: {}
};

console.log('✅ HubTools namespace inicializado (HS Canarias)');
