/**
 * CSV Export Helpers with UTF-8 BOM
 */

export function downloadCsvFile(csvContent, filename) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBracketSitesCsv(bracketKey, bracketName, stations, siteBudgets, baseCost, addCost) {
  const headers = ['รหัสสถานี', 'หมู่บ้าน / ชุมชน', 'ตำบล', 'อำเภอ', 'จังหวัด', 'วาระคงเหลือ', 'งบประมาณพื้นฐาน (บาท)', 'งบส่วนกลางปรับเพิ่ม (บาท)', 'งบเฉพาะไซต์ (บาท)', 'งบรวมสุทธิ (บาท)'];
  const rows = stations.map(s => {
    const siteAdd = Number(siteBudgets[s.id]) || 0;
    const total = baseCost + addCost + siteAdd;
    return [
      s.id,
      `"${(s.village || '').replace(/"/g, '""')}"`,
      `"${(s.subdistrict || '').replace(/"/g, '""')}"`,
      `"${(s.district || '').replace(/"/g, '""')}"`,
      `"${(s.province || '').replace(/"/g, '""')}"`,
      `"${(s.term || '').replace(/"/g, '""')}"`,
      baseCost,
      addCost,
      siteAdd,
      total
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  downloadCsvFile(csv, `รายงานงบประมาณ_${bracketName.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}_${dateStr}.csv`);
}

export function exportAllIntervalsCsv(intervalsData, totalStations, grandTotalBudget) {
  const headers = [
    'ช่วงเวลา (Interval)',
    'ระดับความเร่งด่วน',
    'จำนวนสถานี',
    'สัดส่วน (%)',
    'จำนวนจังหวัด',
    'เสา 9 ม.',
    'เสา 18 ม.',
    'เสา 30 ม.',
    'Type A',
    'Type B',
    'Type C',
    'อื่นๆ (Others / Special)',
    'ประมาณการงบรวม (บาท)'
  ];

  const rows = intervalsData.map(item => [
    `"${item.bucket.label}"`,
    `"${item.bucket.priority}"`,
    item.count,
    item.pct,
    item.provCount,
    item.heights.h9,
    item.heights.h18,
    item.heights.h30,
    item.types.typeA,
    item.types.typeB,
    item.types.typeC,
    item.types.typeOther || item.types.other || 0,
    item.estBudget
  ].join(','));

  // Summary row
  rows.push([
    '"รวมทุกช่วงเวลา"',
    '"ทั้งหมด"',
    totalStations,
    '100.0',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    grandTotalBudget
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  downloadCsvFile(csv, `รายงานวิเคราะห์วาระและความสูงเสาอากาศ_รวมทุกช่วงเวลา_${dateStr}.csv`);
}
