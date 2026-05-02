// scripts/script_manage_professionals.js — Gestión de profesionales HS
// Lee datos de la hoja Profesionales cargada via HubTools.data

document.addEventListener('DOMContentLoaded', () => {
    let currentProfessionalsData = [];

    function updateManagementSummary(professionals) {
        const total = professionals.length;
        const recordsCount = document.getElementById('recordsCount');
        const tableCount = document.getElementById('tableCount');
        const tableSummary = document.getElementById('tableSummary');
        if (recordsCount) recordsCount.textContent = total;
        if (tableCount) tableCount.textContent = total;
        if (tableSummary) tableSummary.textContent = total === 1 ? '1 profesional registrado.' : `${total} profesionales registrados.`;
    }

    function loadProfessionalsFromDB() {
        // ITERACIÓN 2: Usar API pública HubTools.data, no appState directo
        if (typeof HubTools !== 'undefined' && HubTools.data && HubTools.data.isLoaded) {
            return HubTools.data.getProfesionales();
        }
        return [];
    }

    function renderProfessionalsTable(professionals) {
        const listBody = document.getElementById('listBody');
        listBody.innerHTML = '';
        updateManagementSummary(professionals);

        if (professionals.length === 0) {
            const row = document.createElement('tr');
            if (typeof HubTools !== 'undefined' && HubTools.data && HubTools.data.isLoaded) {
                row.innerHTML = '<td colspan="3" class="management-empty">No hay profesionales activos en la hoja Profesionales.</td>';
            } else {
                row.innerHTML = '<td colspan="3" class="management-empty">Cargue la base de datos desde Inicio para visualizar el directorio activo.</td>';
            }
            listBody.appendChild(row);
            return;
        }

        professionals.forEach((professional, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${professional.Nombre_Completo || '—'}</td>
                <td><span class="management-chip">${professional.Cargo || '—'}</span></td>
                <td><button type="button" class="delete-btn management-btn management-btn--danger" data-index="${index}"><i class="fas fa-trash-alt"></i><span>Eliminar</span></button></td>
            `;
            listBody.appendChild(row);
        });
    }

    function refresh() {
        // Intentar inicializar BD desde sessionStorage si no está cargada
        if (typeof HubTools?.data?.initDatabaseFromStorage === 'function') {
            HubTools.data.initDatabaseFromStorage();
        }
        currentProfessionalsData = loadProfessionalsFromDB();
        renderProfessionalsTable(currentProfessionalsData);
    }

    // Load initial data
    refresh();

    // ITERACIÓN 2: Escuchar AMBOS eventos (window y document)
    window.addEventListener('databaseLoaded', refresh);
    document.addEventListener('databaseLoaded', refresh);

    // Event Listener for Add
    document.getElementById('addForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const professionalName = document.getElementById('professionalName').value.trim();
        const professionalRole = document.getElementById('professionalRole').value.trim();
        if (professionalName && professionalRole) {
            currentProfessionalsData.push({
                Nombre_Completo: professionalName,
                Cargo: professionalRole,
                Activo: 'SI'
            });
            renderProfessionalsTable(currentProfessionalsData);
            document.getElementById('addForm').reset();
        }
    });

    // Event Listener for Delete
    document.getElementById('listBody').addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.delete-btn');
        if (deleteButton) {
            const index = parseInt(deleteButton.dataset.index, 10);
            currentProfessionalsData.splice(index, 1);
            renderProfessionalsTable(currentProfessionalsData);
        }
    });

    // Event Listener for Copy
    document.getElementById('copyToClipboardBtn').addEventListener('click', () => {
        if (currentProfessionalsData.length === 0) {
            if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
                HubTools.utils.mostrarNotificacion('No hay profesionales para copiar.', 'warning');
            }
            return;
        }
        const lines = ['Nombre_Completo\tCargo\tActivo'];
        currentProfessionalsData.forEach(p => {
            lines.push(`${p.Nombre_Completo || ''}\t${p.Cargo || ''}\t${p.Activo || 'SI'}`);
        });
        const text = lines.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
                HubTools.utils.mostrarNotificacion(`Listado de ${currentProfessionalsData.length} profesionales copiado al portapapeles.`, 'success');
            }
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
                HubTools.utils.mostrarNotificacion('Listado copiado al portapapeles.', 'success');
            }
        });
    });
});
