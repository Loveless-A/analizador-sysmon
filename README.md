# Analizador Sysmon

Proyecto de dashboard para cargar logs de Sysmon en JSON y analizar alertas con reglas de detección.

## Estructura

- `index.html` - Página principal.
- `css/styles.css` - Estilos personalizados.
- `js/app.js` - Lógica de carga y control de la UI.
- `js/parser.js` - Lectura y validación del JSON.
- `js/rules.js` - Definición de reglas de detección.
- `js/alert-engine.js` - Motor que aplica las reglas y produce alertas.
- `js/ui-dashboard.js` - Render del dashboard y gráficos.
- `js/ui-alerts.js` - Render de la tabla de alertas y detalles.
- `js/exporter.js` - Exportación de datos a JSON.
- `Export-SysmonEvents.ps1` - Script de PowerShell para exportar eventos de Sysmon a JSON.
- `evidencia-actividad.md` - Documento de evidencia de actividad y resultados.
- `sample-data/sample-events.json` - Ejemplo de eventos de Sysmon.
- `docs/architecture.md` - Documento de arquitectura.

## Uso

1. Abrir una terminal y cambiar al directorio del proyecto:
   - `cd c:\analizador-sysmon`
2. Iniciar un servidor local:
   - `python -m http.server 8000`
   - o `npx http-server . 8000`
3. Abrir el navegador en:
   - `http://localhost:8000`
4. En la web, hacer clic en el botón `Seleccionar archivo` o arrastrar el archivo JSON dentro del área.
5. Seleccionar un JSON válido de Sysmon, por ejemplo `sample-data/sample-events.json`.
6. Esperar el mensaje `Archivo cargado con éxito` y revisar el dashboard.

## Uso de PowerShell para exportar eventos

- Abrir PowerShell en `c:\analizador-sysmon`.
- Ejecutar `.
Export-SysmonEvents.ps1 -OutputPath sample-data\sysmon-events.json` para exportar eventos a JSON.
- Opcionalmente usar `-StartTime` y `-EndTime` para filtrar por rango de fechas.

## Qué hacer si da error

- Asegúrate de ejecutar el servidor desde `c:\analizador-sysmon`.
- Si tu archivo está en `c:\sample-events.json`, cópialo a `analizador-sysmon\sample-data\sample-events.json` antes de cargarlo.
- El JSON debe ser un arreglo (`[...]`) de eventos con `EventID` y `TimeCreated` o `UtcTime`.
- Si aparece mensaje de error, revisa el archivo JSON en un editor y confirma que no hay comillas mal formadas.

## Escenario

- El endpoint Windows está configurado con Sysmon usando una configuración personalizada.
- El analista descarga periódicamente el log en formato JSON.
- Sube el archivo al sitio web.
- El sitio procesa el JSON, evalúa reglas y genera alertas por severidad.
- El analista revisa, prioriza y exporta el reporte.
