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

export function exportBracketSitesCsv(
  bracketKey,
  bracketName,
  stations,
  siteBudgets = {},
  baseCost = 20000,
  addCost = 0,
  siteBaseBudgets = {}
) {
  const headers = [
    'ลำดับ TOR',
    'หมู่บ้าน / ชุมชน',
    'ตำบล',
    'อำเภอ',
    'จังหวัด',
    'วาระคงเหลือ',
    'งบตั้งต้น/สถานี (บาท)',
    'งบเพิ่มเติม/สถานี (บาท)',
    'งบประมาณรวม (บาท)'
  ];
  const rows = stations.map(s => {
    const sBase = siteBaseBudgets[s.id] !== undefined && siteBaseBudgets[s.id] !== '' ? Number(siteBaseBudgets[s.id]) : baseCost;
    const sAdd = siteBudgets[s.id] !== undefined && siteBudgets[s.id] !== '' ? Number(siteBudgets[s.id]) : addCost;
    const total = sBase + sAdd;
    return [
      s.id,
      `"${(s.village || '').replace(/"/g, '""')}"`,
      `"${(s.subdistrict || '').replace(/"/g, '""')}"`,
      `"${(s.district || '').replace(/"/g, '""')}"`,
      `"${(s.province || '').replace(/"/g, '""')}"`,
      `"${(s.term || '').replace(/"/g, '""')}"`,
      sBase,
      sAdd,
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

  // Column sums
  const sumH9 = intervalsData.reduce((acc, i) => acc + (i.heights?.h9 || 0), 0);
  const sumH18 = intervalsData.reduce((acc, i) => acc + (i.heights?.h18 || 0), 0);
  const sumH30 = intervalsData.reduce((acc, i) => acc + (i.heights?.h30 || 0), 0);
  const sumTypeA = intervalsData.reduce((acc, i) => acc + (i.types?.typeA || 0), 0);
  const sumTypeB = intervalsData.reduce((acc, i) => acc + (i.types?.typeB || 0), 0);
  const sumTypeC = intervalsData.reduce((acc, i) => acc + (i.types?.typeC || 0), 0);
  const sumTypeOther = intervalsData.reduce((acc, i) => acc + (i.types?.typeOther || i.types?.other || 0), 0);

  // Summary row
  rows.push([
    '"รวมทุกช่วงเวลา"',
    '"ทั้งหมด"',
    totalStations,
    '100.0',
    '-',
    sumH9,
    sumH18,
    sumH30,
    sumTypeA,
    sumTypeB,
    sumTypeC,
    sumTypeOther,
    grandTotalBudget
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  downloadCsvFile(csv, `รายงานวิเคราะห์วาระและความสูงเสาอากาศ_รวมทุกช่วงเวลา_${dateStr}.csv`);
}
