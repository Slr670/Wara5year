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

    if (!destinationEmail || !destinationEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid destination email address.' });
    }

    const transporter = nodemailer.createTransport(SMTP_CONFIG);
    const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    let emailSubject = '';
    let emailHtml = '';

    if (isTest) {
      emailSubject = `[USO Project Team] ทดสอบระบบแจ้งเตือน Email Alert • Wara Dashboard`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', sans-serif; max-width: 660px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 26px 30px; color: #ffffff;">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #bfdbfe; margin-bottom: 6px;">
              USO PROJECT NOTIFICATION • SYSTEM VERIFICATION
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3;">
              เรียน ทีมงานโครงการ USO (USO Project Team)
            </h1>
            <p style="margin: 6px 0 0; font-size: 14px; color: #e0f2fe;">
              ยืนยันการเชื่อมต่อระบบแจ้งเตือนทาง Email อัตโนมัติสำเร็จ
            </p>
          </div>
          <div style="padding: 26px 30px; color: #334155; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0;">เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,</p>
            <p>ระบบแจ้งเตือนอัตโนมัติ <b>Wara Dashboard</b> ได้ทำการทดสอบการเชื่อมต่อกับ <b>Gmail SMTP (${SMTP_CONFIG.host}:${SMTP_CONFIG.port})</b> เรียบร้อยแล้ว พร้อมตรวจจับและแจ้งเตือนเมื่อวาระเจ้าหน้าที่รัฐในพื้นที่ลดลงเหลือ 0 ปี 1 เดือน</p>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px 20px; margin: 18px 0;">
              <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">ข้อมูลระบบแจ้งเตือน:</div>
              <div style="font-size: 13px; color: #475569;"><b>เรียนถึง:</b> ทีมงานโครงการ USO (USO Project Team)</div>
              <div style="font-size: 13px; color: #475569;"><b>อีเมลปลายทาง:</b> ${destinationEmail}</div>
              <div style="font-size: 13px; color: #475569;"><b>ผู้ส่ง:</b> ${DEFAULT_FROM}</div>
              <div style="font-size: 13px; color: #475569;"><b>เวลาที่ส่ง:</b> ${nowStr} (เวลาประเทศไทย)</div>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 14px 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
            Wara Dashboard • ระบบติดตามวาระเจ้าหน้าที่รัฐและแผนที่เสาอากาศความสูง USO
          </div>
        </div>
      `;
    } else {
      const count = villages.length;
      emailSubject = `[USO ALERT] [USO Project Team] แจ้งเตือน: วาระเจ้าหน้าที่รัฐใกล้หมดอายุ (ต้องการการตรวจสอบ) - พบ ${count} หมู่บ้าน`;

      const villageBadgesHtml = villages.map(v => `
        <span style="display: inline-block; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin: 3px 4px 3px 0;">
          <span style="color:#b91c1c; font-weight:800; margin-right:3px;">•</span> ${v.village} (จ.${v.province})
        </span>
      `).join('');

      const villageCardsHtml = villages.map((v, idx) => {
        const torId = v.id || (idx + 1);
        const termStr = v.remaining || v.term || '0 ปี 1 เดือน';
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
                <div style="font-size: 13px; color: #475569; line-height: 1.4; margin-bottom: 8px;">
                  ${locationText}
                </div>
                ${v.houseNo ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">บ้านเลขที่: ${v.houseNo}</div>` : ''}

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

      const villagesTableRows = villages.map((v, idx) => {
        const torId = v.id || (idx + 1);
        const termStr = v.remaining || v.term || '0 ปี 1 เดือน';
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
              ${v.houseNo ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">บ้านเลขที่: ${v.houseNo}</div>` : ''}
            </td>
            <td style="padding: 12px 8px; text-align: center; white-space: nowrap;">
              <span style="display: inline-block; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; line-height: 1.2;">
                ${termStr}
              </span>
              ${v.expireDate ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px; white-space: nowrap;">หมดวาระ: ${v.expireDate}</div>` : ''}
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

      emailHtml = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>USO PROJECT ALERT</title>
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
    <div class="email-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', sans-serif; max-width: 720px; width: 100%; margin: 0 auto; background: #ffffff; border: 1px solid #fca5a5; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(220, 38, 38, 0.1);">
      <div class="email-header" style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); padding: 24px 26px; color: #ffffff;">
        <div style="display: inline-block; background: rgba(0,0,0,0.25); padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fee2e2; margin-bottom: 8px;">
          USO PROJECT ALERT • URGENT VERIFICATION REQUIRED
        </div>
        <h1 style="margin: 0; font-size: 21px; font-weight: 800; line-height: 1.3;">
          เรียน ทีมงานโครงการ USO (USO Project Team)
        </h1>
        <p style="margin: 6px 0 0; font-size: 13.5px; color: #fee2e2;">
          แจ้งเตือนวาระการดำรงตำแหน่งของเจ้าหน้าที่รัฐในพื้นที่ใกล้หมดอายุลงและต้องการการตรวจสอบ
        </p>
      </div>
      
      <div class="email-body" style="padding: 24px 26px; color: #334155; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0; font-size: 15px;">
          เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,
        </p>
        <p>
          ระบบ Wara Dashboard ขอแจ้งเตือนว่า วาระการดำรงตำแหน่งของเจ้าหน้าที่รัฐในพื้นที่รับผิดชอบของท่าน<b>กำลังจะหมดอายุลง (คงเหลือ 0 ปี 1 เดือน)</b> จำนวนรวม <b>${count} หมู่บ้าน</b> ซึ่งจำเป็นต้องได้รับการตรวจสอบสถานะ ยืนยันข้อมูลเจ้าหน้าที่ และประสานงานในพื้นที่โดยด่วน
        </p>
        
        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 14px 18px; margin: 18px 0;">
          <div style="font-size: 13px; font-weight: 800; color: #9f1239; margin-bottom: 8px;">
            รายชื่อหมู่บ้านที่วาระใกล้หมดอายุและต้องตรวจสอบ:
          </div>
          <div>
            ${villageBadgesHtml}
          </div>
        </div>

        <!-- Desktop Table View (>= 600px) -->
        <div class="desktop-table-wrap" style="display: block; overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; margin: 18px 0; border: 1px solid #e2e8f0; border-radius: 8px;">
          <table style="width: 100%; min-width: 580px; border-collapse: collapse; background: #ffffff;">
            <thead>
              <tr style="background: #f8fafc; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px; text-align: center; width: 65px; white-space: nowrap;">ลำดับ TOR</th>
                <th style="padding: 10px; min-width: 160px;">ชื่อหมู่บ้าน / ที่ตั้ง</th>
                <th style="padding: 10px; text-align: center; width: 120px; white-space: nowrap;">วาระคงเหลือ</th>
                <th style="padding: 10px; text-align: center; width: 125px; white-space: nowrap;">เบอร์ติดต่อ</th>
                <th style="padding: 10px; text-align: center; width: 100px; white-space: nowrap;">พิกัดเสาอากาศ</th>
              </tr>
            </thead>
            <tbody>
              ${villagesTableRows}
            </tbody>
          </table>
        </div>

        <!-- Mobile Stacked Cards View (< 600px) -->
        <div class="mobile-cards-wrap" style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 0; line-height: 0;">
          ${villageCardsHtml}
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
          <div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 8px;">
            [Checklist] สิ่งที่ทีมงานโครงการ USO ต้องดำเนินการตรวจสอบ:
          </div>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e40af; line-height: 1.6;">
            <li>ตรวจสอบและยืนยันสถานะการดำรงตำแหน่งปัจจุบันของเจ้าหน้าที่รัฐในหมู่บ้านดังกล่าว</li>
            <li>ประสานงานผู้นำชุมชน / ผู้ใหญ่บ้าน หรือ อปท. ตามเบอร์โทรศัพท์ที่ระบุเพื่อเตรียมข้อมูลต่อวาระหรือผู้รับหน้าที่แทน</li>
            <li>ตรวจสอบความพร้อมของเสาอากาศความสูงและสถานีในพื้นที่ผ่านระบบ Wara Dashboard</li>
          </ol>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
          ข้อมูลการแจ้งเตือน ณ วันที่: ${nowStr} (เวลาประเทศไทย) • ส่งโดยระบบอัตโนมัติ Wara Dashboard
        </p>
      </div>

      <div class="email-footer" style="background: #f8fafc; padding: 14px 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
        Wara Dashboard • ระบบติดตามวาระเจ้าหน้าที่รัฐและแผนที่เสาอากาศความสูง USO
      </div>
    </div>
  </div>
</body>
</html>
      `;
    }

    const mailOptions = {
      from: DEFAULT_FROM,
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
