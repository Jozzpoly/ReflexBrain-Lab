param(
  [ValidateRange(1024,65535)][int]$Port = 8765,
  [switch]$NoBrowser
)
# Self-contained read-only R8 local preview (Windows PowerShell 5.1+).
# 127.0.0.1 TcpListener: no public exposure, no HTTP.sys URL ACL required.
$ErrorActionPreference = 'Stop'
$dist = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'dist'))
if (-not (Test-Path (Join-Path $dist 'probes\material-workbench-r8.html'))) {
  throw 'Brakuje dist/probes/material-workbench-r8.html. Wypakuj cala paczke ZIP.'
}
$prefix = $dist.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$mime = @{
  '.html'='text/html; charset=utf-8'
  '.js'='text/javascript; charset=utf-8'
  '.css'='text/css; charset=utf-8'
  '.json'='application/json; charset=utf-8'
  '.wasm'='application/wasm'
  '.png'='image/png'
  '.jpg'='image/jpeg'
  '.jpeg'='image/jpeg'
  '.svg'='image/svg+xml'
  '.webp'='image/webp'
  '.woff2'='font/woff2'
  '.ico'='image/x-icon'
}
function Write-HttpResponse {
  param([System.IO.Stream]$Stream,[int]$Status,[string]$ContentType,[byte[]]$Content,[bool]$HeadOnly)
  $reason = if ($Status -eq 200) { 'OK' } elseif ($Status -eq 405) { 'Method Not Allowed' } else { 'Not Found' }
  $nl = [string][char]13 + [string][char]10
  $header = "HTTP/1.1 $Status $reason" + $nl +
    "Content-Type: $ContentType" + $nl +
    "Content-Length: $($Content.Length)" + $nl +
    "Cache-Control: no-store" + $nl +
    "X-Content-Type-Options: nosniff" + $nl +
    "Connection: close" + $nl + $nl
  $bytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($bytes,0,$bytes.Length)
  if (-not $HeadOnly) { $Stream.Write($Content,0,$Content.Length) }
  $Stream.Flush()
}
try {
  $listener.Start()
  $url = "http://127.0.0.1:$Port/probes/material-workbench-r8.html"
  Write-Host 'ReflexBrain R8 — lokalny warsztat materialny (wersja badawcza)' -ForegroundColor Cyan
  Write-Host "Adres: $url"
  Write-Host 'Dostep tylko z tego komputera. Zamknij okno, aby zatrzymac.'
  if (-not $NoBrowser) { Start-Process $url }
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 10000
      $client.SendTimeout = 10000
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream,[System.Text.Encoding]::ASCII,$false,1024,$true)
      $line = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($line)) { continue }
      while ($true) {
        $h = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($h)) { break }
      }
      $parts = $line.Split(' ')
      if ($parts.Count -lt 2) { continue }
      $head = $parts[0] -eq 'HEAD'
      if ($parts[0] -ne 'GET' -and -not $head) {
        Write-HttpResponse -Stream $stream -Status 405 -ContentType 'text/plain' -Content ([Text.Encoding]::UTF8.GetBytes('GET/HEAD only')) -HeadOnly $false
        continue
      }
      $target = $parts[1].Split('?')[0]
      $rel = [System.Uri]::UnescapeDataString($target).TrimStart('/').Replace('/',[System.IO.Path]::DirectorySeparatorChar)
      if ([string]::IsNullOrEmpty($rel)) { $rel = 'index.html' }
      $full = [System.IO.Path]::GetFullPath((Join-Path $dist $rel))
      if (-not $full.StartsWith($prefix,[System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $full -PathType Leaf)) {
        Write-HttpResponse -Stream $stream -Status 404 -ContentType 'text/plain' -Content ([Text.Encoding]::UTF8.GetBytes('Not Found')) -HeadOnly $head
        continue
      }
      $extension = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $type = if ($mime.ContainsKey($extension)) { $mime[$extension] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      Write-HttpResponse -Stream $stream -Status 200 -ContentType $type -Content $bytes -HeadOnly $head
    } catch {
      Write-Warning "Local HTTP request failed: $($_.Exception.Message)"
    } finally {
      if ($client) { $client.Close() }
    }
  }
} finally {
  $listener.Stop()
}
