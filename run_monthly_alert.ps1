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

# Build HTML Table Rows
$rowsHtml = ""
foreach ($v in $sendItems) {
    $heightVal = if ($v.towerHeight) { "$($v.towerHeight) ม." } elseif ($v.height) { "$($v.height) ม." } else { "9 ม." }
    $typeVal = if ($v.typicalType) { "<br><span style='font-size:11px; color:#4f46e5;'>$($v.typicalType)</span>" } else { "" }
    $mapsLink = if ($v.lat -and $v.lng) { "<a href='https://www.google.com/maps?q=$($v.lat),$($v.lng)' target='_blank' style='display:inline-block; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-size:11px; font-weight:bold; padding:4px 8px; border-radius:6px; text-decoration:none;'>Maps ↗</a>" } else { "-" }
    
    $rowsHtml += @"
<tr style='border-bottom: 1px solid #e2e8f0;'>
  <td style='padding: 10px; text-align: center; font-weight: bold;'>$($v.id)</td>
  <td style='padding: 10px;'>
    <div style='font-size: 14px; font-weight: bold; color: #0f172a;'>$($v.village)</div>
    <div style='font-size: 12px; color: #475569;'>ต.$($v.subdistrict) อ.$($v.district) <b>จ.$($v.province)</b></div>
  </td>
  <td style='padding: 10px; text-align: center;'>
    <span style='background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: bold; font-size: 12px; padding: 3px 8px; border-radius: 6px;'>$($v.term)</span>
  </td>
  <td style='padding: 10px; text-align: center; font-size: 12px;'>
    <b>$heightVal</b>$typeVal
  </td>
  <td style='padding: 10px; text-align: center; font-size: 12px;'>
    <a href='tel:$($v.phone)' style='color:#2563eb; text-decoration:none; font-weight:bold;'>$($v.phone)</a>
  </td>
  <td style='padding: 10px; text-align: center;'>$mapsLink</td>
</tr>
"@
}

$bodyHtml = @"
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%); padding: 24px; color: #ffffff;">
    <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #fecaca;">SCHEDULED MONTHLY CRON ALERT • 09:00 AM CHECK</div>
    <h2 style="margin: 6px 0 0; font-size: 20px;">แจ้งเตือนวาระคงเหลือ 1 เดือน (USO Project)</h2>
    <p style="margin: 4px 0 0; font-size: 13px; color: #fee2e2;">รายงานรอบประจำเดือน: ตรวจพบวาระคงเหลือ 0 ปี 1 เดือน จำนวน $($sendItems.Count) หมู่บ้าน</p>
  </div>
  <div style="padding: 24px; color: #334155; font-size: 14px; line-height: 1.6;">
    <p style="margin-top: 0;">เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,</p>
    <p>ระบบตรวจสอบวาระประจำเดือนได้รันงานเมื่อ <b>$nowStr</b> และพบข้อมูลเจ้าหน้าที่รัฐในพื้นที่รับผิดชอบที่วาระคงเหลือตรงเงื่อนไข <b>1 เดือน (0 ปี 1 เดือน)</b> ดังต่อไปนี้:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 18px 0; border: 1px solid #cbd5e1; border-radius: 8px;">
      <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 12px; color: #475569;">
        <th style="padding: 10px;">ลำดับ TOR</th>
        <th style="padding: 10px; text-align: left;">หมู่บ้าน / ที่ตั้ง</th>
        <th style="padding: 10px;">วาระคงเหลือ</th>
        <th style="padding: 10px;">ความสูง / รูปแบบเสา</th>
        <th style="padding: 10px;">เบอร์ติดต่อ</th>
        <th style="padding: 10px;">พิกัดแผนที่</th>
      </tr>
      $rowsHtml
    </table>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 14px; font-size: 13px;">
      <b>ข้อมูลการตั้งเวลา:</b> รันทุกวันที่ 1 ของเดือน เวลา 09:00 น. (Cron: <code>0 9 1 * *</code>) | <b>อีเมลปลายทาง:</b> $DestinationEmail
    </div>
  </div>
  <div style="background: #f1f5f9; padding: 12px; font-size: 11px; color: #94a3b8; text-align: center;">
    Wara Dashboard • Scheduled Monthly Cron Alert v2.0.1
  </div>
</div>
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
