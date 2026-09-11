// Netlify Scheduled Serverless Function: Monthly Tenure Alert Cron
// Cron Schedule: "0 9 1 * *" (Runs on the 1st day of every month at 09:00 AM)
// Condition: Remaining tenure of exactly 1 month ("0 ปี 1 เดือน")

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || 'wara.noreply.app@gmail.com',
    pass: process.env.SMTP_PASS || ''
  }
};

const SENDER_NAME = process.env.EMAIL_FROM_NAME || 'wara noreply';
const SENDER_EMAIL = process.env.EMAIL_FROM || SMTP_CONFIG.auth.user;
const DEFAULT_FROM = `"${SENDER_NAME}" <${SENDER_EMAIL}>`;
const DEFAULT_DESTINATION = process.env.ALERT_TO_EMAIL || 'wara.noreply.app@gmail.com';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1_MIxRihUniFV9E277p5fhoymmjJm5jZ4/gviz/tq?tqx=out:csv&sheet=%E0%B8%8A%E0%B8%B5%E0%B8%951';

// Check if tenure matches exactly 1 month (0 ปี 1 เดือน)
function isExactOneMonthTenure(term) {
  if (!term) return false;
  const s = term.toString().trim().replace(/[\s\u00A0]+/g, ' ').toLowerCase();
  return (
    s === '0 ปี 1 เดือน' ||
    s.includes('0 ปี 1 เดือน') ||
    s.includes('0ปี1เดือน') ||
    s === '1 เดือน' ||
    /0\s*ปี\s*1\s*เดือน/.test(s) ||
    /วาระคงเหลือ\s*0\s*ปี\s*1\s*เดือน/.test(s)
  );
}

// Fetch CSV content via https
function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchCsv(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Parse CSV text
function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows = [];
  for (const line of lines) {
    const row = [];
    let inQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += c;
      }
    }
    row.push(current);
    rows.push(row);
  }
  return rows;
}

// Load dataset: try Google Sheet CSV first, fallback to data_sheet1.json
async function loadDataset() {
  try {
    const csvText = await fetchCsv(GOOGLE_SHEET_CSV_URL);
    const rows = parseCsvRows(csvText);
    if (rows && rows.length >= 10) {
      const records = [];
      for (const row of rows) {
        if (!row || row.length < 5) continue;
        if (row[0] && row[0].match(/^\d+$/)) {
          records.push({
            id: parseInt(row[0], 10),
            village: (row[1] || '').trim(),
            subdistrict: (row[2] || '').trim(),
            district: (row[3] || '').trim(),
            province: (row[4] || '').trim(),
            phone: (row[5] || '').trim(),
            term: (row[6] || '').trim(),
            lat: row[7] ? parseFloat(row[7]) : null,
            lng: row[8] ? parseFloat(row[8]) : null,
            towerHeight: (row[9] || '').trim(),
            typicalType: (row[10] || '').trim()
          });
        }
      }
      if (records.length >= 10) return records;
    }
  } catch (err) {
    console.warn('[Cron] Failed to fetch live Google Sheet, falling back to local file:', err.message);
  }

  // Fallback to data_sheet1.json
  const jsonPath = path.resolve(__dirname, '../../data_sheet1.json');
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  }

  return [];
}

