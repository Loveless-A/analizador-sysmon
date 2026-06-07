const AlertEngine = (() => {
  const severityPriority = ['Critical', 'High', 'Medium', 'Low', 'Info'];

  function createAlert(event, rule) {
    return {
      id: `${rule.id}-${event.ProcessGuid || event.ProcessId}-${event.TimeCreated}`,
      timestamp: event.TimeCreated,
      severity: rule.severity,
      rule: rule.name,
      category: rule.category,
      type: rule.type || 'Unknown', 
      indicator: rule.indicator,
      mitre: rule.mitre,
      event,
      ruleDescription: rule.description,
    };
  }

  function generateAlerts(events) {
    const alerts = [];
    const chunkSize = 200;
    let i = 0;

    return new Promise((resolve) => {

      function processChunk() {
        const end = Math.min(i + chunkSize, events.length);

        for (; i < end; i++) {
          const event = events[i];
          const matched = DetectionRules.evaluate(event);

          matched.forEach((rule) => {
            alerts.push(createAlert(event, rule));
          });
        }

        if (i < events.length) {
          setTimeout(processChunk, 0); 
        } else {
          alerts.sort((a, b) =>
            severityPriority.indexOf(a.severity) -
            severityPriority.indexOf(b.severity)
          );
          resolve(alerts);
        }
      }

      processChunk();
    });
  }

  function summarize(alerts) {
    return alerts.reduce(
      (acc, alert) => {
        acc.total += 1;
        acc.bySeverity[alert.severity] = (acc.bySeverity[alert.severity] || 0) + 1;
        return acc;
      },
      { total: 0, bySeverity: {} }
    );
  }

  return {
    generateAlerts,
    summarize,
  };
})();
