# Evidencia de Actividad

## Resumen

Documento de evidencia para el proyecto Analizador Sysmon. Aquí se registran los pasos realizados, las pruebas ejecutadas y los resultados obtenidos.

## Pasos realizados

1. Se creó el script `Export-SysmonEvents.ps1` para exportar eventos de Sysmon a JSON.
2. Se agregó el archivo `evidencia-actividad.md` al repositorio.
3. Se actualizó `README.md` para incluir referencias a los nuevos archivos.

## Pruebas realizadas

- Ejecución de `Export-SysmonEvents.ps1` para generar un archivo JSON.
- Verificación de que el JSON exportado contiene eventos con los campos mínimos requeridos.
- Carga del JSON en el dashboard para confirmar que el importador y las reglas funcionan.

## Pasos de Configuración y Despliegue
1. **Despliegue del sensor:** Se instaló la configuración `sysmonconfig-custom.xml` utilizando el comando `sysmon64.exe -c sysmonconfig-custom.xml`, verificando la actualización exitosa de las políticas en el kernel.
2. **Automatización:** Se configuró el script `Export-SysmonEvents.ps1` para la transformación de logs crudos (`.xml`) a un esquema estructurado (`.json`), permitiendo la persistencia de datos para el análisis forense fuera de línea.
3. **Versión de control:** El proyecto ha sido gestionado bajo control de versiones, documentando los cambios en los archivos de la interfaz y lógica de detección.

## Pruebas de Ataque (Simulaciones Controladas)
Para validar la detección, se ejecutaron los siguientes vectores de ataque en entorno local con privilegios de administrador:

* **Vector PowerShell:** Ejecución mediante:
  ```powershell
  # powershell.exe -WindowStyle Hidden -Command "Get-Process"
* **Vector Persistencia (Registro):** Modificación de llaves de registro mediante:

New-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "TestSysmon" -Value "calc.exe" -Force
Remove-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "TestSysmon"

* **Vector Red (RDP):** Intento de sondeo al puerto 3389:

Test-NetConnection -ComputerName 127.0.0.1 -Port 3389

## Resultados

- Exportación: El script `Export-SysmonEvents.ps1` generó con éxito el archivo sample-events.json con más de 200 eventos, asegurando la muestra necesaria para el análisis.
- Detección: Al cargar el archivo en el dashboard web, el motor de reglas de JavaScript identificó las alertas correspondientes a las pruebas ejecutadas, clasificando correctamente la severidad de los eventos.
- Integridad: Se confirma la trazabilidad de los datos desde el Visor de Eventos hasta la interfaz de usuario final.
- La evidencia de actividad queda registrada en este documento: reporte-final.pdf.

## Observaciones

- Si se requiere un filtro temporal específico, usar los parámetros `-StartTime` y `-EndTime` del script.
- Para auditoría, conservar tanto el JSON exportado como los logs de ejecución.
