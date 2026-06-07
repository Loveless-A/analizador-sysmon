const AlertsUI = (() => {
  let alertsState = [];
  let sortKey = 'timestamp';
  let sortAsc = false;

  function getSeverityClass(severity) {
    const map = {
      Critical: 'badge-severity badge-critical',
      High: 'badge-severity badge-high',
      Medium: 'badge-severity badge-medium',
      Low: 'badge-severity badge-low',
      Info: 'badge-severity badge-info',
    };
    return map[severity] || 'badge-severity badge-info';
  }

  function populateCategoryFilter() {
    const select = document.getElementById('category-filter');
    if (!select) return;
    
    select.innerHTML = '<option value="all">Todas las categorías</option>';
    
    const categories = DetectionRules.getCategories();
    categories.forEach((category) => {
      if (category) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
      }
    });
  }

  function formatRow(alert) {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-700';
    
    const alertType = alert.type || 'Unknown';
    
    tr.innerHTML = `
      <td class="p-3">${alert.timestamp || '-'}</td>
      <td class="p-3"><span class="${getSeverityClass(alert.severity)}">${alert.severity}</span></td>
      <td class="p-3">${alert.rule || alert.name || '-'}</td>
      <td class="p-3"><span class="text-xs text-cyan-400 font-mono">${alertType}</span></td>
      <td class="p-3 text-slate-400">${alert.indicator || 'N/A'}</td>
      <td class="p-3 font-mono text-xs">${alert.mitre || '-'}</td>
      <td class="p-3">
        <button data-id="${alert.id}" class="detail-btn rounded-full bg-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-600">
          Ver
        </button>
      </td>
    `;
    return tr;
  }

  function filterAlerts() {
    const severitySelect = document.getElementById('severity-filter');
    const categorySelect = document.getElementById('category-filter');
    const typeSelect = document.getElementById('alert-type-filter');
    const searchInput = document.getElementById('search-input');

    const severityValue = severitySelect ? severitySelect.value : 'all';
    const categoryValue = categorySelect ? categorySelect.value : 'all';
    const typeValue = typeSelect ? typeSelect.value : 'all';
    const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : '';

    return alertsState.filter((alert) => {
      if (severityValue !== 'all' && alert.severity !== severityValue) return false;
      if (categoryValue !== 'all' && alert.category !== categoryValue) return false;
      const alertType = alert.type || 'Unknown';
      if (typeValue !== 'all' && alertType.toLowerCase() !== typeValue.toLowerCase()) return false;
      if (searchValue) {
        const ruleName = alert.rule || alert.name || '';
        const indicatorText = alert.indicator || '';
        const searchMatch = [
          alert.timestamp, 
          alert.severity, 
          ruleName, 
          alertType, 
          indicatorText, 
          alert.mitre, 
          JSON.stringify(alert.event)
        ]
          .join(' ')
          .toLowerCase()
          .includes(searchValue);

        if (!searchMatch) return false;
      }

      return true;
    });
  }

  function sortAlerts(list) {
    return [...list].sort((a, b) => {
      let leftKey = sortKey;
      let rightKey = sortKey;
      if (sortKey === 'rule' && !a.rule) { leftKey = 'name'; rightKey = 'name'; }

      const left = String(a[leftKey] || '').toLowerCase();
      const right = String(b[rightKey] || '').toLowerCase();

      if (left < right) return sortAsc ? -1 : 1;
      if (left > right) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  function renderTable() {
    const body = document.getElementById('alerts-table-body');
    if (!body) return;
    
    body.innerHTML = '';
    const filtered = sortAlerts(filterAlerts());
    
    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="7" class="p-4 text-center text-slate-500">No se encontraron alertas.</td>`;
      body.appendChild(tr);
      return;
    }
    
    filtered.forEach((alert) => body.appendChild(formatRow(alert)));
    
    document.querySelectorAll('.detail-btn').forEach((button) => {
      button.addEventListener('click', () => openEventModal(button.dataset.id));
    });
  }

  function openEventModal(alertId) {
    const alert = alertsState.find((item) => item.id === alertId);
    if (!alert) return;
    
    const modal = document.getElementById('event-modal');
    if (!modal) return;

    const rawJsonElement = document.getElementById('modal-event-json');
    if (rawJsonElement && alert.event) {
      const rawData = alert.event.raw || alert.event;
      rawJsonElement.textContent = JSON.stringify(rawData, null, 2);
    }

    const summaryElement = document.getElementById('modal-rule-summary');
    if (summaryElement) {
      summaryElement.textContent = `${alert.rule || alert.name} • ${alert.category}`;
    }

    const list = document.getElementById('modal-rule-list');
    if (list) {
      list.innerHTML = `
        <li class="rounded-2xl bg-slate-950/80 p-4">
          <strong class="text-white">${alert.rule || alert.name}</strong>
          <p class="mt-2 text-slate-400 text-sm">${alert.description || alert.ruleDescription || 'Sin descripción'}</p>
          <p class="mt-1 text-slate-500 text-xs">MITRE: ${alert.mitre || 'N/A'}</p>
        </li>
      `;
    }

    const exportBtn = document.getElementById('export-event-btn');
    if (exportBtn && typeof Exporter !== 'undefined') {
      exportBtn.onclick = () => Exporter.exportEvent(alert.event.raw || alert.event);
    }
    
    modal.classList.remove('hidden');
  }

  function attachEvents() {
    const severityFilter = document.getElementById('severity-filter');
    if (severityFilter) severityFilter.addEventListener('change', renderTable);

    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) categoryFilter.addEventListener('change', renderTable);

    const alertTypeFilter = document.getElementById('alert-type-filter');
    if (alertTypeFilter) alertTypeFilter.addEventListener('change', renderTable);

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', renderTable);

    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.add('hidden');
      });
    }

    document.querySelectorAll('th[data-sort]').forEach((header) => {
      header.addEventListener('click', () => {
        const key = header.dataset.sort;
        if (sortKey === key) {
          sortAsc = !sortAsc;
        } else {
          sortKey = key;
          sortAsc = true;
        }
        renderTable();
      });
    });
  }

  function initialize(alerts) {
    alertsState = alerts;
    populateCategoryFilter();
    attachEvents();
    renderTable();
  }

  return {
    initialize,
  };
})();