const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event && event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const now = new Date();
  const nowThaiStr = now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  console.log(`[Cron] Monthly Alert Triggered at ${nowThaiStr}`);

  try {
    let payload = {};
    if (event && event.body) {
      try { payload = JSON.parse(event.body); } catch (_) {}
    }

    const destinationEmail = (payload.to || DEFAULT_DESTINATION).trim();
    const dataset = await loadDataset();
    console.log(`[Cron] Dataset loaded with ${dataset.length} records.`);

    // Filter records with tenure of exactly 1 month (0 ปี 1 เดือน)
    const matchedRecords = dataset.filter(r => isExactOneMonthTenure(r.term || r.remaining));
    console.log(`[Cron] Found ${matchedRecords.length} records matching 1 month tenure.`);

    if (!matchedRecords.length) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No records found with exactly 1 month of remaining tenure.',
          checkedCount: dataset.length,
          matchedCount: 0,
          timestamp: nowThaiStr
        })
      };
    }

    // Build Email Alert
    const transporter = nodemailer.createTransport(SMTP_CONFIG);
    const count = matchedRecords.length;

    const emailSubject = `[USO CRON ALERT] แจ้งเตือนประจำเดือน (09:00 น.): พบเจ้าหน้าที่รัฐวาระคงเหลือ 1 เดือน (0 ปี 1 เดือน) - ${count} หมู่บ้าน`;

    const villageRowsHtml = matchedRecords.map((v, idx) => {
      const torId = v.id || (idx + 1);
      const termStr = v.term || v.remaining || '0 ปี 1 เดือน';
      const heightVal = (v.towerHeight || v.height || '9') + ' ม.';
      const typicalType = v.typicalType ? String(v.typicalType).trim() : '';
      const rawPhone = v.phone ? String(v.phone).trim() : '';
      const cleanPhone = rawPhone ? rawPhone.split(',')[0].trim().replace(/\s+/g, '') : '';
      const hasCoords = Boolean(v.lat && v.lng);
      const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${v.lat},${v.lng}` : '';
      const locationText = `${v.subdistrict ? `ต.${v.subdistrict} ` : ''}${v.district ? `อ.${v.district} ` : ''}<b>จ.${v.province}</b>`;

      return `
        <tr class="village-card-row x_village-card-row" style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
          <td class="card-cell cell-tor x_card-cell x_cell-tor" width="65" style="width: 65px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #475569;">
            <span class="badge-tor x_badge-tor" style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: nowrap;">
              ลำดับ TOR #${torId}
            </span>
          </td>
          <td class="card-cell cell-term x_card-cell x_cell-term" width="115" style="width: 115px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #dc2626;">
            <span class="badge-urgent x_badge-urgent" style="display: inline-block; background-color: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 11.5px; padding: 3px 8px; border-radius: 6px; white-space: nowrap; line-height: 1.2;">
              วาระ: ${termStr}
            </span>
          </td>
          <td class="card-cell cell-village x_card-cell x_cell-village" width="180" style="width: 180px; min-width: 150px; padding: 10px 10px; vertical-align: middle; background-color: #ffffff; color: #0f172a; text-align: left;">
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; background-color: transparent; line-height: 1.35;">${v.village}</div>
            <div style="font-size: 12px; color: #475569; background-color: transparent; margin-top: 2px; line-height: 1.35;">
              ${locationText}
            </div>
          </td>
          <td class="card-cell cell-specs x_card-cell x_cell-specs" width="110" style="width: 110px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #0f766e;">
            <span class="badge-specs x_badge-specs" style="display: inline-block; background-color: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px; white-space: nowrap;">
              ${heightVal}
            </span>
            ${typicalType ? `<div style="font-size: 10.5px; color: #4338ca; background-color: transparent; margin-top: 3px; font-weight: 600; white-space: nowrap;">${typicalType}</div>` : ''}
          </td>
          <td class="card-cell cell-phone x_card-cell x_cell-phone" width="115" style="width: 115px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #2563eb;">
            ${rawPhone ? `
              <a href="tel:${cleanPhone}" class="action-btn action-phone x_action-btn x_action-phone" style="display: inline-block; background-color: #f8fafc; color: #2563eb; border: 1px solid #cbd5e1; font-size: 11.5px; font-weight: 700; padding: 6px 9px; border-radius: 6px; text-decoration: none; white-space: nowrap;">
                โทร: ${cleanPhone}
              </a>
            ` : `
              <span style="color: #94a3b8; font-size: 11.5px;">-</span>
            `}
          </td>
          <td class="card-cell cell-map x_card-cell x_cell-map" width="95" style="width: 95px; padding: 10px 8px; text-align: center; vertical-align: middle; background-color: #ffffff; color: #1d4ed8;">
            ${hasCoords ? `
              <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="action-btn action-map x_action-btn x_action-map" style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11.5px; font-weight: 700; padding: 6px 9px; border-radius: 6px; text-decoration: none; white-space: nowrap;">
                Google Maps ↗
              </a>
            ` : `
              <span style="color: #94a3b8; font-size: 11.5px;">-</span>
            `}
          </td>
        </tr>
      `;
    }).join('');

    const emailHtml = `
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
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">
                แจ้งเตือนวาระคงเหลือ 1 เดือน (USO Project)
              </h1>
              <p style="margin: 6px 0 0; font-size: 14px; color: #fee2e2;">
                รายงานรอบประจำเดือน: พบเจ้าหน้าที่รัฐวาระคงเหลือตรงตามเงื่อนไข 0 ปี 1 เดือน จำนวน ${count} หมู่บ้าน
              </p>
            </div>

            <!-- Body -->
            <div class="email-body x_email-body" style="padding: 26px 30px; background-color: #ffffff; color: #334155; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0; color: #334155;">
                เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,
              </p>
              <p style="color: #334155;">
                ระบบตรวจสอบวาระอัตโนมัติรอบประจำเดือน (Scheduled Cron Job) ได้ดำเนินการตรวจสอบฐานข้อมูลเมื่อวันที่ <b>${nowThaiStr}</b> และตรวจพบหมู่บ้านที่มีเจ้าหน้าที่รัฐ<b>วาระคงเหลือตรงเงื่อนไข 1 เดือน (0 ปี 1 เดือน)</b> จำนวน <b>${count} แห่ง</b> ดังรายละเอียดต่อไปนี้:
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
                  ${villageRowsHtml}
                </tbody>
              </table>

              <!-- Schedule Meta Card -->
              <div class="meta-card x_meta-card" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 18px 0; color: #475569;">
                <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px; background-color: transparent;">รายละเอียดการรัน Cron Schedule:</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 2px; background-color: transparent;"><b>รอบการรัน:</b> ทุกวันที่ 1 ของทุกเดือน เวลา 09:00 น. (Cron: <code>0 9 1 * *</code>)</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 2px; background-color: transparent;"><b>เงื่อนไขการตรวจจับ:</b> วาระคงเหลือเท่ากับ 1 เดือน (<code>0 ปี 1 เดือน</code>)</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 2px; word-break: break-all; background-color: transparent;"><b>อีเมลปลายทาง:</b> <span>${destinationEmail}</span></div>
                <div style="font-size: 13px; color: #475569; background-color: transparent;"><b>เวลาที่ประมวลผล:</b> ${nowThaiStr} (เวลาประเทศไทย)</div>
              </div>

              <div style="font-size: 13px; color: #64748b; margin-top: 14px; background-color: transparent;">
                ข้อแนะนำ: โปรดประสานงานผู้นำชุมชนในพื้นที่ดังกล่าวเพื่อติดตามสถานะการต่อวาระหรือการแต่งตั้งเจ้าหน้าที่รัฐล่วงหน้า
              </div>
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
    `;

    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to: destinationEmail,
      subject: emailSubject,
      html: emailHtml
    });

    console.log('[Cron] Alert email sent successfully:', info.messageId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Monthly alert email sent successfully.',
        destination: destinationEmail,
        matchedCount: matchedRecords.length,
        matchedVillages: matchedRecords.map(v => `${v.village} (${v.district}, ${v.province})`),
        messageId: info.messageId,
        timestamp: nowThaiStr
      })
    };
  } catch (error) {
    console.error('[Cron] Error executing monthly alert cron:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Internal Server Error',
        stack: error.stack
      })
    };
  }
};

exports.handler = handler;
