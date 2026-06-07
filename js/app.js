const App = (() => {
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('file-input');
  const statusMessage = document.getElementById('status-message');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const dashboardSection = document.getElementById('dashboard-section');
  const exportBtn = document.getElementById('export-btn');
  let currentAlerts = [];
  let currentEvents = [];

  function updateProgress(ratio) {
    const percent = Math.round(ratio * 100);
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressContainer.classList.remove('hidden');
  }

  function resetProgress() {
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    progressContainer.classList.add('hidden');
  }

  function showMessage(text, type = 'info') {
    statusMessage.textContent = text;
    statusMessage.className = type === 'error' ? 'text-red-400' : 'text-emerald-400';
  }

  function loadEvents(file) {
    showMessage('Procesando archivo... espera unos segundos.', 'info');

    Parser.parseFile(file, updateProgress)
      .then((events) => {
        currentEvents = events;

        return AlertEngine.generateAlerts(events);
      })
      .then((alerts) => {
        currentAlerts = alerts;

        DashboardUI.render(currentEvents, currentAlerts);
        AlertsUI.initialize(currentAlerts);

        dashboardSection.classList.remove('hidden');

        showMessage(
          `Archivo cargado con éxito: ${currentEvents.length} eventos procesados.`,
          'info'
        );
      })
      .catch((error) => {
        showMessage(error.message, 'error');
      })
      .finally(() => {
        resetProgress();
      });
  }

  function refreshAnalysis() {
    if (currentEvents.length === 0) return;
    AlertEngine.generateAlerts(currentEvents).then((alerts) => {
      currentAlerts = alerts;
      DashboardUI.render(currentEvents, currentAlerts);
      AlertsUI.initialize(currentAlerts);
    });
  }

  function getCurrentEvents() {
    return currentEvents;
  }

  function setupDragAndDrop() {
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropArea.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropArea.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropArea.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropArea.classList.remove('drag-over');
      });
    });

    dropArea.addEventListener('drop', (event) => {
      const file = event.dataTransfer.files[0];
      if (!file) return;
      loadEvents(file);
    });
  }

  function setupFileInput() {
    document.getElementById('select-file-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      loadEvents(file);
    });
  }

  function setupExport() {
    exportBtn.addEventListener('click', () => {
      if (currentAlerts.length === 0) {
        showMessage('No hay alertas para exportar.', 'error');
        return;
      }
      Exporter.exportAlerts(currentAlerts);
    });
  }

  function init() {
    setupDragAndDrop();
    setupFileInput();
    setupExport();
  }

  return {
    init,
    getCurrentEvents,
    refreshAnalysis
  };
})();

const RuleBuilder = (() => {

  const list = document.getElementById('custom-rules-list');

  function renderList() {
    list.innerHTML = DetectionRules.getAllRules()
      .filter(r => r.isCustom)
      .map(r => `
        <div style="margin-top:6px; padding:6px; border:1px solid #1e293b; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
          
          <div>
            <b>${r.name}</b> (${r.severity}) - ${r.category}
          </div>

          <button onclick="RuleBuilder.deleteRule('${r.id}')" style="color:red; background:transparent; border:none; cursor:pointer;">
            🗑
          </button>

        </div>
      `).join('');
  }

  function init() {
    document.getElementById('add-rule-btn').addEventListener('click', () => {

      const name = document.getElementById('rule-name').value;
      const category = document.getElementById('rule-category').value;
      const severity = document.getElementById('rule-severity').value;
      const mitre = document.getElementById('rule-mitre').value;
      const pattern = document.getElementById('rule-pattern').value;
      
      const typeFilterEl = document.getElementById('type-filter');
      const typeSelected = typeFilterEl ? typeFilterEl.value : 'all';

      if (!name || !pattern) {
        alert('Falta nombre o condición');
        return;
      }

      const rule = {
        id: 'custom-' + Date.now(),
        name,
        category: category || 'General',
        severity,
        type: typeSelected !== 'all' ? typeSelected : 'Custom',
        mitre: mitre || 'N/A',
        isCustom: true,
        indicator: 'Regla personalizada',
        description: 'Regla creada desde UI',
        match: (e) => {
          try {
            return eval(pattern); 
          } catch {
            return false;
          }
        }
      };

      DetectionRules.addCustomRule(rule);
      renderList();

      App.refreshAnalysis();

      document.getElementById('rule-name').value = '';
      document.getElementById('rule-category').value = '';
      document.getElementById('rule-mitre').value = '';
      document.getElementById('rule-pattern').value = '';
      if (typeFilterEl) typeFilterEl.value = 'all';

    });

    renderList();
  }

  function deleteRule(id) {
    DetectionRules.removeCustomRule(id);
    renderList();
    
    App.refreshAnalysis();
  }

  function setupTheme() {
    const btn = document.getElementById('theme-toggle');

    const applyTheme = (theme) => {
      document.body.classList.toggle('light', theme === 'light');
    };

    btn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light');

      btn.textContent = isLight ? '🌞 Tema' : '🌙 Tema';

      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved);
  }

  return { init, deleteRule, setupTheme };
})();

window.addEventListener('DOMContentLoaded', () => {
  App.init();
  RuleBuilder.init();
  RuleBuilder.setupTheme();
});