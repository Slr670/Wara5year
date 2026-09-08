/**
 * Centralized Application Configuration (Single Source of Truth)
 */
export const APP_VERSION = 'v2.0.0';

export const APP_CONFIG = {
  version: APP_VERSION,
  name: 'Wara Dashboard',
  fullName: 'ระบบติดตามวาระคงเหลือเจ้าหน้าที่รัฐ กรมการปกครอง • รวม 181 สถานี',
  companyTh: 'บริษัท ฟอร์ท คอร์ปอเรชั่น จำกัด (มหาชน)',
  companyEn: 'FORTH CORPORATION PUBLIC COMPANY LIMITED',
  companyAddress: '1053/1 ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400 โทรศัพท์ : 02-265-6700',
  defaultSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTXa_T_jT9_fW5-example/pub?output=csv',
  autoSyncIntervalMs: 300000, // 5 minutes
  defaultAlertEmail: 'wara.noreply.app@gmail.com'
};
