param(
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "sysmon-events.json",

    [Parameter(Mandatory = $false)]
    [datetime]$StartTime,

    [Parameter(Mandatory = $false)]
    [datetime]$EndTime
)

$logName = 'Microsoft-Windows-Sysmon/Operational'

Write-Host "Obteniendo eventos de Sysmon desde '$logName'..."

$query = @{}
if ($StartTime) { $query.StartTime = $StartTime }
if ($EndTime) { $query.EndTime = $EndTime }

try {
    $events = Get-WinEvent -LogName $logName @query | ForEach-Object {
        $xml = [xml]$_.ToXml()
        $eventData = @{
            TimeCreated = $_.TimeCreated.ToString('o')
            Id = $_.Id
            LevelDisplayName = $_.LevelDisplayName
            ProviderName = $_.ProviderName
            Message = $_.Message
            EventData = @{}
        }

        foreach ($data in $xml.Event.EventData.Data) {
            $name = if ($data.Name) { $data.Name } else { "Data$([guid]::NewGuid().ToString('N').Substring(0,8))" }
            $eventData.EventData[$name] = $data.'#text'
        }

        [PSCustomObject]$eventData
    }

    $events | ConvertTo-Json -Depth 6 | Set-Content -Path $OutputPath -Encoding utf8
    Write-Host "Exportación completada: $OutputPath"
    Write-Host "Total de eventos exportados: $($events.Count)"
}
catch {
    Write-Error "Error al exportar eventos de Sysmon: $_"
}
