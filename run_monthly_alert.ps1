param(
    [string]$DestinationEmail = "wara.noreply.app@gmail.com",
    [switch]$Force
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$nowStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
Write-Host "=================================================="
Write-Host " [USO Project] Monthly Alert Cron Runner"
Write-Host " Trigger Time: $nowStr"
Write-Host " Target Email: $DestinationEmail"
Write-Host " Schedule: 1st of every month at 09:00 AM (0 9 1 * *)"
Write-Host " Condition: Exactly 1 month remaining (0 ปี 1 เดือน)"
Write-Host "=================================================="

$jsonPath = Join-Path $PSScriptRoot "data_sheet1.json"
if (-not (Test-Path $jsonPath)) {
    Write-Error "Dataset file not found: $jsonPath"
    exit 1
}

$rawJson = [System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8)
$dataset = $rawJson | ConvertFrom-Json

# Filter records with exactly 1 month remaining tenure
$matched = @()
foreach ($item in $dataset) {
    $term = ($item.term + "").Trim()
    if ($term -like "*0 ปี 1 เดือน*" -or $term -like "*0ปี1เดือน*" -or $term -eq "1 เดือน") {
        $matched += $item
    }
}

Write-Host "Total dataset records: $($dataset.Count)"
Write-Host "Matched records (1 month remaining): $($matched.Count)"

if ($matched.Count -eq 0 -and -not $Force) {
    Write-Host "No records currently meet the 1-month remaining tenure condition. No email sent."
    exit 0
}

# If force run with 0 records, pick top 2 for testing
$sendItems = if ($matched.Count -gt 0) { $matched } else { $dataset[0..1] }

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

# SMTP Config
$smtpServer = if ($env:SMTP_HOST) { $env:SMTP_HOST } else { "smtp.gmail.com" }
$smtpPort = if ($env:SMTP_PORT) { [int]$env:SMTP_PORT } else { 587 }
$smtpUser = if ($env:SMTP_USER) { $env:SMTP_USER } else { "wara.noreply.app@gmail.com" }
$smtpPass = if ($env:SMTP_PASS) { $env:SMTP_PASS } else { "" }
$fromName = if ($env:EMAIL_FROM_NAME) { $env:EMAIL_FROM_NAME } else { "wara noreply" }

$subject = "[USO CRON ALERT] แจ้งเตือนประจำเดือน (09:00 น.): พบเจ้าหน้าที่รัฐวาระคงเหลือ 1 เดือน (0 ปี 1 เดือน) - $($sendItems.Count) หมู่บ้าน"

# Build HTML Table Rows (Desktop table + Mobile card transformation)
$rowsHtml = ""
$idx = 1
foreach ($v in $sendItems) {
    $torId = if ($v.id) { $v.id } else { $idx }
    $heightVal = if ($v.towerHeight) { "$($v.towerHeight) ม." } elseif ($v.height) { "$($v.height) ม." } else { "9 ม." }
    $typeText = if ($v.typicalType) { "<div style='font-size: 10.5px; color: #4338ca; background-color: transparent; margin-top: 3px; font-weight: 600; white-space: nowrap;'>$($v.typicalType)</div>" } else { "" }
    $termVal = if ($v.term) { $v.term } elseif ($v.remaining) { $v.remaining } else { "0 ปี 1 เดือน" }
    
    $rawPhone = if ($v.phone) { $v.phone.ToString().Trim() } else { "" }
    $cleanPhone = if ($rawPhone) { ($rawPhone.Split(',')[0]).Trim() -replace '\s+', '' } else { "" }
    $hasCoords = ($v.lat -and $v.lng)
    $mapsUrl = if ($hasCoords) { "https://www.google.com/maps?q=$($v.lat),$($v.lng)" } else { "" }
    $mapsBtn = if ($hasCoords) { "<a href='$mapsUrl' target='_blank' rel='noopener noreferrer' class='action-btn action-map x_action-btn x_action-map' style='display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11.5px; font-weight: 700; padding: 6px 9px; border-radius: 6px; text-decoration: none; white-space: nowrap;'>Google Maps ↗</a>" } else { "<span style='color: #94a3b8; font-size: 11.5px; background-color: transparent;'>-</span>" }
    $phoneBtn = if ($rawPhone) { "<a href='tel:$cleanPhone' class='action-btn action-phone x_action-btn x_action-phone' style='display: inline-block; background-color: #f8fafc; color: #2563eb; border: 1px solid #cbd5e1; font-size: 11.5px; font-weight: 700; padding: 6px 9px; border-radius: 6px; text-decoration: none; white-space: nowrap;'>โทร: $cleanPhone</a>" } else { "<span style='color: #94a3b8; font-size: 11.5px; background-color: transparent;'>-</span>" }

    $locSub = if ($v.subdistrict) { "ต.$($v.subdistrict) " } else { "" }
    $locDist = if ($v.district) { "อ.$($v.district) " } else { "" }
    $locProv = "<b>จ.$($v.province)</b>"

    $rowsHtml += @"
<tr class="village-card-row x_village-card-row" style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
  <td class="card-cell cell-tor x_card-cell x_cell-tor" width="65" style="width: 65px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #475569;">
    <span class="badge-tor x_badge-tor" style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: nowrap;">
      ลำดับ TOR #$torId
    </span>
  </td>
  <td class="card-cell cell-term x_card-cell x_cell-term" width="115" style="width: 115px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #dc2626;">
    <span class="badge-urgent x_badge-urgent" style="display: inline-block; background-color: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; white-space: nowrap; line-height: 1.2;">
      วาระ: $termVal
    </span>
  </td>
  <td class="card-cell cell-village x_card-cell x_cell-village" width="180" style="width: 180px; min-width: 150px; padding: 10px 10px; vertical-align: middle; background-color: #ffffff; color: #0f172a; text-align: left;">
    <div style="font-size: 14px; font-weight: 800; color: #0f172a; background-color: transparent; line-height: 1.35;">$($v.village)</div>
    <div style="font-size: 12px; color: #475569; background-color: transparent; margin-top: 2px; line-height: 1.35;">$locSub$locDist$locProv</div>
  </td>
  <td class="card-cell cell-specs x_card-cell x_cell-specs" width="110" style="width: 110px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #0f766e;">
    <span class="badge-specs x_badge-specs" style="display: inline-block; background-color: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px; white-space: nowrap;">$heightVal</span>
    $typeText
  </td>
  <td class="card-cell cell-phone x_card-cell x_cell-phone" width="115" style="width: 115px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #2563eb;">
    $phoneBtn
  </td>
  <td class="card-cell cell-map x_card-cell x_cell-map" width="95" style="width: 95px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #1d4ed8;">
    $mapsBtn
  </td>
</tr>
"@
    $idx++
}

$bodyHtml = @"
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
  <title>USO CRON ALERT</title>
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
      .meta-card, .x_meta-card {
        padding: 14px !important;
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
          <div class="email-container x_email-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', sans-serif; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
            <!-- Header -->
            <div class="email-header x_email-header" style="background-color: #7f1d1d; background-image: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #dc2626 100%); padding: 26px 30px; color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #fecaca; margin-bottom: 6px; background-color: transparent;">
                SCHEDULED MONTHLY CRON ALERT • 09:00 AM CHECK
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff; background-color: transparent;">
                แจ้งเตือนวาระคงเหลือ 1 เดือน (USO Project)
              </h1>
              <p style="margin: 6px 0 0; font-size: 14px; color: #fee2e2; background-color: transparent;">
                รายงานรอบประจำเดือน: พบเจ้าหน้าที่รัฐวาระคงเหลือตรงตามเงื่อนไข 0 ปี 1 เดือน จำนวน $($sendItems.Count) หมู่บ้าน
              </p>
            </div>

            <!-- Body -->
            <div class="email-body x_email-body" style="padding: 26px 30px; background-color: #ffffff; color: #334155; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0; background-color: transparent;">
                เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,
              </p>
              <p style="background-color: transparent;">
                ระบบตรวจสอบวาระอัตโนมัติรอบประจำเดือน (Scheduled Cron Job) ได้ดำเนินการตรวจสอบฐานข้อมูลเมื่อวันที่ <b>$nowStr</b> และตรวจพบหมู่บ้านที่มีเจ้าหน้าที่รัฐ<b>วาระคงเหลือตรงเงื่อนไข 1 เดือน (0 ปี 1 เดือน)</b> จำนวน <b>$($sendItems.Count) แห่ง</b> ดังรายละเอียดต่อไปนี้:
              </p>

              <!-- Fluid Responsive Table / Stacked Cards -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="fluid-table x_fluid-table" style="width: 100%; max-width: 680px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 20px 0; border: 1px solid #cbd5e1; border-radius: 10px; background-color: #ffffff;">
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
                  $rowsHtml
                </tbody>
              </table>

              <!-- Schedule Meta Card -->
              <div class="meta-card x_meta-card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 18px 0;">
                <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px; background-color: transparent;">รายละเอียดการรัน Cron Schedule:</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 2px; background-color: transparent;"><b>รอบการรัน:</b> ทุกวันที่ 1 ของทุกเดือน เวลา 09:00 น. (Cron: <code>0 9 1 * *</code>)</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 2px; background-color: transparent;"><b>เงื่อนไขการตรวจจับ:</b> วาระคงเหลือเท่ากับ 1 เดือน (<code>0 ปี 1 เดือน</code>)</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 2px; word-break: break-all; background-color: transparent;"><b>อีเมลปลายทาง:</b> <span>$DestinationEmail</span></div>
                <div style="font-size: 13px; color: #475569; background-color: transparent;"><b>เวลาที่ประมวลผล:</b> $nowStr (เวลาประเทศไทย)</div>
              </div>

              <p style="font-size: 13px; color: #64748b; margin-bottom: 0; background-color: transparent;">
                ข้อแนะนำ: โปรดประสานงานผู้นำชุมชนในพื้นที่ดังกล่าวเพื่อติดตามสถานะการต่อวาระหรือการแต่งตั้งเจ้าหน้าที่รัฐล่วงหน้า
              </p>
            </div>

            <!-- Footer -->
            <div class="email-footer x_email-footer" style="background-color: #f1f5f9; padding: 14px 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
              Wara Dashboard • ระบบแจ้งเตือนวาระอัตโนมัติรอบประจำเดือน (Scheduled Cron Alert)
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

try {
    $mail = New-Object System.Net.Mail.MailMessage
    $mail.From = New-Object System.Net.Mail.MailAddress($smtpUser, $fromName)
    $mail.To.Add($DestinationEmail)
    $mail.Subject = $subject
    $mail.Body = $bodyHtml
    $mail.IsBodyHtml = $true

    $smtp = New-Object System.Net.Mail.SmtpClient($smtpServer, $smtpPort)
    $smtp.EnableSsl = $true
    $smtp.Credentials = New-Object System.Net.NetworkCredential($smtpUser, $smtpPass)
    $smtp.Send($mail)
    
    Write-Host "[SUCCESS] Monthly alert email sent to $DestinationEmail successfully at $nowStr"
} catch {
    Write-Error "[FAIL] Failed to send email: $_"
    exit 1
}
