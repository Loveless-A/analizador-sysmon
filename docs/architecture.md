# Arquitectura del Analizador Sysmon

## Visión general

Este dashboard procesa un archivo JSON exportado desde Sysmon y aplica un motor de reglas en el navegador. La solución está diseñada sin frameworks, usando HTML5, CSS3 y JavaScript ES6.

## Componentes

- `index.html` - Interfaz de usuario principal con carga de archivos, dashboard, tabla y modal de eventos.
- `css/styles.css` - Estilos personalizados y código de colores para severidad.
- `js/parser.js` - Validación de JSON, lectura de archivo y normalización de eventos.
- `js/rules.js` - Reglas de detección basadas en patrones de Sysmon y técnicas MITRE.
- `js/alert-engine.js` - Motor que evalúa cada evento frente a las reglas y genera alertas.
- `js/ui-dashboard.js` - Renderiza métricas clave, gráficos y timeline usando Chart.js.
- `js/ui-alerts.js` - Renderiza la tabla de alertas, filtro, búsqueda y detalle individual.
- `js/exporter.js` - Exporta reportes y eventos individuales a JSON.
- `Export-SysmonEvents.ps1` - Script de PowerShell para exportar eventos de Sysmon a JSON.
- `evidencia-actividad.md` - Documento de evidencia de actividad y resultados.
- `sample-data/sample-events.json` - Ejemplo de eventos de Sysmon.
- `sysmon.json` - JSON para leer datos en la WEB

## Flujo de datos

1. El usuario carga un archivo JSON.
2. `parser.js` valida la estructura y devuelve la lista de eventos.
3. `alert-engine.js` aplica las reglas definidas en `rules.js`.
4. `ui-dashboard.js` calcula métricas y despliega gráficos.
5. `ui-alerts.js` muestra la lista de alertas y permite revisar detalles.
6. `exporter.js` permite guardar los resultados en un archivo descargable.

## Reglas de detección

- Eventos de proceso sospechosos (`cmd.exe`, `powershell.exe`) → severidad alta.
- EventID 1 con `cmd.exe` o `powershell.exe` → indicador de ejecución remota.
- EventID 5 con `PostgreSQL` o `git.exe` cuando se ejecuta por cuenta de servicio → severidad media.
- Uso de aplicaciones de sistema como `ctfmon.exe`, `consent.exe` o `SearchFilterHost.exe` se marca como bajo.

## Deploy local

Servir el contenido estático con:

```bash
python -m http.server 8000
```

Abrir `http://localhost:8000` y cargar el archivo JSON.
