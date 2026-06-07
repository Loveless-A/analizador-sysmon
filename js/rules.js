const DetectionRules = (() => {
  const rules = [
    {
      id: 'suspicious-shell',
      type: 'Process',
      name: 'Ejecución de shell sospechosa',
      category: 'Ejecución de procesos',
      severity: 'High',
      mitre: 'T1059',
      indicator: 'Proceso Shell detectado',
      match: (event) => {
        const path = String(event.Image || '').toLowerCase();
        return event.EventID === '1' && /(cmd\\.exe|powershell\\.exe|pwsh\\.exe)/.test(path);
      },
      description: 'Detección de comandos en shell y PowerShell desde Sysmon EventID 1.',
    },
    {
      id: 'git-service',
      type: 'Process',
      name: 'Uso de Git desde cuenta de servicio',
      category: 'Herramientas de desarrollador',
      severity: 'Medium',
      mitre: 'T1078',
      indicator: 'Git ejecutado por servicio o cuenta de red',
      match: (event) => {
        const path = String(event.Image || '').toLowerCase();
        return event.EventID === '5' && /\\\\git\\\\(cmd|mingw64\\\\bin\\\\git)\\.exe$/.test(path);
      },
      description: 'Detecta procesos Git ejecutados en el sistema que pueden ser usados para despliegue o exfiltración.',
    },
    {
      id: 'postgres-service',
      type: 'Process',
      name: 'PostgreSQL ejecutado por servicios de red',
      category: 'Base de datos',
      severity: 'Medium',
      mitre: 'T1482',
      indicator: 'PostgreSQL iniciado desde cuenta de servicio',
      match: (event) => {
        const path = String(event.Image || '').toLowerCase();
        return event.EventID === '5' && path.includes('postgres.exe');
      },
      description: 'Evento de proceso de PostgreSQL que puede indicar actividad de base de datos en un endpoint.',
    },
    {
      id: 'system-process',
      type: 'Process',
      name: 'Proceso de sistema común',
      category: 'Procesos de sistema',
      severity: 'Low',
      mitre: 'T1082',
      indicator: 'Proceso de sistema normal detectado',
      match: (event) => {
        const path = String(event.Image || '').toLowerCase();
        return event.EventID === '5' && /(ctfmon\\.exe|consent\\.exe|searchfilterhost\\.exe|audiodg\\.exe)/.test(path);
      },
      description: 'Proceso de sistema legítimo registrado por Sysmon EventID 5.',
    },
    {
      id: 'possible-powershell',
      type: 'PowerShell',
      name: 'PowerShell desde cuenta de usuario',
      category: 'Ejecución de procesos',
      severity: 'High',
      mitre: 'T1059.001',
      indicator: 'PowerShell detectado',
      match: (event) => {
        const path = String(event.Image || '').toLowerCase();
        return event.EventID === '5' && /powershell\\.exe/.test(path);
      },
      description: 'Detecta posibles ejecuciones de PowerShell basadas en procesos de Sysmon.',
    },
    {
      id: 'rdp-inbound-connection',
      type: 'RDP',
      name: 'Conexión RDP Entrante Detectada',
      category: 'Red',
      severity: 'Critical',
      mitre: 'T1021.001',
      indicator: 'Puerto 3389 detectado',
      match: (event) => {
        return event.EventID === '3' && (String(event.DestinationPort) === '3389' || String(event.raw?.DestinationPort) === '3389');
      },
      description: 'Detecta conexiones de red establecidas hacia el servicio de Escritorio Remoto (RDP).'
    },
    {
      id: 'ps-encoded',
      type: 'PowerShell',
      name: 'PowerShell Encoded Command',
      category: 'Ejecución',
      severity: 'High',
      mitre: 'T1059.001 / T1027',
      indicator: 'EncodedCommand detectado',
      match: (e) => /( -e| -en| -ec| -enc| -enco| -encoded)/i.test(e.CommandLine || ''),
      description: 'Ejecución de PowerShell ofuscado u omitido mediante parámetros acortados.',
    },
    {
      id: 'ps-hidden',
      type: 'PowerShell',
      name: 'PowerShell Hidden Window',
      category: 'Ejecución',
      severity: 'Medium',
      mitre: 'T1059.001 / T1564',
      indicator: 'Ventana oculta',
      match: (e) => /hidden/i.test(e.CommandLine || ''),
      description: 'PowerShell ejecutado oculto.',
    },
    {
      id: 'ps-iex',
      type: 'PowerShell',
      name: 'PowerShell IEX Execution',
      category: 'Ejecución',
      severity: 'High',
      mitre: 'T1059.001 / T1105',
      indicator: 'IEX detectado',
      match: (e) => /invoke-expression|iex|downloadstring|downloadfile/i.test(e.CommandLine || ''),
      description: 'Posible descarga o ejecución remota.',
    },
    {
      id: 'temp-exec',
      type: 'File',
      name: 'Ejecución desde TEMP',
      category: 'Evasión',
      severity: 'High',
      mitre: 'T1059 / T1036',
      indicator: 'Ruta TEMP',
      match: (e) => {
        const imagePath = String(e.Image || '').toLowerCase();
        const commandLine = String(e.CommandLine || '').toLowerCase();
        const isSuspiciousPath = /\\\\temp\\\\|\\\\appdata\\\\|\\\\public\\\\/i.test(imagePath) || /\\\\temp\\\\|\\\\appdata\\\\|\\\\public\\\\/i.test(commandLine);
        const hasExecutableExtension = /(\\.exe|\\.bat|\\.ps1|\\.vbs|\\.msi)/i.test(imagePath) || /(\\.exe|\\.bat|\\.ps1|\\.vbs|\\.msi)/i.test(commandLine);
        return isSuspiciousPath && hasExecutableExtension;
      },
      description: 'Ejecución de archivos binarios o scripts desde rutas volátiles y sospechosas.',
    },
    {
      id: 'registry-persistence-run',
      type: 'Registry',
      name: 'Modificación de Clave de Persistencia Run / RunOnce',
      category: 'Persistencia',
      severity: 'High',
      mitre: 'T1547.001',
      indicator: 'Run/RunOnce modificado',
      match: (event) => {
        if (event.EventID !== '12' && event.EventID !== '13') return false;
        const target = String(event.TargetObject || event.raw?.TargetObject || '').toLowerCase();
        return target.includes('\\\\currentversion\\\\run') || target.includes('\\\\runonce');
      },
      description: 'Detecta la creación o modificación de valores en las claves Run de Windows usadas para persistencia de malware.'
    },
    {
      id: 'rdp-in',
      type: 'RDP',
      name: 'RDP Inbound Connection',
      category: 'Red',
      severity: 'Critical',
      mitre: 'T1021.001',
      indicator: 'Acceso remoto detectado',
      match: (e) => /mstsc|rdp/i.test(e.Image || ''),
      description: 'Conexión RDP entrante sospechosa.',
    },
    {
      id: 'runkey',
      type: 'Registry',
      name: 'Persistence Run Key',
      category: 'Persistencia',
      severity: 'High',
      mitre: 'T1547.001',
      indicator: 'Run/RunOnce modificado',
      match: (e) => /run\\\\|runonce/i.test(e.CommandLine || ''),
      description: 'Persistencia en registro.',
    },
    {
      id: 'registry-service-creation',
      type: 'Registry',
      name: 'Creación o Modificación de Servicio Windows',
      category: 'Persistencia',
      severity: 'High',
      mitre: 'T1543.003',
      indicator: 'Servicio modificado',
      match: (event) => {
        if (event.EventID !== '12' && event.EventID !== '13') return false;
        const target = String(event.TargetObject || event.raw?.TargetObject || '').toLowerCase();
        return target.includes('\\\\system\\\\currentcontrolset\\\\services\\\\');
      },
      description: 'Monitorea la adición de servicios del sistema en el registro para ejecuciones persistentes.'
    },
    {
      id: 'ps-burst',
      type: 'PowerShell',
      name: 'PowerShell Burst Activity',
      category: 'Comportamiento',
      severity: 'Medium',
      mitre: 'T1059',
      match: (e, context) => {
        if (!context?.events) return false;
        const count = context.events.filter(ev =>
          ev.Image?.toLowerCase().includes('powershell')
        ).length;
        return count >= 3;
      },
      description: 'Ejecuciones repetitivas de PowerShell.',
    },
  ];

  let customRules = [];

  function addCustomRule(rule) {
    customRules.push(rule);
    save();
  }

  function removeCustomRule(id) {
    customRules = customRules.filter(r => r.id !== id);
    save();
  }

  function save() {
    localStorage.setItem("customRules", JSON.stringify(customRules));
  }

  function load() {
    const data = JSON.parse(localStorage.getItem("customRules") || "[]");
    customRules = data;
  }

  function getAllRules() {
    return [...rules, ...customRules];
  }

  function getCategories() {
    return [...new Set(getAllRules().map(r => r.category))];
  }

  function evaluate(event) {
    return getAllRules()
      .filter(rule => {
        try {
          return rule.match(event);
        } catch {
          return false;
        }
      })
      .map(rule => ({
        ...rule,
        type: rule.type || 'Unknown'
      }));
  }

  load();

  return {
    getAllRules,
    getCategories,
    evaluate,
    addCustomRule,
    removeCustomRule
  };
})();