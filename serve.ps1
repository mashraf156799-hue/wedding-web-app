$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:8088/")
$listener.Start()
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "  Server running at http://localhost:8088/" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $path = $req.Url.LocalPath

    # CORS headers
    $res.Headers.Add("Access-Control-Allow-Origin", "*")
    $res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

    if ($req.HttpMethod -eq "OPTIONS") {
        $res.StatusCode = 204
        $res.Close()
        continue
    }

    # === POST API ENDPOINTS ===
    if ($req.HttpMethod -eq "POST") {
        try {
            if ($path -eq "/api/save-config") {
                $reader = [System.IO.StreamReader]::new($req.InputStream)
                $body = $reader.ReadToEnd()
                $reader.Close()
                $configPath = Join-Path $root "config.json"
                [System.IO.File]::WriteAllText($configPath, $body, [System.Text.Encoding]::UTF8)
                $msg = [System.Text.Encoding]::UTF8.GetBytes('{"status":"ok"}')
                $res.ContentType = "application/json"
                $res.ContentLength64 = $msg.Length
                $res.OutputStream.Write($msg, 0, $msg.Length)
                Write-Host "200 POST $path (config saved)" -ForegroundColor Green
            }
            elseif ($path -match "^/api/save-image/(.+)$") {
                $fileName = $Matches[1]
                $savePath = Join-Path $root "assets\images\$fileName"
                $fs = [System.IO.File]::Create($savePath)
                $req.InputStream.CopyTo($fs)
                $fs.Close()
                $msg = [System.Text.Encoding]::UTF8.GetBytes('{"status":"ok","path":"assets/images/' + $fileName + '"}')
                $res.ContentType = "application/json"
                $res.ContentLength64 = $msg.Length
                $res.OutputStream.Write($msg, 0, $msg.Length)
                Write-Host "200 POST $path (image saved)" -ForegroundColor Green
            }
            elseif ($path -match "^/api/save-music/(.+)$") {
                $fileName = $Matches[1]
                $savePath = Join-Path $root "assets\music\$fileName"
                $fs = [System.IO.File]::Create($savePath)
                $req.InputStream.CopyTo($fs)
                $fs.Close()
                $msg = [System.Text.Encoding]::UTF8.GetBytes('{"status":"ok","path":"assets/music/' + $fileName + '"}')
                $res.ContentType = "application/json"
                $res.ContentLength64 = $msg.Length
                $res.OutputStream.Write($msg, 0, $msg.Length)
                Write-Host "200 POST $path (music saved)" -ForegroundColor Green
            }
            else {
                $res.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Unknown API endpoint"}')
                $res.ContentType = "application/json"
                $res.OutputStream.Write($msg, 0, $msg.Length)
                Write-Host "404 POST $path" -ForegroundColor Red
            }
        } catch {
            $res.StatusCode = 500
            $errMsg = [System.Text.Encoding]::UTF8.GetBytes('{"error":"' + $_.Exception.Message + '"}')
            $res.ContentType = "application/json"
            $res.OutputStream.Write($errMsg, 0, $errMsg.Length)
            Write-Host "500 POST $path - $($_.Exception.Message)" -ForegroundColor Red
        }
        $res.Close()
        continue
    }

    # === GET (Static File Serving) ===
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root ($path.TrimStart("/"))

    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file).ToLower()
        $mime = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css; charset=utf-8" }
            ".js"   { "application/javascript; charset=utf-8" }
            ".jpg"  { "image/jpeg" }
            ".jpeg" { "image/jpeg" }
            ".png"  { "image/png" }
            ".gif"  { "image/gif" }
            ".svg"  { "image/svg+xml" }
            ".mp3"  { "audio/mpeg" }
            ".mp4"  { "video/mp4" }
            ".webp" { "image/webp" }
            ".woff" { "font/woff" }
            ".woff2"{ "font/woff2" }
            ".json" { "application/json; charset=utf-8" }
            default { "application/octet-stream" }
        }
        $res.ContentType = $mime
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        Write-Host "200 $path" -ForegroundColor Green
    } else {
        $res.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $res.OutputStream.Write($msg, 0, $msg.Length)
        Write-Host "404 $path" -ForegroundColor Red
    }
    $res.Close()
}
