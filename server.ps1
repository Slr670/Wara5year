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
                    $vCards = ""
                    $vIdx = 1
                    foreach ($v in $villages) {
                        $vId = if ($v.id) { $v.id } else { $vIdx }
                        $vRem = if ($v.remaining) { $v.remaining } elseif ($v.term) { $v.term } else { "0 ปี 1 เดือน" }
                        $vRawPhone = if ($v.phone) { $v.phone.ToString().Trim() } else { "" }
                        $vCleanPhone = if ($vRawPhone) { ($vRawPhone.Split(',')[0]).Trim() -replace '\s+', '' } else { "" }
                        $vLocSub = if ($v.subdistrict) { "ต.$($v.subdistrict) " } else { "" }
                        $vLocDist = if ($v.district) { "อ.$($v.district) " } else { "" }
                        $vLocProv = "<b>จ.$($v.province)</b>"

                        $vBadges += "<span style='display:inline-block; background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; font-size:12px; font-weight:bold; padding:4px 10px; border-radius:6px; margin:2px 4px 2px 0; white-space:nowrap;'>[Location] " + $v.village + " (" + $v.province + ")</span>"
                        
                        $vHtml += @"
<tr style='border-bottom: 1px solid #e2e8f0;'>
  <td style='padding: 12px 8px; font-size: 13px; font-weight: 700; color: #1e293b; text-align: center; white-space: nowrap;'>$vId</td>
  <td style='padding: 12px 10px;'>
    <div style='font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.35;'>$($v.village)</div>
    <div style='font-size: 12px; color: #475569; margin-top: 3px; line-height: 1.35;'>$vLocSub$vLocDist$vLocProv</div>
  </td>
  <td style='padding: 12px 8px; text-align: center; white-space: nowrap;'>
    <span style='display: inline-block; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; line-height: 1.2;'>$vRem</span>
  </td>
  <td style='padding: 12px 8px; font-size: 12px; text-align: center; white-space: nowrap;'>
    $(if ($vRawPhone) { "<a href='tel:$vCleanPhone' style='color:#2563eb; text-decoration:none; font-weight:700; white-space:nowrap; display:inline-block;'>$vRawPhone</a>" } else { "<span style='color:#94a3b8;'>-</span>" })
  </td>
</tr>
"@

                        $vCards += @"
<table role='presentation' class='mobile-card' style='display: none; width: 100%; border-collapse: separate; border-spacing: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); overflow: hidden;'>
  <tr>
    <td style='padding: 14px 16px;'>
      <table role='presentation' style='width: 100%; border-collapse: collapse; margin-bottom: 8px;'>
        <tr>
          <td style='text-align: left; vertical-align: middle;'>
            <span style='display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: nowrap;'>ลำดับ TOR #$vId</span>
          </td>
          <td style='text-align: right; vertical-align: middle;'>
            <span style='display: inline-block; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; line-height: 1.2;'>วาระคงเหลือ: $vRem</span>
          </td>
        </tr>
      </table>
      <div style='font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.35; margin-bottom: 4px;'>$($v.village)</div>
      <div style='font-size: 13px; color: #475569; line-height: 1.4; margin-bottom: 10px;'>$vLocSub$vLocDist$vLocProv</div>
      $(if ($vRawPhone) { "<a href='tel:$vCleanPhone' style='display:block; background:#f8fafc; color:#2563eb; border:1px solid #cbd5e1; font-size:12px; font-weight:700; padding:9px 10px; border-radius:6px; text-decoration:none; text-align:center; white-space:nowrap;'>📞 $vRawPhone</a>" } else { "<div style='display:block; background:#f8fafc; color:#94a3b8; border:1px solid #f1f5f9; font-size:12px; padding:9px 10px; border-radius:6px; text-align:center; white-space:nowrap;'>ไม่มีเบอร์ติดต่อ</div>" })
    </td>
  </tr>
</table>
"@
                        $vIdx++
                    }

                    $mail.Body = @"
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>USO PROJECT ALERT</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 0 !important; }
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .email-header { padding: 20px 16px !important; }
      .email-header h2 { font-size: 19px !important; }
      .email-body { padding: 20px 16px !important; }
      .desktop-table-wrap { display: none !important; max-height: 0 !important; overflow: hidden !important; mso-hide: all !important; font-size: 0 !important; line-height: 0 !important; }
      .mobile-cards-wrap { display: block !important; max-height: none !important; overflow: visible !important; font-size: 14px !important; line-height: 1.5 !important; margin: 16px 0 !important; }
      .mobile-card { display: table !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div class="email-wrapper" style="background-color: #f1f5f9; padding: 24px 12px;">
    <div class="email-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; width: 100%; margin: 0 auto; background: #ffffff; border: 1px solid #fca5a5; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
      <div class="email-header" style="background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); color: #fff; padding: 22px 26px;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fecaca; margin-bottom: 6px;">USO PROJECT ALERT • VERIFICATION REQUIRED</div>
        <h2 style="margin: 0; font-size: 20px; line-height: 1.3;">แจ้งเตือนวาระเจ้าหน้าที่รัฐ (USO Project Team)</h2>
        <p style="margin: 4px 0 0; font-size: 13.5px; color: #fee2e2;">วาระการดำรงตำแหน่งของเจ้าหน้าที่รัฐในพื้นที่รับผิดชอบใกล้หมดอายุลง (0 ปี 1 เดือน) จำนวน $cnt หมู่บ้าน</p>
      </div>
      <div class="email-body" style="padding: 24px 26px; color: #334155; font-size: 14px; line-height: 1.6;">
        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
          <b style="color: #9f1239; font-size: 13px;">หมู่บ้านที่ต้องตรวจสอบ:</b><br>
          <div style="margin-top: 6px;">$vBadges</div>
        </div>
        <div class="desktop-table-wrap" style="display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 18px 0; border: 1px solid #cbd5e1; border-radius: 8px;">
          <table style="width: 100%; min-width: 520px; border-collapse: collapse;">
            <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 12px; color: #475569;">
              <th style="padding: 10px; text-align: center; width: 65px; white-space: nowrap;">ID</th>
              <th style="padding: 10px; min-width: 160px;">หมู่บ้าน / ที่ตั้ง</th>
              <th style="padding: 10px; text-align: center; width: 115px; white-space: nowrap;">วาระคงเหลือ</th>
              <th style="padding: 10px; text-align: center; width: 120px; white-space: nowrap;">เบอร์ติดต่อ</th>
            </tr>
            $vHtml
          </table>
        </div>
        <div class="mobile-cards-wrap" style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 0; line-height: 0;">
          $vCards
        </div>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-top: 16px;">
          <b style="color: #1e40af; font-size: 13px;">สิ่งที่ต้องดำเนินการ:</b><br>
          <span style="font-size: 13px; color: #1e3a8a;">โปรดตรวจสอบสถานะการดำรงตำแหน่งปัจจุบัน และประสานงานผู้นำชุมชนในพื้นที่ดังกล่าว</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; margin-bottom: 0;">Automated notification from Wara Dashboard at $nowStr</p>
      </div>
    </div>
  </div>
</body>
</html>
"@
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
