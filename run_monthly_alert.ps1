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

# Build HTML Table Rows (Desktop) & Cards (Mobile)
$rowsHtml = ""
$cardsHtml = ""
$idx = 1
foreach ($v in $sendItems) {
    $torId = if ($v.id) { $v.id } else { $idx }
    $heightVal = if ($v.towerHeight) { "$($v.towerHeight) ม." } elseif ($v.height) { "$($v.height) ม." } else { "9 ม." }
    $typeBadge = if ($v.typicalType) { "<span style='display:inline-block; background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; font-weight:600; padding:2px 8px; border-radius:4px; white-space:nowrap;'>$($v.typicalType)</span>" } else { "" }
    $typeText = if ($v.typicalType) { "<div style='font-size:11px; color:#4f46e5; margin-top:4px; font-weight:600; white-space:nowrap;'>$($v.typicalType)</div>" } else { "" }
    $termVal = if ($v.term) { $v.term } elseif ($v.remaining) { $v.remaining } else { "0 ปี 1 เดือน" }
    
    $rawPhone = if ($v.phone) { $v.phone.ToString().Trim() } else { "" }
    $cleanPhone = if ($rawPhone) { ($rawPhone.Split(',')[0]).Trim() -replace '\s+', '' } else { "" }
    $hasCoords = ($v.lat -and $v.lng)
    $mapsUrl = if ($hasCoords) { "https://www.google.com/maps?q=$($v.lat),$($v.lng)" } else { "" }
    $mapsBtnTable = if ($hasCoords) { "<a href='$mapsUrl' target='_blank' rel='noopener noreferrer' style='display:inline-block; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px; text-decoration:none; white-space:nowrap;'>Google Maps ↗</a>" } else { "<span style='color:#94a3b8;'>-</span>" }
    $mapsBtnCard = if ($hasCoords) { "<td style='padding-left:6px; width:110px; vertical-align:middle;'><a href='$mapsUrl' target='_blank' rel='noopener noreferrer' style='display:block; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-size:12px; font-weight:700; padding:9px 10px; border-radius:6px; text-decoration:none; text-align:center; white-space:nowrap;'>แผนที่ ↗</a></td>" } else { "" }
    $phoneBtnTable = if ($rawPhone) { "<a href='tel:$cleanPhone' style='color:#2563eb; text-decoration:none; font-weight:700; white-space:nowrap; display:inline-block;'>$rawPhone</a>" } else { "<span style='color:#94a3b8;'>-</span>" }
    $phoneBtnCard = if ($rawPhone) { "<td style='padding-right:6px; vertical-align:middle;'><a href='tel:$cleanPhone' style='display:block; background:#f8fafc; color:#2563eb; border:1px solid #cbd5e1; font-size:12px; font-weight:700; padding:9px 10px; border-radius:6px; text-decoration:none; text-align:center; white-space:nowrap;'>📞 $rawPhone</a></td>" } else { "<td style='padding-right:6px; vertical-align:middle;'><div style='display:block; background:#f8fafc; color:#94a3b8; border:1px solid #f1f5f9; font-size:12px; padding:9px 10px; border-radius:6px; text-align:center; white-space:nowrap;'>ไม่มีเบอร์ติดต่อ</div></td>" }

    $locSub = if ($v.subdistrict) { "ต.$($v.subdistrict) " } else { "" }
    $locDist = if ($v.district) { "อ.$($v.district) " } else { "" }
    $locProv = "<b>จ.$($v.province)</b>"

    # Desktop Table Row
    $rowsHtml += @"
<tr style='border-bottom: 1px solid #e2e8f0;'>
  <td style='padding: 12px 8px; font-size: 13px; font-weight: 700; color: #1e293b; text-align: center; white-space: nowrap;'>$torId</td>
  <td style='padding: 12px 10px;'>
    <div style='font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.35;'>$($v.village)</div>
    <div style='font-size: 12px; color: #475569; margin-top: 3px; line-height: 1.35;'>$locSub$locDist$locProv</div>
  </td>
  <td style='padding: 12px 8px; text-align: center; white-space: nowrap;'>
    <span style='display: inline-block; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; line-height: 1.2;'>$termVal</span>
  </td>
  <td style='padding: 12px 8px; text-align: center; font-size: 12px; white-space: nowrap;'>
    <span style='display: inline-block; background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; font-weight: 700; padding: 3px 8px; border-radius: 6px; white-space: nowrap; line-height: 1.2;'>$heightVal</span>
    $typeText
  </td>
  <td style='padding: 12px 8px; font-size: 12px; text-align: center; white-space: nowrap;'>$phoneBtnTable</td>
  <td style='padding: 12px 8px; text-align: center; white-space: nowrap;'>$mapsBtnTable</td>
</tr>
"@

    # Mobile Card
    $cardsHtml += @"
<table role='presentation' class='mobile-card' style='display: none; width: 100%; border-collapse: separate; border-spacing: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); overflow: hidden;'>
  <tr>
    <td style='padding: 14px 16px;'>
      <table role='presentation' style='width: 100%; border-collapse: collapse; margin-bottom: 8px;'>
        <tr>
          <td style='text-align: left; vertical-align: middle;'>
            <span style='display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: nowrap;'>ลำดับ TOR #$torId</span>
          </td>
          <td style='text-align: right; vertical-align: middle;'>
            <span style='display: inline-block; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; line-height: 1.2;'>วาระคงเหลือ: $termVal</span>
          </td>
        </tr>
      </table>
      <div style='font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.35; margin-bottom: 4px;'>$($v.village)</div>
      <div style='font-size: 13px; color: #475569; line-height: 1.4; margin-bottom: 10px;'>$locSub$locDist$locProv</div>
      <div style='margin-bottom: 12px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #f1f5f9; font-size: 12px; color: #475569;'>
        <span style='color: #64748b; font-weight: 600; margin-right: 4px;'>เสาอากาศ:</span>
        <span style='display: inline-block; background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap; margin-right: 6px;'>$heightVal</span>
        $typeBadge
      </div>
      <table role='presentation' style='width: 100%; border-collapse: collapse;'>
        <tr>
          $phoneBtnCard
          $mapsBtnCard
        </tr>
      </table>
    </td>
  </tr>
</table>
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
  <title>USO CRON ALERT</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 0 !important;
      }
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }
      .email-header {
        padding: 20px 16px !important;
      }
      .email-header h1 {
        font-size: 19px !important;
        line-height: 1.35 !important;
      }
      .email-header p {
        font-size: 13px !important;
      }
      .email-body {
        padding: 20px 16px !important;
      }
      .email-footer {
        padding: 14px 16px !important;
      }
      .meta-card {
        padding: 14px !important;
      }
      .desktop-table-wrap {
        display: none !important;
        max-height: 0 !important;
        overflow: hidden !important;
        mso-hide: all !important;
        font-size: 0 !important;
        line-height: 0 !important;
      }
      .mobile-cards-wrap {
        display: block !important;
        max-height: none !important;
        overflow: visible !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        margin: 16px 0 !important;
      }
      .mobile-card {
        display: table !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div class="email-wrapper" style="background-color: #f1f5f9; padding: 24px 12px;">
    <div class="email-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', sans-serif; max-width: 720px; width: 100%; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
      <!-- Header -->
      <div class="email-header" style="background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #dc2626 100%); padding: 26px 30px; color: #ffffff;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #fecaca; margin-bottom: 6px;">
          SCHEDULED MONTHLY CRON ALERT • 09:00 AM CHECK
        </div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3;">
          แจ้งเตือนวาระคงเหลือ 1 เดือน (USO Project)
        </h1>
        <p style="margin: 6px 0 0; font-size: 14px; color: #fee2e2;">
          รายงานรอบประจำเดือน: พบเจ้าหน้าที่รัฐวาระคงเหลือตรงตามเงื่อนไข 0 ปี 1 เดือน จำนวน $($sendItems.Count) หมู่บ้าน
        </p>
      </div>

      <!-- Body -->
      <div class="email-body" style="padding: 26px 30px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">
          เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,
        </p>
        <p>
          ระบบตรวจสอบวาระอัตโนมัติรอบประจำเดือน (Scheduled Cron Job) ได้ดำเนินการตรวจสอบฐานข้อมูลเมื่อวันที่ <b>$nowStr</b> และตรวจพบหมู่บ้านที่มีเจ้าหน้าที่รัฐ<b>วาระคงเหลือตรงเงื่อนไข 1 เดือน (0 ปี 1 เดือน)</b> จำนวน <b>$($sendItems.Count) แห่ง</b> ดังรายละเอียดต่อไปนี้:
        </p>

        <!-- Desktop Table View (>= 600px) -->
        <div class="desktop-table-wrap" style="display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 20px 0; border: 1px solid #cbd5e1; border-radius: 10px; background: #ffffff;">
          <table style="width: 100%; min-width: 620px; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px; font-size: 12px; font-weight: 800; color: #475569; text-align: center; width: 70px; white-space: nowrap;">ลำดับ TOR</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 800; color: #475569; min-width: 170px;">หมู่บ้าน / ที่ตั้ง</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 800; color: #475569; text-align: center; width: 115px; white-space: nowrap;">วาระคงเหลือ</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 800; color: #475569; text-align: center; width: 115px; white-space: nowrap;">ความสูง / รูปแบบเสา</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 800; color: #475569; text-align: center; width: 125px; white-space: nowrap;">เบอร์ติดต่อ</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 800; color: #475569; text-align: center; width: 95px; white-space: nowrap;">แผนที่</th>
              </tr>
            </thead>
            <tbody>
              $rowsHtml
            </tbody>
          </table>
        </div>

        <!-- Mobile Stacked Cards View (< 600px) -->
        <div class="mobile-cards-wrap" style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 0; line-height: 0;">
          $cardsHtml
        </div>

        <!-- Schedule Meta Card -->
        <div class="meta-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 18px 0;">
          <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">รายละเอียดการรัน Cron Schedule:</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 2px;"><b>รอบการรัน:</b> ทุกวันที่ 1 ของทุกเดือน เวลา 09:00 น. (Cron: <code>0 9 1 * *</code>)</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 2px;"><b>เงื่อนไขการตรวจจับ:</b> วาระคงเหลือเท่ากับ 1 เดือน (<code>0 ปี 1 เดือน</code>)</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 2px;"><b>อีเมลปลายทาง:</b> <span style="word-break: break-all;">$DestinationEmail</span></div>
          <div style="font-size: 13px; color: #475569;"><b>เวลาที่ประมวลผล:</b> $nowStr (เวลาประเทศไทย)</div>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
          ข้อแนะนำ: โปรดประสานงานผู้นำชุมชนในพื้นที่ดังกล่าวเพื่อติดตามสถานะการต่อวาระหรือการแต่งตั้งเจ้าหน้าที่รัฐล่วงหน้า
        </p>
      </div>

      <!-- Footer -->
      <div class="email-footer" style="background: #f1f5f9; padding: 14px 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
        Wara Dashboard • ระบบแจ้งเตือนวาระอัตโนมัติรอบประจำเดือน (Scheduled Cron Alert)
      </div>
    </div>
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
