const Parser = (() => {
  function normalizeEvent(event) {
    return {
      EventID: String(event.EventID || event.EventID === 0 ? event.EventID : 'Unknown'),
      TimeCreated: event.TimeCreated || event.UtcTime || '',
      UtcTime: event.UtcTime || event.TimeCreated || '',
      Image: event.Image || event.ParentImage || 'Unknown',
      User: event.User || event.ParentUser || 'Unknown',
      CommandLine: event.CommandLine || '',
      ProcessId: event.ProcessId || '',
      RuleName: event.RuleName || '-',
      raw: event,
    };
  }

  function validate(data) {
    if (!Array.isArray(data)) {
      throw new Error('El JSON debe ser un arreglo de eventos.');
    }
    return data.map((event, index) => {
      if (!event.EventID) {
        throw new Error(`Evento ${index + 1}: falta EventID.`);
      }
      if (!event.TimeCreated && !event.UtcTime) {
        throw new Error(`Evento ${index + 1}: falta TimeCreated o UtcTime.`);
      }
      return normalizeEvent(event);
    });
  }

  function parseText(text) {
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      throw new Error('JSON inválido: ' + err.message);
    }
    return validate(json);
  }

  function parseFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const events = parseText(reader.result);
          resolve(events);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.onprogress = (evt) => {
        if (evt.lengthComputable && typeof onProgress === 'function') {
          onProgress(evt.loaded / evt.total);
        }
      };
      reader.readAsText(file, 'UTF-8');
    });
  }

  return {
    parseFile,
  };
})();
