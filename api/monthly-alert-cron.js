// Vercel & Netlify Serverless Function: /api/monthly-alert-cron
// Scheduled Cron: "0 9 1 * *" (Runs on the 1st day of every month at 09:00 AM Bangkok time)
// Target condition: Remaining tenure of exactly 1 month ("0 ปี 1 เดือน")

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Fetch CSV content via https/http with redirect support
function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('http://') ? http : https;
    client.get(url, (res) => {
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

// Parse CSV text with quote handling
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
            remaining: (row[6] || '').trim(),
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
    console.warn('[Monthly-Cron] Failed to fetch live Google Sheet, falling back to local file:', err.message);
  }

  // Candidate paths for data_sheet1.json
  const candidatePaths = [
    path.resolve(process.cwd(), 'data_sheet1.json'),
    path.resolve(__dirname, '../data_sheet1.json'),
    path.resolve(__dirname, '../../data_sheet1.json')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
        return JSON.parse(raw);
      } catch (e) {
        console.warn(`[Monthly-Cron] Error reading ${p}:`, e.message);
      }
    }
  }

  return [];
}

// Core execution logic shared between Vercel and Netlify signatures
async function executeMonthlyAlert(destinationParam) {
  const now = new Date();
  const nowThaiStr = now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  console.log(`[Monthly-Cron] Alert Triggered at ${nowThaiStr}`);

  const destinationEmail = (destinationParam || DEFAULT_DESTINATION).trim();
  const dataset = await loadDataset();
  console.log(`[Monthly-Cron] Dataset loaded with ${dataset.length} records.`);

  // Filter records with tenure of exactly 1 month (0 ปี 1 เดือน)
  const matchedRecords = dataset.filter(r => isExactOneMonthTenure(r.term || r.remaining));
  console.log(`[Monthly-Cron] Found ${matchedRecords.length} records matching 1 month tenure.`);

  if (!matchedRecords.length) {
    return {
      success: true,
      message: 'No records found with exactly 1 month of remaining tenure.',
      checkedCount: dataset.length,
      matchedCount: 0,
      destination: destinationEmail,
      timestamp: nowThaiStr
    };
  }

  // Build Email Alert HTML
  const transporter = nodemailer.createTransport(SMTP_CONFIG);
  const count = matchedRecords.length;
  const emailSubject = `[USO CRON ALERT] แจ้งเตือนประจำเดือน (09:00 น.): พบเจ้าหน้าที่รัฐวาระคงเหลือ 1 เดือน (0 ปี 1 เดือน) - ${count} หมู่บ้าน`;

  const villageCardsHtml = matchedRecords.map((v, idx) => {
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
      <table role="presentation" class="mobile-card" style="display: none; width: 100%; border-collapse: separate; border-spacing: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); overflow: hidden;">
        <tr>
          <td style="padding: 14px 16px;">
            <!-- Top Row: TOR ID & Tenure Badge -->
            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
              <tr>
                <td style="text-align: left; vertical-align: middle;">
                  <span style="display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: nowrap;">
                    ลำดับ TOR #${torId}
                  </span>
                </td>
                <td style="text-align: right; vertical-align: middle;">
                  <span style="display: inline-block; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; line-height: 1.2;">
                    วาระคงเหลือ: ${termStr}
                  </span>
                </td>
              </tr>
            </table>

            <!-- Village Name & Location -->
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.35; margin-bottom: 4px;">
              ${v.village}
            </div>
            <div style="font-size: 13px; color: #475569; line-height: 1.4; margin-bottom: 10px;">
              ${locationText}
            </div>

            <!-- Specs: Tower Height & Type -->
            <div style="margin-bottom: 12px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #f1f5f9; font-size: 12px; color: #475569;">
              <span style="color: #64748b; font-weight: 600; margin-right: 4px;">เสาอากาศ:</span>
              <span style="display: inline-block; background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap; margin-right: 6px;">
                ${heightVal}
              </span>
              ${typicalType ? `
                <span style="display: inline-block; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; font-weight: 600; padding: 2px 8px; border-radius: 4px; white-space: nowrap;">
                  ${typicalType}
                </span>
              ` : ''}
            </div>

            <!-- Actions: Phone & Google Maps -->
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                ${rawPhone ? `
                  <td style="padding-right: 6px; vertical-align: middle;">
                    <a href="tel:${cleanPhone}" style="display: block; background: #f8fafc; color: #2563eb; border: 1px solid #cbd5e1; font-size: 12px; font-weight: 700; padding: 9px 10px; border-radius: 6px; text-decoration: none; text-align: center; white-space: nowrap;">
                      📞 ${rawPhone}
                    </a>
                  </td>
                ` : `
                  <td style="padding-right: 6px; vertical-align: middle;">
                    <div style="display: block; background: #f8fafc; color: #94a3b8; border: 1px solid #f1f5f9; font-size: 12px; padding: 9px 10px; border-radius: 6px; text-align: center; white-space: nowrap;">
                      ไม่มีเบอร์ติดต่อ
                    </div>
                  </td>
                `}
                ${hasCoords ? `
                  <td style="padding-left: 6px; width: 110px; vertical-align: middle;">
                    <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 12px; font-weight: 700; padding: 9px 10px; border-radius: 6px; text-decoration: none; text-align: center; white-space: nowrap;">
                      แผนที่ ↗
                    </a>
                  </td>
                ` : ''}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }).join('');

  const villageRowsHtml = matchedRecords.map((v, idx) => {
    const torId = v.id || (idx + 1);
    const termStr = v.term || v.remaining || '0 ปี 1 เดือน';
    const heightVal = (v.towerHeight || v.height || '9') + ' ม.';
    const typicalType = v.typicalType ? String(v.typicalType).trim() : '';
    const rawPhone = v.phone ? String(v.phone).trim() : '';
    const cleanPhone = rawPhone ? rawPhone.split(',')[0].trim().replace(/\s+/g, '') : '';
    const hasCoords = Boolean(v.lat && v.lng);
    const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${v.lat},${v.lng}` : '';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-size: 13px; font-weight: 700; color: #1e293b; text-align: center; white-space: nowrap;">${torId}</td>
        <td style="padding: 12px 10px;">
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.35;">${v.village}</div>
          <div style="font-size: 12px; color: #475569; margin-top: 3px; line-height: 1.35;">
            ${v.subdistrict ? `ต.${v.subdistrict} ` : ''}${v.district ? `อ.${v.district} ` : ''}<b>จ.${v.province}</b>
          </div>
        </td>
        <td style="padding: 12px 8px; text-align: center; white-space: nowrap;">
          <span style="display: inline-block; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; line-height: 1.2;">
            ${termStr}
          </span>
        </td>
        <td style="padding: 12px 8px; text-align: center; font-size: 12px; white-space: nowrap;">
          <span style="display: inline-block; background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; font-weight: 700; padding: 3px 8px; border-radius: 6px; white-space: nowrap; line-height: 1.2;">
            ${heightVal}
          </span>
          ${typicalType ? `<div style="font-size: 11px; color: #4f46e5; margin-top: 4px; font-weight: 600; white-space: nowrap;">${typicalType}</div>` : ''}
        </td>
        <td style="padding: 12px 8px; font-size: 12px; text-align: center; white-space: nowrap;">
          ${rawPhone ? `<a href="tel:${cleanPhone}" style="color: #2563eb; text-decoration: none; font-weight: 700; white-space: nowrap; display: inline-block;">${rawPhone}</a>` : '<span style="color:#94a3b8;">-</span>'}
        </td>
        <td style="padding: 12px 8px; text-align: center; white-space: nowrap;">
          ${hasCoords ? `
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-decoration: none; white-space: nowrap;">
              Google Maps ↗
            </a>
          ` : '<span style="color:#94a3b8;">-</span>'}
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

    /* Mobile Responsive Overrides */
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
      
      /* Hide rigid table on mobile */
      .desktop-table-wrap {
        display: none !important;
        max-height: 0 !important;
        overflow: hidden !important;
        mso-hide: all !important;
        font-size: 0 !important;
        line-height: 0 !important;
      }
      
      /* Show stacked cards on mobile */
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
          รายงานรอบประจำเดือน: พบเจ้าหน้าที่รัฐวาระคงเหลือตรงตามเงื่อนไข 0 ปี 1 เดือน จำนวน ${count} หมู่บ้าน
        </p>
      </div>

      <!-- Body -->
      <div class="email-body" style="padding: 26px 30px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">
          เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,
        </p>
        <p>
          ระบบตรวจสอบวาระอัตโนมัติรอบประจำเดือน (Scheduled Cron Job) ได้ดำเนินการตรวจสอบฐานข้อมูลเมื่อวันที่ <b>${nowThaiStr}</b> และตรวจพบหมู่บ้านที่มีเจ้าหน้าที่รัฐ<b>วาระคงเหลือตรงเงื่อนไข 1 เดือน (0 ปี 1 เดือน)</b> จำนวน <b>${count} แห่ง</b> ดังรายละเอียดต่อไปนี้:
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
              ${villageRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Mobile Stacked Cards View (< 600px) -->
        <div class="mobile-cards-wrap" style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 0; line-height: 0;">
          ${villageCardsHtml}
        </div>

        <!-- Schedule Meta Card -->
        <div class="meta-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 18px 0;">
          <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">รายละเอียดการรัน Cron Schedule:</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 2px;"><b>รอบการรัน:</b> ทุกวันที่ 1 ของทุกเดือน เวลา 09:00 น. (Cron: <code>0 9 1 * *</code>)</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 2px;"><b>เงื่อนไขการตรวจจับ:</b> วาระคงเหลือเท่ากับ 1 เดือน (<code>0 ปี 1 เดือน</code>)</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 2px;"><b>อีเมลปลายทาง:</b> <span style="word-break: break-all;">${destinationEmail}</span></div>
          <div style="font-size: 13px; color: #475569;"><b>เวลาที่ประมวลผล:</b> ${nowThaiStr} (เวลาประเทศไทย)</div>
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
  `;

  const info = await transporter.sendMail({
    from: DEFAULT_FROM,
    to: destinationEmail,
    subject: emailSubject,
    html: emailHtml
  });

  console.log('[Monthly-Cron] Alert email sent successfully:', info.messageId);

  return {
    success: true,
    message: 'Monthly alert email sent successfully.',
    destination: destinationEmail,
    matchedCount: matchedRecords.length,
    matchedVillages: matchedRecords.map(v => `${v.village} (${v.district}, ${v.province})`),
    messageId: info.messageId,
    timestamp: nowThaiStr
  };
}

// Vercel Serverless Function Handler (ESM)
export default async function handler(req, res) {
  // Support Netlify handler call signature if used as Netlify function
  if (req && !res && req.httpMethod) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (req.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    try {
      let dest = DEFAULT_DESTINATION;
      if (req.body) {
        try {
          const b = JSON.parse(req.body);
          if (b.to) dest = b.to;
        } catch (_) {}
      }
      const result = await executeMonthlyAlert(dest);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: err.message || 'Internal Server Error' })
      };
    }
  }

  // Standard Vercel req/res handler
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed. Use GET or POST.' });
  }

  try {
    const payload = req.body || {};
    const dest = payload.to || req.query?.to || DEFAULT_DESTINATION;
    const result = await executeMonthlyAlert(dest);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Monthly-Cron] Error executing monthly alert:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute monthly alert: ' + (err.message || err.toString())
    });
  }
}

export { handler };
