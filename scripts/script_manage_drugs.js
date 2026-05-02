// scripts/script_manage_drugs.js — Gestión de fármacos HS
// Lee datos de la hoja Farmacos_HS cargada via HubTools.data

document.addEventListener('DOMContentLoaded', () => {
    let currentDrugsData = [];

    const CATEGORY_LABELS = {
        'Antibiotico': 'Antibiótico',
        'Biologico': 'Biológico',
        'Topico': 'Tópico',
        'Sistemico_No_Biologico': 'Sistémico No Biológico',
        'Otros': 'Otros'
    };

    function updateManagementSummary(drugs) {
        const total = drugs.length;
        const recordsCount = document.getElementById('recordsCount');
        const tableCount = document.getElementById('tableCount');
        const tableSummary = document.getElementById('tableSummary');
        if (recordsCount) recordsCount.textContent = total;
        if (tableCount) tableCount.textContent = total;
        if (tableSummary) tableSummary.textContent = total === 1 ? '1 fármaco en catálogo.' : `${total} fármacos en catálogo.`;
    }

    function loadDrugsFromDB() {
        // ITERACIÓN 2: Usar API pública HubTools.data, no appState directo
        if (typeof HubTools !== 'undefined' && HubTools.data && HubTools.data.isLoaded) {
            const tipos = ['Antibiotico', 'Biologico', 'Topico', 'Sistemico_No_Biologico', 'Otros'];
            const allDrugs = [];
            tipos.forEach((tipo) => {
                const farmacos = HubTools.data.getFarmacosPorTipo(tipo);
                farmacos.forEach((f) => allDrugs.push(f));
            });
            return allDrugs;
        }
        return [];
    }

    function renderDrugsTable(drugs) {
        const listBody = document.getElementById('listBody');
        listBody.innerHTML = '';
        updateManagementSummary(drugs);

        if (drugs.length === 0) {
            const row = document.createElement('tr');
            if (typeof HubTools !== 'undefined' && HubTools.data && HubTools.data.isLoaded) {
                row.innerHTML = '<td colspan="4" class="management-empty">No hay fármacos activos en la hoja Farmacos_HS.</td>';
            } else {
                row.innerHTML = '<td colspan="4" class="management-empty">Cargue la base de datos desde Inicio para visualizar el catálogo activo.</td>';
            }
            listBody.appendChild(row);
            return;
        }

        drugs.forEach((drug, index) => {
            const row = document.createElement('tr');
            const catLabel = CATEGORY_LABELS[drug.Categoria] || drug.Categoria || '—';
            const pa = drug.Principio_Activo || '—';
            const nombre = drug.Nombre || drug.Farmaco || '—';
            row.innerHTML = `
                <td>${nombre}</td>
                <td><span class="management-chip">${catLabel}</span></td>
                <td>${pa}</td>
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
        currentDrugsData = loadDrugsFromDB();
        renderDrugsTable(currentDrugsData);
    }

    // Load initial data
    refresh();

    // ITERACIÓN 2: Escuchar AMBOS eventos (window y document)
    window.addEventListener('databaseLoaded', refresh);
    document.addEventListener('databaseLoaded', refresh);

    // Event Listener for Add
    document.getElementById('addForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const drugName = document.getElementById('drugName').value.trim();
        const drugCategory = document.getElementById('drugCategory').value;
        if (drugName && drugCategory) {
            currentDrugsData.push({
                Nombre: drugName,
                Farmaco: drugName,
                Categoria: drugCategory,
                Principio_Activo: '',
                Activo: 'SI'
            });
            renderDrugsTable(currentDrugsData);
            document.getElementById('addForm').reset();
        }
    });

    // Event Listener for Delete
    document.getElementById('listBody').addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.delete-btn');
        if (deleteButton) {
            const index = parseInt(deleteButton.dataset.index, 10);
            currentDrugsData.splice(index, 1);
            renderDrugsTable(currentDrugsData);
        }
    });

    // Event Listener for Copy
    document.getElementById('copyToClipboardBtn').addEventListener('click', () => {
        if (currentDrugsData.length === 0) {
            if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
                HubTools.utils.mostrarNotificacion('No hay fármacos para copiar.', 'warning');
            }
            return;
        }
        const lines = ['Fármaco\tCategoría\tPrincipio_Activo\tActivo'];
        currentDrugsData.forEach(d => {
            lines.push(`${d.Nombre || d.Farmaco || ''}\t${d.Categoria || ''}\t${d.Principio_Activo || ''}\t${d.Activo || 'SI'}`);
        });
        const text = lines.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            if (typeof HubTools?.utils?.mostrarNotificacion === 'function') {
                HubTools.utils.mostrarNotificacion(`Listado de ${currentDrugsData.length} fármacos copiado al portapapeles.`, 'success');
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
