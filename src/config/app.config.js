/**
 * Centralized Application Configuration (Single Source of Truth)
 */
export const APP_VERSION = 'v2.1.1';

export const APP_CONFIG = {
  version: APP_VERSION,
  name: 'Wara Dashboard',
  fullName: 'ระบบติดตามวาระคงเหลือเจ้าหน้าที่รัฐ กรมการปกครอง • รวม 181 สถานี',
  companyTh: 'บริษัท ฟอร์ท คอร์ปอเรชั่น จำกัด (มหาชน)',
  companyEn: 'FORTH CORPORATION PUBLIC COMPANY LIMITED',
  companyAddress: '1053/1 ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400 โทรศัพท์ : 02-265-6700',
  defaultSheetUrl: 'https://docs.google.com/spreadsheets/d/1_MIxRihUniFV9E277p5fhoymmjJm5jZ4/export?format=csv&gid=42783416',
  fallbackSheetUrl: '/sheet1_live.csv',
  autoSyncIntervalMs: 300000, // 5 minutes
  defaultAlertEmail: 'wara.noreply.app@gmail.com'
};
