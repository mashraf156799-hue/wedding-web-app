$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:8088/")
$listener.Start()
Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "  Server running at http://localhost:8088/" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

$root = "C:\Users\alaa2025\.gemini\antigravity\scratch\egyptian-wedding"

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath
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
            ".json" { "application/json" }
            default { "application/octet-stream" }
        }
        $ctx.Response.ContentType = $mime
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        Write-Host "200 $path" -ForegroundColor Green
    } else {
        $ctx.Response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
        Write-Host "404 $path" -ForegroundColor Red
    }
    $ctx.Response.Close()
}
