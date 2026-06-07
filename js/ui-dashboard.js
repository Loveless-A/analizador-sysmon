const DashboardUI = (() => {
  let severityChart = null;
  let eventIdChart = null;
  let timelineChart = null;

  function formatCount(count) {
    return count > 0 ? count : 0;
  }

  function renderSummary(events, alerts) {
    document.getElementById('total-events').textContent = events.length;
    document.getElementById('total-alerts').textContent = alerts.length;
    
    const counts = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});
    
    document.getElementById('severity-summary').textContent =
      `High: ${formatCount(counts.High)} • Medium: ${formatCount(counts.Medium)} • Low: ${formatCount(counts.Low)}`;

    const timeSummaryElement = document.getElementById('time-window-summary');
    if (timeSummaryElement) {
      if (events.length > 0) {
        const timestamps = events
          .map(e => new Date(e.TimeCreated))
          .filter(d => !isNaN(d.getTime()))
          .sort((a, b) => a - b);
        
        if (timestamps.length > 0) {
          const inicio = timestamps[0].toISOString().replace('T', ' ').substring(0, 19);
          const fin = timestamps[timestamps.length - 1].toISOString().replace('T', ' ').substring(0, 19);
          timeSummaryElement.innerHTML = `Desde: <span class="theme-text-highlight font-mono font-semibold">${inicio}</span><br>Hasta: <span class="theme-text-highlight font-mono font-semibold">${fin}</span>`;
        } else {
          timeSummaryElement.textContent = "Fechas no disponibles";
        }
      } else {
        timeSummaryElement.textContent = "Sin archivos cargados";
      }
    }

    const breakdownElement = document.getElementById('eventid-breakdown');
    if (breakdownElement) {
      if (events.length > 0) {
        const idCounts = events.reduce((acc, e) => {
          const id = e.EventID || 'Desconocido';
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {});

        breakdownElement.innerHTML = '';
        Object.keys(idCounts)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .forEach(id => {
            const badge = document.createElement('span');
            badge.className = 'event-id-badge border px-2 py-1 rounded';
            badge.innerHTML = `ID ${id}: <strong class="text-cyan-400">${idCounts[id]}</strong>`;
            breakdownElement.appendChild(badge);
          });
      } else {
        breakdownElement.textContent = "Esperando datos...";
      }
    }
  }

  function buildChart(context, config) {
    if (context.chart) {
      context.chart.destroy();
    }
    return new Chart(context, config);
  }

  function renderSeverityChart(alerts) {
    const counts = ['Critical', 'High', 'Medium', 'Low', 'Info'].map((level) =>
      alerts.filter((alert) => alert.severity === level).length
    );
    
    const canvas = document.getElementById('severity-chart');
    if (!canvas) return;

    severityChart = buildChart(canvas, {
      type: 'pie',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
        datasets: [
          {
            data: counts,
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#38bdf8', '#8b5cf6'],
            borderWidth: 1,
            borderColor: '#0f172a',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, 
        plugins: {
          legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 11 } } },
        },
      },
    });
    
    canvas.chart = severityChart;
  }

  function renderEventIdChart(events) {
    const buckets = {};
    events.forEach((e) => {
      buckets[e.EventID] = (buckets[e.EventID] || 0) + 1;
    });
    const labels = Object.keys(buckets).sort();
    const values = labels.map((l) => buckets[l]);
    
    const canvas = document.getElementById('eventid-chart');
    if (!canvas) return;

    eventIdChart = buildChart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Conteo',
            data: values,
            backgroundColor: '#22d3ee',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, 
        scales: {
          x: { ticks: { color: '#cbd5e1', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#cbd5e1', font: { size: 10 } }, grid: { color: '#1e293b' }, beginAtZero: true },
        },
        plugins: { legend: { display: false } },
      },
    });
    
    canvas.chart = eventIdChart;
  }

  function renderTimeline(events) {
    const buckets = {};
    events.forEach((event) => {
      const time = new Date(event.TimeCreated || event.UtcTime);
      if (Number.isNaN(time.getTime())) return;
      const key = `${time.getUTCFullYear()}-${String(time.getUTCMonth() + 1).padStart(2, '0')}-${String(time.getUTCDate()).padStart(2, '0')} ${String(time.getUTCHours()).padStart(2, '0')}:${String(time.getUTCMinutes()).padStart(2, '0')}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const labels = Object.keys(buckets).sort();
    const values = labels.map((label) => buckets[label]);
    
    const canvas = document.getElementById('timeline-chart');
    if (!canvas) return;

    timelineChart = buildChart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Eventos por minuto',
            data: values,
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.08)',
            fill: true,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, 
        scales: {
          x: { ticks: { color: '#cbd5e1', font: { size: 9 } }, grid: { display: false } },
          y: { ticks: { color: '#cbd5e1', font: { size: 10 } }, grid: { color: '#1e293b' }, beginAtZero: true },
        },
        plugins: { legend: { display: false } },
      },
    });
    
    canvas.chart = timelineChart;
  }

  function render(events, alerts) {
    renderSummary(events, alerts);
    renderSeverityChart(alerts);
    renderEventIdChart(events);
    renderTimeline(events);
  }

  return {
    render,
  };
})();