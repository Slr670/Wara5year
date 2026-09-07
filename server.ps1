param(
    [int]$Port = 3001
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
    Write-Host "=================================================="
    Write-Host " [Wara-Dashboard Backend Server Started]"
    Write-Host " Local URL: http://127.0.0.1:$Port/"
    Write-Host " Endpoints: /api/verify-password, /api/send-email"
    Write-Host "=================================================="
} catch {
    Write-Error "Failed to start server on port $Port : $_"
    exit 1
}

$SERVER_SECRET_PASSWORD = "258025"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $urlPath = $request.Url.AbsolutePath

        # Secure Password Check Endpoint
        if ($urlPath -eq "/api/verify-password" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()

            $json = $null
            try { $json = $body | ConvertFrom-Json } catch {}

            $inputPassword = if ($json -and $json.password) { $json.password.ToString().Trim() } else { "" }
            $response.ContentType = "application/json; charset=utf-8"

            if ($inputPassword -eq $SERVER_SECRET_PASSWORD) {
                $token = [System.Guid]::NewGuid().ToString()
                $resObj = @{ success = $true; message = "Password verified"; token = $token }
                $response.StatusCode = 200
            } else {
                $resObj = @{ success = $false; message = "Invalid password" }
                $response.StatusCode = 401
            }

            $resJson = $resObj | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($resJson)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # Health Check
        if ($urlPath -eq "/api/health") {
            $response.ContentType = "application/json; charset=utf-8"
            $resJson = '{"status":"ok","time":"' + (Get-Date -Format s) + '"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($resJson)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # Send Email Alert Endpoint (Gmail SMTP)
        if (($urlPath -eq "/api/send-email" -or $urlPath -eq "/api/send-alert") -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()

            $json = $null
            try { $json = $body | ConvertFrom-Json } catch {}

            $toEmail = if ($json -and $json.to) { $json.to.ToString().Trim() } else { "wara.noreply.app@gmail.com" }
            $isTest = if ($json -and $json.isTest) { $true } else { $false }
            $villages = if ($json -and $json.villages) { $json.villages } else { @() }

            # Load .env if present
            $envPath = Join-Path $PSScriptRoot ".env"
            if (Test-Path $envPath) {
                Get-Content $envPath | ForEach-Object {
                    $line = $_.Trim()
                    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
                        $parts = $line.Split("=", 2)
                        [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
                    }
                }
            }

            $smtpServer = if ($env:SMTP_HOST) { $env:SMTP_HOST } else { "smtp.gmail.com" }
            $smtpPort = if ($env:SMTP_PORT) { [int]$env:SMTP_PORT } else { 587 }
            $smtpUser = if ($env:SMTP_USER) { $env:SMTP_USER } else { "wara.noreply.app@gmail.com" }
            $smtpPass = if ($env:SMTP_PASS) { $env:SMTP_PASS } else { "" }
            $fromName = if ($env:EMAIL_FROM_NAME) { $env:EMAIL_FROM_NAME } else { "wara noreply" }

            $response.ContentType = "application/json; charset=utf-8"

            try {
                $mail = New-Object System.Net.Mail.MailMessage
                $mail.From = New-Object System.Net.Mail.MailAddress($smtpUser, $fromName)
                $mail.To.Add($toEmail)
                $mail.IsBodyHtml = $true

                $nowStr = (Get-Date).ToString("dd/MM/yyyy HH:mm:ss")

                if ($isTest) {
                    $mail.Subject = "[USO Project Team] Test Email Alert Verification • Wara Dashboard"
                    $mail.Body = "<div style='font-family:sans-serif; max-width:640px; padding:24px; border:1px solid #cbd5e1; border-radius:12px;'><h2 style='color:#1e3a8a; margin-top:0;'>To: USO Project Team</h2><p>Automated tenure expiration alert system successfully connected to Gmail SMTP ($smtpServer).</p><p><b>Recipient:</b> $toEmail<br><b>Sender:</b> $smtpUser<br><b>Time:</b> $nowStr</p></div>"
                } else {
                    $cnt = $villages.Count
                    $mail.Subject = "Alert: Local government officer terms expiring in USO areas ($cnt villages need verification)"
                    $vBadges = ""
                    $vHtml = ""
                    foreach ($v in $villages) {
                        $vBadges += "<span style='display:inline-block; background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; font-size:12px; font-weight:bold; padding:3px 8px; border-radius:6px; margin:2px 4px 2px 0;'>[Location] " + $v.village + " (" + $v.province + ")</span>"
                        $vHtml += "<tr><td style='padding:8px; border-bottom:1px solid #ddd; text-align:center;'>" + $v.id + "</td><td style='padding:8px; border-bottom:1px solid #ddd;'><b>" + $v.village + "</b><br><span style='font-size:12px; color:#555;'>ต." + $v.subdistrict + " อ." + $v.district + " จ." + $v.province + "</span></td><td style='padding:8px; border-bottom:1px solid #ddd; color:#dc2626; font-weight:bold; text-align:center;'>" + $v.remaining + "</td><td style='padding:8px; border-bottom:1px solid #ddd; text-align:center;'>" + $v.phone + "</td></tr>"
                    }
                    $mail.Body = "<div style='font-family:sans-serif; max-width:680px; padding:24px; border:1px solid #fca5a5; border-radius:12px;'><div style='background:#dc2626; color:#fff; padding:16px 20px; border-radius:8px;'><h2 style='margin:0;'>To: USO Project Team</h2><p style='margin:4px 0 0; font-size:14px;'>Alert: Local government officer terms in your assigned areas are approaching expiration (0 years 1 month) and require verification.</p></div><div style='background:#fff1f2; border:1px solid #fecdd3; border-radius:8px; padding:12px; margin:16px 0;'><b style='color:#9f1239;'>Villages requiring verification:</b><br>" + $vBadges + "</div><table style='width:100%; border-collapse:collapse; margin-top:12px;'><tr style='background:#f1f5f9;'><th>ID</th><th>Village / Location</th><th>Tenure</th><th>Phone</th></tr>" + $vHtml + "</table><div style='background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px; margin-top:16px;'><b style='color:#1e40af;'>Action required for USO Project Team:</b><br><span style='font-size:13px; color:#1e3a8a;'>Please verify the current officer status and coordinate with local community leaders in these villages.</span></div><p style='color:#888; font-size:12px; margin-top:16px;'>Automated notification from Wara Dashboard at " + $nowStr + "</p></div>"
                }

                $smtp = New-Object System.Net.Mail.SmtpClient($smtpServer, $smtpPort)
                $smtp.EnableSsl = $true
                $smtp.Credentials = New-Object System.Net.NetworkCredential($smtpUser, $smtpPass)
                $smtp.Send($mail)

                $resObj = @{
                    success = $true
                    message = "Email sent successfully"
                    destination = $toEmail
                    villagesCount = $villages.Count
                    timestamp = $nowStr
                }
                $response.StatusCode = 200
            } catch {
                $resObj = @{
                    success = $false
                    message = "Failed to send email: " + $_.Exception.Message
                }
                $response.StatusCode = 500
            }

            $resJson = $resObj | ConvertTo-Json
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($resJson)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # Scheduled Monthly Alert Cron Endpoint
        if ($urlPath -eq "/api/monthly-alert-cron" -or $urlPath -eq "/api/run-monthly-alert") {
            $runnerPath = Join-Path $PSScriptRoot "run_monthly_alert.ps1"
            $toEmail = "wara.noreply.app@gmail.com"
            if ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                try {
                    $jsonBody = $body | ConvertFrom-Json
                    if ($jsonBody -and $jsonBody.to) { $toEmail = $jsonBody.to.ToString().Trim() }
                } catch {}
            }

            try {
                & $runnerPath -DestinationEmail $toEmail
                $resObj = @{
                    success = $true
                    message = "Monthly alert cron executed successfully"
                    destination = $toEmail
                    timestamp = (Get-Date -Format s)
                }
                $response.StatusCode = 200
            } catch {
                $resObj = @{
                    success = $false
                    message = "Failed to run monthly alert: $_"
                }
                $response.StatusCode = 500
            }

            $response.ContentType = "application/json; charset=utf-8"
            $resJson = $resObj | ConvertTo-Json -Compress
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($resJson)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # Static File Serving
        $rawPath = [System.Uri]::UnescapeDataString($urlPath)
        $filePath = if ($rawPath -eq "/" -or $rawPath -eq "") { "index.html" } else { $rawPath.TrimStart('/') }
        $fullPath = Join-Path $PSScriptRoot $filePath

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".csv"  { "text/csv; charset=utf-8" }
                ".png"  { "image/png" }
                ".svg"  { "image/svg+xml" }
                ".ttf"  { "font/ttf" }
                ".woff" { "font/woff" }
                ".woff2"{ "font/woff2" }
                default { "application/octet-stream" }
            }
            $response.ContentType = $contentType
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
        }

        $response.Close()
    } catch {
        Write-Error "Request handling error: $_"
    }
}
