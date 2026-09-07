// Netlify Serverless Function: Send Email via Nodemailer (Gmail SMTP)
// Endpoint: /.netlify/functions/send-email or /api/send-email (via redirect)

const nodemailer = require('nodemailer');

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

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  // Handle preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method Not Allowed. Use POST.' })
    };
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const destinationEmail = (payload.to || process.env.ALERT_TO_EMAIL || 'wara.noreply.app@gmail.com').toString().trim();
    const villages = Array.isArray(payload.villages) ? payload.villages : [];
    const isTest = Boolean(payload.isTest);

    if (!destinationEmail || !destinationEmail.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid destination email address.' })
      };
    }

    // Create Nodemailer Transporter
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
            <p style="margin-top: 0;">
              เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,
            </p>
            <p>
              ระบบแจ้งเตือนอัตโนมัติ <b>Wara Dashboard</b> ได้ทำการทดสอบการเชื่อมต่อกับ <b>Gmail SMTP (${SMTP_CONFIG.host}:${SMTP_CONFIG.port})</b> เรียบร้อยแล้ว ระบบพร้อมทำงานในการตรวจจับและแจ้งเตือนเมื่อวาระของเจ้าหน้าที่รัฐในพื้นที่รับผิดชอบใกล้หมดอายุลง (คงเหลือ 0 ปี 1 เดือน) เพื่อให้ทีมงานเข้าตรวจสอบข้อมูลในพื้นที่ได้อย่างทันท่วงที
            </p>
            
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px 20px; margin: 18px 0;">
              <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">ข้อมูลระบบแจ้งเตือน:</div>
              <div style="font-size: 13px; color: #475569;"><b>เรียนถึง:</b> ทีมงานโครงการ USO (USO Project Team)</div>
              <div style="font-size: 13px; color: #475569;"><b>อีเมลปลายทาง:</b> ${destinationEmail}</div>
              <div style="font-size: 13px; color: #475569;"><b>ผู้ส่ง:</b> ${DEFAULT_FROM}</div>
              <div style="font-size: 13px; color: #475569;"><b>เวลาที่ส่ง:</b> ${nowStr} (เวลาประเทศไทย)</div>
              <div style="font-size: 13px; color: #059669; font-weight: 700; margin-top: 4px;"><b>สถานะ:</b> พร้อมเฝ้าระวังวาระเจ้าหน้าที่รัฐ 0 ปี 1 เดือน</div>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
              เมื่อตรวจพบหมู่บ้านที่วาระลดลงเหลือ 0 ปี 1 เดือน ระบบจะส่งอีเมลแจ้งเตือนพร้อมรายชื่อหมู่บ้านและพิกัดเสาอากาศมายังที่อยู่นี้ทันที
            </p>
          </div>

          <div style="background: #f1f5f9; padding: 14px 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
            Wara Dashboard • ระบบติดตามวาระเจ้าหน้าที่รัฐและแผนที่เสาอากาศความสูง USO
          </div>
        </div>
      `;
    } else {
      const count = villages.length;
      const villageNames = villages.map(v => v.village).join(', ');
      
      emailSubject = `[USO ALERT] [USO Project Team] แจ้งเตือน: วาระเจ้าหน้าที่รัฐใกล้หมดอายุ (ต้องการการตรวจสอบ) - พบ ${count} หมู่บ้าน`;

      // Executive Summary Badges
      const villageBadgesHtml = villages.map(v => `
        <span style="display: inline-block; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin: 3px 4px 3px 0;">
          <span style="color:#b91c1c; font-weight:800; margin-right:3px;">•</span> ${v.village} (จ.${v.province})
        </span>
      `).join('');

      // Dynamic Table Rows
      const villagesTableRows = villages.map((v, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 8px; font-size: 13px; font-weight: 700; color: #1e293b; text-align: center;">${v.id || (idx + 1)}</td>
          <td style="padding: 10px 8px;">
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${v.village}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">
              ${v.subdistrict ? `ต.${v.subdistrict} ` : ''}${v.district ? `อ.${v.district} ` : ''}<b>จ.${v.province}</b>
            </div>
            ${v.houseNo ? `<div style="font-size: 11px; color: #94a3b8;">บ้านเลขที่: ${v.houseNo}</div>` : ''}
          </td>
          <td style="padding: 10px 8px; text-align: center;">
            <span style="display: inline-block; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-weight: 800; font-size: 12px; padding: 3px 8px; border-radius: 6px;">
              ${v.remaining || v.term || '0 ปี 1 เดือน'}
            </span>
            ${v.expireDate ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">หมดวาระ: ${v.expireDate}</div>` : ''}
          </td>
          <td style="padding: 10px 8px; font-size: 12px; text-align: center;">
            ${v.phone ? `<a href="tel:${v.phone.split(',')[0].trim()}" style="color: #2563eb; text-decoration: none; font-weight: 700;">Tel: ${v.phone}</a>` : '<span style="color:#94a3b8;">-</span>'}
          </td>
          <td style="padding: 10px 8px; text-align: center;">
            ${(v.lat && v.lng) ? `
              <a href="https://www.google.com/maps?q=${v.lat},${v.lng}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-decoration: none;">
                เปิดแผนที่
              </a>
            ` : '<span style="color:#94a3b8;">-</span>'}
          </td>
        </tr>
      `).join('');

      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', sans-serif; max-width: 680px; width: 100%; margin: 0 auto; background: #ffffff; border: 1px solid #fca5a5; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(220, 38, 38, 0.1);">
          <!-- Header Bar -->
          <div style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); padding: 24px 26px; color: #ffffff;">
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
          
          <div style="padding: 24px 26px; color: #334155; font-size: 14px; line-height: 1.6;">
            <p style="margin-top: 0; font-size: 15px;">
              เรียน <b>ทีมงานโครงการ USO (USO Project Team)</b>,
            </p>
            <p>
              ระบบ Wara Dashboard ขอแจ้งเตือนว่า วาระการดำรงตำแหน่งของเจ้าหน้าที่รัฐในพื้นที่รับผิดชอบของท่าน<b>กำลังจะหมดอายุลง (คงเหลือ 0 ปี 1 เดือน)</b> จำนวนรวม <b>${count} หมู่บ้าน</b> ซึ่งจำเป็นต้องได้รับการตรวจสอบสถานะ ยืนยันข้อมูลเจ้าหน้าที่ และประสานงานในพื้นที่โดยด่วน
            </p>
            
            <!-- Highlighted Village Names List directly in email body -->
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 14px 18px; margin: 18px 0;">
              <div style="font-size: 13px; font-weight: 800; color: #9f1239; margin-bottom: 8px;">
                รายชื่อหมู่บ้านที่วาระใกล้หมดอายุและต้องตรวจสอบ:
              </div>
              <div>
                ${villageBadgesHtml}
              </div>
            </div>

            <!-- Dynamic Detailed Village Table with Responsive Wrapper -->
            <div style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; margin: 18px 0; border: 1px solid #e2e8f0; border-radius: 8px;">
              <table style="width: 100%; min-width: 480px; border-collapse: collapse; background: #ffffff;">
                <thead>
                  <tr style="background: #f8fafc; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 10px; text-align: center;">ลำดับ</th>
                    <th style="padding: 10px;">ชื่อหมู่บ้าน / ที่ตั้ง</th>
                    <th style="padding: 10px; text-align: center;">วาระคงเหลือ</th>
                    <th style="padding: 10px; text-align: center;">เบอร์ติดต่อ</th>
                    <th style="padding: 10px; text-align: center;">พิกัดเสาอากาศ</th>
                  </tr>
                </thead>
                <tbody>
                  ${villagesTableRows}
                </tbody>
              </table>
            </div>

            <!-- Action Checklist for USO Project Team -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
              <div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 8px;">
                [Checklist] สิ่งที่ทีมงานโครงการ USO ต้องดำเนินการตรวจสอบ:
              </div>
              <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e40af; line-height: 1.6;">
                <li>ตรวจสอบและยืนยันสถานะการดำรงตำแหน่งปัจจุบันของเจ้าหน้าที่รัฐในหมู่บ้านดังกล่าว</li>
                <li>ประสานงานผู้นำชุมชน / ผู้ใหญ่บ้าน หรือ อปท. ตามเบอร์โทรศัพท์ที่ระบุเพื่อเตรียมข้อมูลต่อวาระหรือผู้รับหน้าที่แทน</li>
                <li>ตรวจสอบความพร้อมของเสาอากาศความสูงและจุดติดตั้งในพื้นที่ผ่านระบบ Wara Dashboard</li>
              </ol>
            </div>
            
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
              ข้อมูลการแจ้งเตือน ณ วันที่: ${nowStr} (เวลาประเทศไทย) • ส่งโดยระบบอัตโนมัติ Wara Dashboard
            </p>
          </div>

          <div style="background: #f8fafc; padding: 14px 30px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
            Wara Dashboard • ระบบติดตามวาระเจ้าหน้าที่รัฐและแผนที่เสาอากาศความสูง USO
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: DEFAULT_FROM,
      to: destinationEmail,
      subject: emailSubject,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email notification sent successfully to USO Project Team',
        messageId: info.messageId,
        destination: destinationEmail,
        villagesCount: villages.length,
        timestamp: nowStr
      })
    };
  } catch (err) {
    console.error('Error sending email via Nodemailer:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to send email notification: ' + (err.message || err.toString())
      })
    };
  }
};
