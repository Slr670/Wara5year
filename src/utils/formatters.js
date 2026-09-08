/**
 * Formatting Utilities for Thai Currency, Numbers, Dates, and Text
 */

export function formatThb(val) {
  const num = Number(val) || 0;
  return `฿ ${num.toLocaleString('th-TH')}`;
}

export function formatNumber(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('th-TH');
}

export function formatPercent(val) {
  const num = Number(val) || 0;
  return `${num.toFixed(1)}%`;
}

/**
 * Formats a Date object into Thai Buddhist Era format
 * e.g., "8 กันยายน 2569"
 */
export function formatDateThai(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDate();
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

/**
 * Formats time in Thai format: "17:25:00 น."
 */
export function formatTimeThai(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = n => String(n).padStart(2, '0');
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${h}:${m}:${s} น.`;
}
