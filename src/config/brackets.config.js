/**
 * Tenure Bracket Configurations
 * Exact range notation labels:
 * < 1 ปี, 1 - 2 ปี, 2 - 3 ปี, 3 - 4 ปี, 4 - 5 ปี, > 5 ปี
 */
export const BRACKET_CONFIG = [
  {
    key: 'lt1',
    name: '< 1 ปี',
    priority: 'เร่งด่วนระดับ 1 (วิกฤต)',
    kpiBadge: 'เร่งด่วนระดับ 1',
    priColor: '#dc2626',
    priBg: '#fef2f2',
    minYears: 0,
    maxYears: 1,
    color: '#ef4444',
    badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50'
  },
  {
    key: 'y1',
    name: '1 - 2 ปี',
    priority: 'เร่งด่วนระดับ 2',
    kpiBadge: 'เร่งด่วนระดับ 2',
    priColor: '#ea580c',
    priBg: '#fff7ed',
    minYears: 1,
    maxYears: 2,
    color: '#f97316',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50'
  },
  {
    key: 'y2',
    name: '2 - 3 ปี',
    priority: 'เร่งด่วนระดับ 3',
    kpiBadge: 'เร่งด่วนระดับ 3',
    priColor: '#d97706',
    priBg: '#fffbeb',
    minYears: 2,
    maxYears: 3,
    color: '#f59e0b',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
  },
  {
    key: 'y3',
    name: '3 - 4 ปี',
    priority: 'เฝ้าระวังระดับ 1',
    kpiBadge: 'เฝ้าระวังระดับ 1',
    priColor: '#16a34a',
    priBg: '#f0fdf4',
    minYears: 3,
    maxYears: 4,
    color: '#10b981',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
  },
  {
    key: 'y4',
    name: '4 - 5 ปี',
    priority: 'เฝ้าระวังระดับ 2',
    kpiBadge: 'เฝ้าระวังระดับ 2',
    priColor: '#2563eb',
    priBg: '#eff6ff',
    minYears: 4,
    maxYears: 5,
    color: '#3b82f6',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50'
  },
  {
    key: 'gt5',
    name: '> 5 ปี',
    priority: 'ปกติ / ระยะยาว',
    kpiBadge: 'ปกติ',
    priColor: '#7c3aed',
    priBg: '#f5f3ff',
    minYears: 5,
    maxYears: 999,
    color: '#8b5cf6',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50'
  }
];

export const PROVINCES_ORDER = [
  'ทั้งหมด',
  'กาญจนบุรี',
  'กำแพงเพชร',
  'ขอนแก่น',
  'จันทบุรี',
  'ตรัง',
  'นครราชสีมา',
  'นครศรีธรรมราช',
  'นครสวรรค์',
  'พิจิตร',
  'เพชรบูรณ์'
];
