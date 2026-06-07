const Exporter = (() => {
  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function exportAlerts(alerts) {
    const payload = {
      generatedAt: new Date().toISOString(),
      totalAlerts: alerts.length,
      alerts,
    };
    downloadFile('sysmon-alerts-report.json', JSON.stringify(payload, null, 2));
  }

  function exportEvent(event) {
    downloadFile('sysmon-event.json', JSON.stringify(event, null, 2));
  }

  return {
    exportAlerts,
    exportEvent,
  };
})();
