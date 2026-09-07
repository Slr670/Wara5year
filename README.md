# Wara5year

ระบบ Wara Dashboard - แดชบอร์ดติดตามและจัดการข้อมูลการสิ้นสุดวาระ (Tenure Tracking Dashboard) พร้อมระบบแจ้งเตือนทาง Email อัตโนมัติและส่งออกรายงาน PDF

## ฟังก์ชันการทำงานหลัก
- แดชบอร์ดแสดงผลข้อมูลสถานีและวาระการดำเนินงาน
- ระบบแจ้งเตือนวาระสิ้นสุดล่วงหน้ารายเดือนทางอีเมล (Email Alerts)
- ระบบส่งออกรายงานสรุปเอกสารในรูปแบบ PDF (@react-pdf/renderer)
- รองรับการทำงานทั้งแบบ Local PowerShell Server และ Serverless (Netlify / Vercel Functions)

## การติดตั้งและใช้งาน (Getting Started)
1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
2. ตั้งค่าไฟล์สภาพแวดล้อม:
   คัดลอกไฟล์ `.env.example` เป็น `.env` และกรอกข้อมูล SMTP Email ของคุณ
   ```bash
   cp .env.example .env
   ```
3. รันเซิร์ฟเวอร์ Local:
   ```bash
   npm start
   # หรือรันผ่าน PowerShell: .\server.ps1
   ```
