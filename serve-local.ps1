$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 8000)
$types = @{
  '.css' = 'text/css; charset=utf-8'
  '.html' = 'text/html; charset=utf-8'
  '.ico' = 'image/x-icon'
  '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png' = 'image/png'
  '.svg' = 'image/svg+xml'
  '.webmanifest' = 'application/manifest+json'
}

try {
  $listener.Start()
  Write-Host 'FreshTrack is running at http://127.0.0.1:8000'
  Write-Host 'Keep this PowerShell window open. Press Ctrl+C to stop.'

  while ($listener.Server.IsBound) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if (-not $requestLine) { continue }
      while (($header = $reader.ReadLine()) -ne '') { }

      $parts = $requestLine.Split(' ')
      $method = $parts[0]
      $requestPath = [Uri]::UnescapeDataString(($parts[1] -split '\?', 2)[0]).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath = 'index.html' }
      $file = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $requestPath))
      $rootPrefix = $root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

      if ($method -notin @('GET', 'HEAD')) {
        $status = '405 Method Not Allowed'
        $body = [System.Text.Encoding]::UTF8.GetBytes('Method not allowed')
        $contentType = 'text/plain; charset=utf-8'
      } elseif (-not $file.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        $status = '403 Forbidden'
        $body = [System.Text.Encoding]::UTF8.GetBytes('Forbidden')
        $contentType = 'text/plain; charset=utf-8'
      } elseif (-not [System.IO.File]::Exists($file)) {
        $status = '404 Not Found'
        $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
        $contentType = 'text/plain; charset=utf-8'
      } else {
        $status = '200 OK'
        $body = [System.IO.File]::ReadAllBytes($file)
        $extension = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
        $contentType = if ($types.ContainsKey($extension)) { $types[$extension] } else { 'application/octet-stream' }
      }

      $headOnly = $method -eq 'HEAD'
      $length = if ($headOnly) { 0 } else { $body.Length }
      $response = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($response)
      $stream.Write($headerBytes, 0, $headerBytes.Length)
      if (-not $headOnly -and $body.Length -gt 0) { $stream.Write($body, 0, $body.Length) }
      $stream.Flush()
    } finally {
      if ($client) { $client.Close() }
    }
  }
} finally {
  $listener.Stop()
}
