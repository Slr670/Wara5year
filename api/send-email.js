// Vercel Serverless Function: /api/send-email (Addressed to USO Project Team)
import nodemailer from 'nodemailer';

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

    if (req.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, message: 'Method Not Allowed. Use POST.' })
      };
    }
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed. Use POST.' });
  }

  try {
    const payload = req.body || {};
    const destinationEmail = (payload.to || process.env.ALERT_TO_EMAIL || 'wara.noreply.app@gmail.com').toString().trim();
    const villages = Array.isArray(payload.villages) ? payload.villages : [];
    const isTest = Boolean(payload.isTest);
    const customSmtp = payload.customSmtp || null;

    if (!destinationEmail || !destinationEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid destination email address.' });
    }

    // Dynamic transporter config if customSmtp provided
    let activeSmtp = { ...SMTP_CONFIG };
    let activeFrom = DEFAULT_FROM;

    if (customSmtp && typeof customSmtp === 'object') {
      const host = (customSmtp.smtp_host || '').trim() || SMTP_CONFIG.host;
      const port = parseInt(customSmtp.smtp_port, 10) || SMTP_CONFIG.port;
      const user = (customSmtp.smtp_user || '').trim() || SMTP_CONFIG.auth.user;
      const pass = (customSmtp.smtp_pw || '').trim() || SMTP_CONFIG.auth.pass;
      const secure = customSmtp.smtp_secure !== undefined ? Boolean(customSmtp.smtp_secure) : (port === 465);
      const rejectUnauthorized = customSmtp.reject_unauthorized !== undefined ? Boolean(customSmtp.reject_unauthorized) : true;

      activeSmtp = {
        host,
        port,
        secure,
        auth: {
          user,
          pass
        },
        tls: {
          rejectUnauthorized
        }
      };

      const senderName = (customSmtp.sender_name || '').trim() || SENDER_NAME;
      const senderEmail = (customSmtp.sender_email || '').trim() || user;
      activeFrom = `"${senderName}" <${senderEmail}>`;
    }

    const transporter = nodemailer.createTransport(activeSmtp);
    const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    let emailSubject = '';
    let emailHtml = '';

    if (isTest) {
      emailSubject = `[USO Project Team] ทดสอบระบบแจ้งเตือน Email Alert • Wara Dashboard`;
      emailHtml = `
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
  <title>USO PROJECT VERIFICATION</title>
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
    /* Outlook Web & Dark Mode Normalization */
    [data-ogsc] .email-container, [data-ogsb] .email-container, .rps_auto_gen .email-container {
      background-color: #ffffff !important;
    }
    [data-ogsc] .email-wrapper, [data-ogsb] .email-wrapper, .rps_auto_gen .email-wrapper {
      background-color: #f1f5f9 !important;
    }
    .rps_auto_gen, div[visibility=hidden], div[visibility=hidden] + div {
      background-color: transparent !important;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper, .x_email-wrapper { padding: 12px 6px !important; }
      .email-container, .x_email-container { width: 100% !important; max-width: 100% !important; border-radius: 10px !important; }
      .email-header, .x_email-header { padding: 20px 16px !important; }
      .email-header h1, .x_email-header h1 { font-size: 19px !important; line-height: 1.35 !important; }
      .email-body, .x_email-body { padding: 18px 14px !important; }
      .email-footer, .x_email-footer { padding: 14px 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <div class="email-wrapper x_email-wrapper" style="background-color: #f1f5f9; padding: 24px 12px;">
    <!--[if mso]>
    <table role="presentation" width="660" align="center" border="0" cellpadding="0" cellspacing="0" style="width: 660px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td style="padding: 0; background-color: #ffffff;">
    <![endif]-->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" align="center" style="max-width: 660px; margin: 0 auto; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td style="padding: 0; background-color: #ffffff;">
          <div class="email-container x_email-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', sans-serif; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
            <div class="email-header x_email-header" style="background-color: #1e3a8a; background-image: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 26px 30px; color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #bfdbfe; margin-bottom: 6px; background-color: transparent;">
                USO PROJECT NOTIFICATION • SYSTEM VERIFICATION
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">
                เรียน ทีมงานโครงการ USO (USO Project Team)
              </h1>
              <p style="margin: 6px 0 0; font-size: 14px; color: #e0f2fe;">
                ยืนยันการเชื่อมต่อระบบแจ้งเตือนทาง Email อัตโนมัติสำเร็จ
              </p>
            </div>
            <div class="email-body x_email-body" style="padding: 26px 30px; background-color: #ffffff; color: #334155; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0; color: #334155;">เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,</p>
              <p style="color: #334155;">ระบบแจ้งเตือนอัตโนมัติ <b>Wara Dashboard</b> ได้ทำการทดสอบการเชื่อมต่อกับ <b>Gmail SMTP (${SMTP_CONFIG.host}:${SMTP_CONFIG.port})</b> เรียบร้อยแล้ว พร้อมตรวจจับและแจ้งเตือนเมื่อวาระเจ้าหน้าที่รัฐในพื้นที่ลดลงเหลือ 0 ปี 1 เดือน</p>
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px 20px; margin: 18px 0; color: #475569;">
                <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px; background-color: transparent;">ข้อมูลระบบแจ้งเตือน:</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 4px; background-color: transparent;"><b>เรียนถึง:</b> ทีมงานโครงการ USO (USO Project Team)</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 4px; word-break: break-all; background-color: transparent;"><b>อีเมลปลายทาง:</b> ${destinationEmail}</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 4px; background-color: transparent;"><b>ผู้ส่ง:</b> ${DEFAULT_FROM}</div>
                <div style="font-size: 13px; color: #475569; background-color: transparent;"><b>เวลาที่ส่ง:</b> ${nowStr} (เวลาประเทศไทย)</div>
              </div>
            </div>
            <div class="email-footer x_email-footer" style="background-color: #f1f5f9; padding: 14px 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
              Wara Dashboard • ระบบติดตามวาระเจ้าหน้าที่รัฐและแผนที่เสาอากาศความสูง USO
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
    } else {
      const count = villages.length;
      emailSubject = `[USO ALERT] [USO Project Team] แจ้งเตือน: วาระเจ้าหน้าที่รัฐใกล้หมดอายุ (ต้องการการตรวจสอบ) - พบ ${count} หมู่บ้าน`;

      const villageBadgesHtml = villages.map(v => `
        <span style="display: inline-block; background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin: 3px 4px 3px 0; white-space: nowrap;">
          <span style="color:#b91c1c; font-weight:800; margin-right:3px;">•</span> ${v.village} (จ.${v.province})
        </span>
      `).join('');

      const villageRowsHtml = villages.map((v, idx) => {
        const torId = v.id || (idx + 1);
        const termStr = v.remaining || v.term || '0 ปี 1 เดือน';
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
              ${v.expireDate ? `<div style="font-size: 10.5px; color: #64748b; background-color: transparent; margin-top: 3px; white-space: nowrap;">หมดวาระ: ${v.expireDate}</div>` : ''}
            </td>
            <td class="card-cell cell-village x_card-cell x_cell-village" width="180" style="width: 180px; min-width: 150px; padding: 10px 10px; vertical-align: middle; background-color: #ffffff; color: #0f172a; text-align: left;">
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; background-color: transparent; line-height: 1.35;">${v.village}</div>
              <div style="font-size: 12px; color: #475569; background-color: transparent; margin-top: 2px; line-height: 1.35;">
                ${locationText}
              </div>
              ${v.houseNo ? `<div style="font-size: 11px; color: #94a3b8; background-color: transparent; margin-top: 2px;">บ้านเลขที่: ${v.houseNo}</div>` : ''}
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

      emailHtml = `
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
          <div class="email-container x_email-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', sans-serif; width: 100%; background-color: #ffffff; border: 1px solid #fca5a5; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(220, 38, 38, 0.08);">
            <!-- Header Banner -->
            <div class="email-header x_email-header" style="background-color: #991b1b; background-image: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); padding: 24px 26px; color: #ffffff;">
              <div style="display: inline-block; background-color: rgba(0,0,0,0.25); padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fee2e2; margin-bottom: 8px;">
                USO PROJECT ALERT • URGENT VERIFICATION REQUIRED
              </div>
              <h1 style="margin: 0; font-size: 21px; font-weight: 800; line-height: 1.3; color: #ffffff;">
                เรียน ทีมงานโครงการ USO (USO Project Team)
              </h1>
              <p style="margin: 6px 0 0; font-size: 13.5px; color: #fee2e2;">
                แจ้งเตือนวาระการดำรงตำแหน่งของเจ้าหน้าที่รัฐในพื้นที่ใกล้หมดอายุลงและต้องการการตรวจสอบ
              </p>
            </div>
            
            <!-- Body Content -->
            <div class="email-body x_email-body" style="padding: 24px 26px; background-color: #ffffff; color: #334155; font-size: 14px; line-height: 1.6;">
              <p style="margin-top: 0; font-size: 15px; color: #334155;">
                เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,
              </p>
              <p style="color: #334155;">
                ระบบ Wara Dashboard ขอแจ้งเตือนว่า วาระการดำรงตำแหน่งของเจ้าหน้าที่รัฐในพื้นที่รับผิดชอบของท่าน<b>กำลังจะหมดอายุลง (คงเหลือ 0 ปี 1 เดือน)</b> จำนวนรวม <b>${count} หมู่บ้าน</b> ซึ่งจำเป็นต้องได้รับการตรวจสอบสถานะ ยืนยันข้อมูลเจ้าหน้าที่ และประสานงานในพื้นที่โดยด่วน
              </p>
              
              <!-- Quick Badges Section -->
              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 14px 18px; margin: 18px 0;">
                <div style="font-size: 13px; font-weight: 800; color: #9f1239; margin-bottom: 8px; background-color: transparent;">
                  รายชื่อหมู่บ้านที่วาระใกล้หมดอายุและต้องตรวจสอบ:
                </div>
                <div style="background-color: transparent;">
                  ${villageBadgesHtml}
                </div>
              </div>

              <!-- Fluid Responsive Table / Stacked Cards -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="fluid-table x_fluid-table" style="width: 100%; max-width: 680px; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 18px 0; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;">
                <thead class="x_thead">
                  <tr style="background-color: #f8fafc; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #cbd5e1;">
                    <th class="x_th" width="65" style="width: 65px; padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">ลำดับ TOR</th>
                    <th class="x_th" width="115" style="width: 115px; padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">วาระคงเหลือ</th>
                    <th class="x_th" width="180" style="width: 180px; min-width: 150px; padding: 10px 10px; text-align: left; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">หมู่บ้าน / ที่ตั้ง</th>
                    <th class="x_th" width="110" style="width: 110px; padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">เสาอากาศ / ข้อมูล</th>
                    <th class="x_th" width="115" style="width: 115px; padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">เบอร์ติดต่อ</th>
                    <th class="x_th" width="95" style="width: 95px; padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 800; color: #475569; background-color: #f8fafc; white-space: nowrap; border-bottom: 2px solid #cbd5e1;">พิกัดเสาอากาศ</th>
                  </tr>
                </thead>
                <tbody class="x_tbody">
                  ${villageRowsHtml}
                </tbody>
              </table>

              <!-- Action Checklist Box -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
                <div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 8px; background-color: transparent;">
                  [Checklist] สิ่งที่ทีมงานโครงการ USO ต้องดำเนินการตรวจสอบ:
                </div>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e40af; line-height: 1.6; background-color: transparent;">
                  <li style="color: #1e40af;">ตรวจสอบและยืนยันสถานะการดำรงตำแหน่งปัจจุบันของเจ้าหน้าที่รัฐในหมู่บ้านดังกล่าว</li>
                  <li style="color: #1e40af;">ประสานงานผู้นำชุมชน / ผู้ใหญ่บ้าน หรือ อปท. ตามเบอร์โทรศัพท์ที่ระบุเพื่อเตรียมข้อมูลต่อวาระหรือผู้รับหน้าที่แทน</li>
                  <li style="color: #1e40af;">ตรวจสอบความพร้อมของเสาอากาศความสูงและสถานีในพื้นที่ผ่านระบบ Wara Dashboard</li>
                </ol>
              </div>
              
              <div style="font-size: 12px; color: #94a3b8; margin-top: 14px; background-color: transparent;">
                ข้อมูลการแจ้งเตือน ณ วันที่: ${nowStr} (เวลาประเทศไทย) • ส่งโดยระบบอัตโนมัติ Wara Dashboard
              </div>
            </div>

            <!-- Footer -->
            <div class="email-footer x_email-footer" style="background-color: #f8fafc; padding: 14px 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
              Wara Dashboard • ระบบติดตามวาระเจ้าหน้าที่รัฐและแผนที่เสาอากาศความสูง USO
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
    }

    const mailOptions = {
      from: activeFrom,
      to: destinationEmail,
      subject: emailSubject,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({
      success: true,
      message: 'Email notification sent successfully to USO Project Team',
      messageId: info.messageId,
      destination: destinationEmail,
      villagesCount: villages.length,
      timestamp: nowStr
    });
  } catch (err) {
    console.error('Error sending email via Nodemailer:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email notification: ' + (err.message || err.toString())
    });
  }
}

export { handler };
