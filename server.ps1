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

            $customSmtp = $payload.customSmtp
            $smtpServer = if ($customSmtp -and $customSmtp.smtp_host) { $customSmtp.smtp_host.ToString().Trim() } elseif ($env:SMTP_HOST) { $env:SMTP_HOST } else { "smtp.gmail.com" }
            $smtpPort = if ($customSmtp -and $customSmtp.smtp_port) { [int]$customSmtp.smtp_port } elseif ($env:SMTP_PORT) { [int]$env:SMTP_PORT } else { 587 }
            $smtpUser = if ($customSmtp -and $customSmtp.smtp_user) { $customSmtp.smtp_user.ToString().Trim() } elseif ($env:SMTP_USER) { $env:SMTP_USER } else { "wara.noreply.app@gmail.com" }
            $smtpPass = if ($customSmtp -and $customSmtp.smtp_pw) { $customSmtp.smtp_pw.ToString().Trim() } elseif ($env:SMTP_PASS) { $env:SMTP_PASS } else { "" }
            $fromName = if ($customSmtp -and $customSmtp.sender_name) { $customSmtp.sender_name.ToString().Trim() } elseif ($env:EMAIL_FROM_NAME) { $env:EMAIL_FROM_NAME } else { "wara noreply" }

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
                    $vIdx = 1
                    foreach ($v in $villages) {
                        $vId = if ($v.id) { $v.id } else { $vIdx }
                        $vRem = if ($v.remaining) { $v.remaining } elseif ($v.term) { $v.term } else { "0 ปี 1 เดือน" }
                        $vHeight = if ($v.towerHeight) { "$($v.towerHeight) ม." } elseif ($v.height) { "$($v.height) ม." } else { "9 ม." }
                        $vTypeText = if ($v.typicalType) { "<div style='font-size: 10.5px; color: #4338ca; margin-top: 3px; font-weight: 600; white-space: nowrap;'>$($v.typicalType)</div>" } else { "" }
                        $vRawPhone = if ($v.phone) { $v.phone.ToString().Trim() } else { "" }
                        $vCleanPhone = if ($vRawPhone) { ($vRawPhone.Split(',')[0]).Trim() -replace '\s+', '' } else { "" }
                        $vHasCoords = ($v.lat -and $v.lng)
                        $vMapsUrl = if ($vHasCoords) { "https://www.google.com/maps?q=$($v.lat),$($v.lng)" } else { "" }
                        $vMapsBtn = if ($vHasCoords) { "<a href='$vMapsUrl' target='_blank' rel='noopener noreferrer' class='action-btn action-map x_action-btn x_action-map' style='display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11.5px; font-weight: 700; padding: 6px 9px; border-radius: 6px; text-decoration: none; white-space: nowrap;'>Google Maps ↗</a>" } else { "<span style='color: #94a3b8; font-size: 11.5px;'>-</span>" }
                        $vPhoneBtn = if ($vRawPhone) { "<a href='tel:$vCleanPhone' class='action-btn action-phone x_action-btn x_action-phone' style='display: inline-block; background-color: #f8fafc; color: #2563eb; border: 1px solid #cbd5e1; font-size: 11.5px; font-weight: 700; padding: 6px 9px; border-radius: 6px; text-decoration: none; white-space: nowrap;'>โทร: $vCleanPhone</a>" } else { "<span style='color: #94a3b8; font-size: 11.5px;'>-</span>" }

                        $vLocSub = if ($v.subdistrict) { "ต.$($v.subdistrict) " } else { "" }
                        $vLocDist = if ($v.district) { "อ.$($v.district) " } else { "" }
                        $vLocProv = "<b>จ.$($v.province)</b>"

                        $vBadges += "<span style='display: inline-block; background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; margin: 3px 4px 3px 0; white-space: nowrap;'><span style='color:#b91c1c; font-weight:800; margin-right:3px;'>•</span> " + $v.village + " (จ." + $v.province + ")</span>"
                        
                        $vHtml += @"
<tr class="village-card-row x_village-card-row" style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
  <td class="card-cell cell-tor x_card-cell x_cell-tor" width="65" style="width: 65px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #475569;">
    <span class="badge-tor x_badge-tor" style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: nowrap;">
      ลำดับ TOR #$vId
    </span>
  </td>
  <td class="card-cell cell-term x_card-cell x_cell-term" width="115" style="width: 115px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #dc2626;">
    <span class="badge-urgent x_badge-urgent" style="display: inline-block; background-color: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; white-space: nowrap; line-height: 1.2;">
      วาระ: $vRem
    </span>
  </td>
  <td class="card-cell cell-village x_card-cell x_cell-village" width="180" style="width: 180px; min-width: 150px; padding: 10px 10px; vertical-align: middle; background-color: #ffffff; color: #0f172a; text-align: left;">
    <div style="font-size: 14px; font-weight: 800; color: #0f172a; background-color: transparent; line-height: 1.35;">$($v.village)</div>
    <div style="font-size: 12px; color: #475569; background-color: transparent; margin-top: 2px; line-height: 1.35;">$vLocSub$vLocDist$vLocProv</div>
  </td>
  <td class="card-cell cell-specs x_card-cell x_cell-specs" width="110" style="width: 110px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #0f766e;">
    <span class="badge-specs x_badge-specs" style="display: inline-block; background-color: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px; white-space: nowrap;">$vHeight</span>
    $vTypeText
  </td>
  <td class="card-cell cell-phone x_card-cell x_cell-phone" width="115" style="width: 115px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #2563eb;">
    $vPhoneBtn
  </td>
  <td class="card-cell cell-map x_card-cell x_cell-map" width="95" style="width: 95px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #1d4ed8;">
    $vMapsBtn
  </td>
</tr>
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
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>USO PROJECT ALERT</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style type="text/css">
    body, table, td, th, p, a, span, div {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }
    table {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    .fluid-table, .x_fluid-table {
      width: 680px !important;
      border-collapse: collapse !important;
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    td, th {
      mso-line-height-rule: exactly;
    }
  </style>
  <![endif]-->
  <style type="text/css">
    :root {
      color-scheme: light;
      supported-color-schemes: light;
    }
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      border-collapse: collapse;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    /* Outlook Web (.rps_...) and Dark Mode Color Normalization */
    [data-ogsc] .email-container,
    [data-ogsb] .email-container,
    .rps_auto_gen .email-container {
      background-color: #ffffff !important;
    }
    [data-ogsc] .email-wrapper,
    [data-ogsb] .email-wrapper,
    .rps_auto_gen .email-wrapper {
      background-color: #f1f5f9 !important;
    }
    [data-ogsc] .badge-urgent,
    [data-ogsc] .x_badge-urgent,
    [data-ogsb] .badge-urgent,
    [data-ogsb] .x_badge-urgent,
    .rps_auto_gen .badge-urgent,
    .rps_auto_gen .x_badge-urgent {
      background-color: #fee2e2 !important;
      color: #dc2626 !important;
    }
    [data-ogsc] .badge-specs,
    [data-ogsc] .x_badge-specs,
    [data-ogsb] .badge-specs,
    [data-ogsb] .x_badge-specs,
    .rps_auto_gen .badge-specs,
    .rps_auto_gen .x_badge-specs {
      background-color: #f0fdfa !important;
      color: #0f766e !important;
    }
    [data-ogsc] .action-phone,
    [data-ogsc] .x_action-phone,
    [data-ogsb] .action-phone,
    [data-ogsb] .x_action-phone,
    .rps_auto_gen .action-phone,
    .rps_auto_gen .x_action-phone {
      background-color: #f8fafc !important;
      color: #2563eb !important;
    }
    [data-ogsc] .action-map,
    [data-ogsc] .x_action-map,
    [data-ogsb] .action-map,
    [data-ogsb] .x_action-map,
    .rps_auto_gen .action-map,
    .rps_auto_gen .x_action-map {
      background-color: #eff6ff !important;
      color: #1d4ed8 !important;
    }
    .rps_auto_gen,
    div[visibility=hidden],
    div[visibility=hidden] + div {
      background-color: transparent !important;
    }
    .rps_auto_gen table,
    div[visibility=hidden] + div table {
      border-collapse: collapse !important;
    }

    /* Mobile Responsive Card Transformation */
    @media only screen and (max-width: 600px) {
      .email-wrapper, .x_email-wrapper {
        padding: 12px 6px !important;
      }
      .email-container, .x_email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 10px !important;
      }
      .email-header, .x_email-header {
        padding: 18px 16px !important;
      }
      .email-header h1, .x_email-header h1,
      .email-header h2, .x_email-header h2 {
        font-size: 18px !important;
        line-height: 1.35 !important;
      }
      .email-header p, .x_email-header p {
        font-size: 13px !important;
      }
      .email-body, .x_email-body {
        padding: 18px 14px !important;
      }
      .email-footer, .x_email-footer {
        padding: 14px 14px !important;
      }

      /* Fluid Table to Stacked Cards */
      .fluid-table, .x_fluid-table {
        display: block !important;
        width: 100% !important;
        border: none !important;
      }
      .fluid-table thead, .x_fluid-table thead {
        display: none !important;
        max-height: 0 !important;
        overflow: hidden !important;
        mso-hide: all !important;
      }
      .fluid-table tbody, .x_fluid-table tbody {
        display: block !important;
        width: 100% !important;
      }
      .fluid-table tr.village-card-row,
      .x_fluid-table tr.x_village-card-row,
      tr.village-card-row,
      tr.x_village-card-row {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin-bottom: 14px !important;
        background-color: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        padding: 14px !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.04) !important;
      }
      .fluid-table td.card-cell,
      .x_fluid-table td.x_card-cell,
      td.card-cell,
      td.x_card-cell {
        border: none !important;
        box-sizing: border-box !important;
      }
      .fluid-table td.cell-tor,
      .x_fluid-table td.x_cell-tor,
      td.cell-tor,
      td.x_cell-tor {
        display: inline-block !important;
        width: 48% !important;
        text-align: left !important;
        vertical-align: middle !important;
        padding: 0 0 8px 0 !important;
      }
      .fluid-table td.cell-term,
      .x_fluid-table td.x_cell-term,
      td.cell-term,
      td.x_cell-term {
        display: inline-block !important;
        width: 50% !important;
        text-align: right !important;
        vertical-align: middle !important;
        padding: 0 0 8px 0 !important;
      }
      .fluid-table td.cell-village,
      .x_fluid-table td.x_cell-village,
      td.cell-village,
      td.x_cell-village {
        display: block !important;
        width: 100% !important;
        clear: both !important;
        text-align: left !important;
        padding: 4px 0 8px 0 !important;
      }
      .fluid-table td.cell-village div:first-child,
      .x_fluid-table td.x_cell-village div:first-child {
        font-size: 15.5px !important;
        margin-bottom: 2px !important;
      }
      .fluid-table td.cell-specs,
      .x_fluid-table td.x_cell-specs,
      td.cell-specs,
      td.x_cell-specs {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        padding: 6px 10px !important;
        margin-bottom: 10px !important;
        background-color: #f8fafc !important;
        border: 1px solid #f1f5f9 !important;
        border-radius: 6px !important;
      }
      .fluid-table td.cell-phone,
      .x_fluid-table td.x_cell-phone,
      td.cell-phone,
      td.x_cell-phone {
        display: inline-block !important;
        width: 48% !important;
        vertical-align: middle !important;
        padding: 0 4px 0 0 !important;
      }
      .fluid-table td.cell-map,
      .x_fluid-table td.x_cell-map,
      td.cell-map,
      td.x_cell-map {
        display: inline-block !important;
        width: 48% !important;
        vertical-align: middle !important;
        padding: 0 0 0 4px !important;
      }
      .fluid-table .action-btn,
      .x_fluid-table .x_action-btn,
      .action-btn,
      .x_action-btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 9px 6px !important;
        font-size: 12px !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div class="email-wrapper x_email-wrapper" style="background-color: #f1f5f9; padding: 24px 12px;">
    <!--[if mso]>
    <table role="presentation" width="680" align="center" border="0" cellpadding="0" cellspacing="0" style="width: 680px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td style="padding: 0; background-color: #ffffff;">
    <![endif]-->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="max-width: 680px; width: 100%; margin: 0 auto; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td style="padding: 0; background-color: #ffffff;">
          <div class="email-container x_email-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 100%; background-color: #ffffff; border: 1px solid #fca5a5; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
            <div class="email-header x_email-header" style="background-color: #7f1d1d; background-image: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); color: #ffffff; padding: 22px 26px;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fecaca; margin-bottom: 6px; background-color: transparent;">USO PROJECT ALERT • VERIFICATION REQUIRED</div>
              <h2 style="margin: 0; font-size: 20px; line-height: 1.3; color: #ffffff;">แจ้งเตือนวาระเจ้าหน้าที่รัฐ (USO Project Team)</h2>
              <p style="margin: 4px 0 0; font-size: 13.5px; color: #fee2e2;">วาระการดำรงตำแหน่งของเจ้าหน้าที่รัฐในพื้นที่รับผิดชอบใกล้หมดอายุลง (0 ปี 1 เดือน) จำนวน $cnt หมู่บ้าน</p>
            </div>
            <div class="email-body x_email-body" style="padding: 24px 26px; background-color: #ffffff; color: #334155; font-size: 14px; line-height: 1.6;">
              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                <b style="color: #9f1239; font-size: 13px; background-color: transparent;">หมู่บ้านที่ต้องตรวจสอบ:</b><br>
                <div style="margin-top: 6px; background-color: transparent;">$vBadges</div>
              </div>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="fluid-table x_fluid-table" style="width: 100%; max-width: 680px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 18px 0; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #ffffff;">
                <thead class="x_thead">
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
                    <th class="x_th" width="65" style="width: 65px; padding: 10px 8px; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; text-align: center; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">ลำดับ TOR</th>
                    <th class="x_th" width="115" style="width: 115px; padding: 10px 8px; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; text-align: center; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">วาระคงเหลือ</th>
                    <th class="x_th" width="180" style="width: 180px; min-width: 150px; padding: 10px 10px; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; text-align: left; border-bottom: 2px solid #cbd5e1;">หมู่บ้าน / ที่ตั้ง</th>
                    <th class="x_th" width="110" style="width: 110px; padding: 10px 8px; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; text-align: center; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">ความสูง / รูปแบบเสา</th>
                    <th class="x_th" width="115" style="width: 115px; padding: 10px 8px; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; text-align: center; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">เบอร์ติดต่อ</th>
                    <th class="x_th" width="95" style="width: 95px; padding: 10px 8px; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; text-align: center; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">แผนที่</th>
                  </tr>
                </thead>
                <tbody class="x_tbody">
                  $vHtml
                </tbody>
              </table>
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-top: 16px;">
                <b style="color: #1e40af; font-size: 13px; background-color: transparent;">สิ่งที่ต้องดำเนินการ:</b><br>
                <span style="font-size: 13px; color: #1e3a8a; background-color: transparent;">โปรดตรวจสอบสถานะการดำรงตำแหน่งปัจจุบัน และประสานงานผู้นำชุมชนในพื้นที่ดังกล่าว</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; margin-bottom: 0; background-color: transparent;">Automated notification from Wara Dashboard at $nowStr</p>
            </div>
          </div>
        </td>
      </tr>
    </table>
    <!--[if mso]>
        </td>
      </tr>
    </table>
    <![endif]-->
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
