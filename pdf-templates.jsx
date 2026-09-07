import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// ==============================================================================
// 1. Thai Font Registration (THSarabunNew & Sarabun) with Hyphenation Control
// ==============================================================================
const isNodeEnv = typeof window === 'undefined' && typeof process !== 'undefined';
const resolveFontSrc = (fileName) => {
  if (isNodeEnv) {
    return `./fonts/${fileName}`;
  }
  return `/fonts/${encodeURIComponent(fileName)}`;
};

try {
  if (typeof Font.registerHyphenationCallback === 'function') {
    Font.registerHyphenationCallback(word => [word]);
  }
  Font.register({
    family: 'THSarabunNew',
    fonts: [
      { src: resolveFontSrc('THSarabunNew.ttf'), fontWeight: 'normal', fontStyle: 'normal' },
      { src: resolveFontSrc('THSarabunNew Bold.ttf'), fontWeight: 'bold', fontStyle: 'normal' },
      { src: resolveFontSrc('THSarabunNew Italic.ttf'), fontWeight: 'normal', fontStyle: 'italic' },
      { src: resolveFontSrc('THSarabunNew BoldItalic.ttf'), fontWeight: 'bold', fontStyle: 'italic' }
    ]
  });
  Font.register({
    family: 'Sarabun',
    fonts: [
      { src: resolveFontSrc('THSarabunNew.ttf'), fontWeight: 'normal', fontStyle: 'normal' },
      { src: resolveFontSrc('THSarabunNew Bold.ttf'), fontWeight: 'bold', fontStyle: 'normal' },
      { src: resolveFontSrc('THSarabunNew Italic.ttf'), fontWeight: 'normal', fontStyle: 'italic' },
      { src: resolveFontSrc('THSarabunNew BoldItalic.ttf'), fontWeight: 'bold', fontStyle: 'italic' }
    ]
  });
} catch (e) {
  console.warn('Font registration note in pdf-templates:', e);
}

// ==============================================================================
// 2. Project Constants & Default Configurations
// ==============================================================================
export const BRACKET_CONFIG = [
  { key: 'lt1', name: '< 1 ปี', priority: 'เร่งด่วนระดับ 1 (วิกฤต)', priColor: '#dc2626', priBg: '#fef2f2', minYears: 0, maxYears: 1 },
  { key: 'y1', name: '1 ปี ถึง < 2 ปี', priority: 'เร่งด่วนระดับ 2', priColor: '#ea580c', priBg: '#fff7ed', minYears: 1, maxYears: 2 },
  { key: 'y2', name: '2 ปี ถึง < 3 ปี', priority: 'เร่งด่วนระดับ 3', priColor: '#d97706', priBg: '#fffbeb', minYears: 2, maxYears: 3 },
  { key: 'y3', name: '3 ปี ถึง < 4 ปี', priority: 'เฝ้าระวังระดับ 1', priColor: '#16a34a', priBg: '#f0fdf4', minYears: 3, maxYears: 4 },
  { key: 'y4', name: '4 ปี ถึง < 5 ปี', priority: 'เฝ้าระวังระดับ 2', priColor: '#2563eb', priBg: '#eff6ff', minYears: 4, maxYears: 5 },
  { key: 'gt5', name: '> 5 ปี', priority: 'ปกติ / ระยะยาว', priColor: '#7c3aed', priBg: '#f5f3ff', minYears: 5, maxYears: 999 }
];

export const DEFAULT_BUDGET_MAP = {
  lt1: 20000,
  y1: 20000,
  y2: 25000,
  y3: 30000,
  y4: 35000,
  gt5: 40000
};

export const DEFAULT_ADDITIONAL_BUDGET_MAP = {
  lt1: 0,
  y1: 0,
  y2: 0,
  y3: 0,
  y4: 0,
  gt5: 0
};

export function formatThb(val) {
  const num = Number(val) || 0;
  return `฿ ${num.toLocaleString('th-TH')}`;
}

// Pre-normalize Thai text (U+0E33 ำ -> U+0E4D ํ + U+0E32 า) to eliminate
// @react-pdf/renderer string length desync bug (#3295) that truncates trailing characters
export function normalizeThai(node) {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string') return node.replace(/\u0E33/g, '\u0E4D\u0E32');
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(normalizeThai);
  return node;
}

// ==============================================================================
// 3. Custom Budget & Metrics Calculation Engine
// ==============================================================================
export function calculateWaraBudgetMetrics(stations = [], siteBudgets = {}, budgetMap = DEFAULT_BUDGET_MAP, additionalBudgetMap = DEFAULT_ADDITIONAL_BUDGET_MAP) {
  const totalStations = stations.length;
  const bMap = { ...DEFAULT_BUDGET_MAP, ...budgetMap };
  const aMap = { ...DEFAULT_ADDITIONAL_BUDGET_MAP, ...additionalBudgetMap };

  let grandBudgetSum = 0;
  let priorityBudgetSum = 0;
  let priorityStationsSum = 0;

  const rows = BRACKET_CONFIG.map(cfg => {
    const bracketStations = stations.filter(s => s.termKey === cfg.key);
    const count = bracketStations.length;
    const pct = totalStations > 0 ? ((count / totalStations) * 100).toFixed(1) : '0.0';

    const defaultBase = bMap[cfg.key] !== undefined ? bMap[cfg.key] : DEFAULT_BUDGET_MAP[cfg.key];
    const defaultExtra = aMap[cfg.key] !== undefined ? aMap[cfg.key] : DEFAULT_ADDITIONAL_BUDGET_MAP[cfg.key];

    let rowTotal = 0;
    bracketStations.forEach(s => {
      const custom = siteBudgets[s.id];
      const b = (custom && custom.base !== undefined && custom.base !== null && !isNaN(custom.base)) ? parseFloat(custom.base) : defaultBase;
      const e = (custom && custom.extra !== undefined && custom.extra !== null && !isNaN(custom.extra)) ? parseFloat(custom.extra) : defaultExtra;
      rowTotal += (b + e);
    });

    const isPriority = cfg.key !== 'gt5';
    grandBudgetSum += rowTotal;
    if (isPriority) {
      priorityBudgetSum += rowTotal;
      priorityStationsSum += count;
    }

    return {
      key: cfg.key,
      name: cfg.name,
      priority: cfg.priority,
      priColor: cfg.priColor,
      priBg: cfg.priBg,
      count,
      pct,
      basePerStation: defaultBase,
      extraPerStation: defaultExtra,
      rowTotal,
      isPriority
    };
  });

  const avgPerStation = totalStations > 0 ? Math.round(grandBudgetSum / totalStations) : 0;
  const priorityPct = totalStations > 0 ? (((priorityStationsSum || 0) / totalStations) * 100).toFixed(1) : '0.0';

  return {
    rows,
    totalStations,
    priorityStationsSum,
    priorityBudgetSum,
    priorityPct,
    grandBudgetSum,
    avgPerStation
  };
}

// ==============================================================================
// 4. Stylesheet Definitions (Corporate Design System)
// ==============================================================================
const styles = StyleSheet.create({
  page: {
    fontFamily: 'THSarabunNew',
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 24,
    fontSize: 8.5,
    color: '#0f172a',
    backgroundColor: '#ffffff'
  },
  pageLandscape: {
    fontFamily: 'THSarabunNew',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    fontSize: 8.5,
    color: '#0f172a',
    backgroundColor: '#ffffff'
  },
  // Corporate Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: 10,
    objectFit: 'contain'
  },
  companyDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  companyTh: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 1.5
  },
  companyEn: {
    fontSize: 10,
    color: '#0284c7',
    fontWeight: 'bold'
  },
  companyAddress: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 1.5
  },
  headerBanner: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563eb',
    paddingBottom: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12
  },
  headerRight: {
    width: 170,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  docBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    marginBottom: 3
  },
  docBadgeText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#1d4ed8'
  },
  title: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  subTitle: {
    fontSize: 8,
    color: '#64748b'
  },
  metaText: {
    fontSize: 8,
    color: '#475569'
  },
  scopeBadge: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 8,
    marginTop: 1.5
  },

  // KPI Metrics Grid
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 3.5,
    borderRadius: 4,
    padding: 6
  },
  kpiTitle: {
    fontSize: 7,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 2
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 1
  },
  kpiSub: {
    fontSize: 7,
    color: '#64748b'
  },

  // Section & Tables
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 9,
    overflow: 'hidden'
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center'
  },
  thText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#334155'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.8,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 3,
    paddingHorizontal: 4,
    alignItems: 'center'
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.8,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 3,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  cellText: {
    fontSize: 7.5,
    color: '#1e293b'
  },
  cellTextCenter: {
    fontSize: 7.5,
    color: '#1e293b',
    textAlign: 'center'
  },
  cellTextRight: {
    fontSize: 7.5,
    color: '#1e293b',
    textAlign: 'right'
  },
  subtotalRow: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderTopWidth: 1.2,
    borderTopColor: '#fca5a5',
    borderBottomWidth: 0.8,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    alignItems: 'center'
  },
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    borderTopWidth: 1.5,
    borderTopColor: '#93c5fd',
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center'
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderTopWidth: 1.2,
    borderTopColor: '#93c5fd',
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    alignItems: 'center'
  },

  // Signatures Section (Dual Clean Boxes)
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 8,
    paddingHorizontal: 20
  },
  signatureBox: {
    width: '44%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    paddingTop: 6
  },
  sigName: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 2
  },
  sigRole: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 1.5,
    textAlign: 'center'
  },
  sigDate: {
    fontSize: 7.5,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center'
  },

  // Footer
  footer: {
    borderTopWidth: 0.8,
    borderTopColor: '#e2e8f0',
    paddingTop: 4,
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#94a3b8'
  }
});

// ==============================================================================
// 5. Template 1: WaraSummaryReportPDF (Executive Summary & Budget Overview)
// ==============================================================================
export const WaraSummaryReportPDF = ({
  scopeLabel = 'ภาพรวมทั้งประเทศ (181 สถานี)',
  stations = [],
  provincialData = [],
  totalStats = null,
  siteBudgets = {},
  budgetMap = DEFAULT_BUDGET_MAP,
  additionalBudgetMap = DEFAULT_ADDITIONAL_BUDGET_MAP,
  dateFormatted = ''
}) => {
  const printDate = dateFormatted || new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const metrics = calculateWaraBudgetMetrics(stations, siteBudgets, budgetMap, additionalBudgetMap);

  // Column Widths for Table 1 (Budget Breakdown Table - optimized against text truncation)
  const colB1 = { width: '24%' };
  const colB2 = { width: '14%', textAlign: 'center' };
  const colB3 = { width: '12%', textAlign: 'right' };
  const colB4 = { width: '8%', textAlign: 'right' };
  const colB5 = { width: '13%', textAlign: 'right' };
  const colB6 = { width: '13%', textAlign: 'right' };
  const colB7 = { width: '16%', textAlign: 'right' };

  // Column Widths for Table 2 (Provincial Summary Table)
  const colPName = { width: '23%' };
  const colPStat = { width: '11%', textAlign: 'right' };

  const totRow = totalStats || {
    total: stations.length,
    lt1: stations.filter(s => s.termKey === 'lt1').length,
    y1: stations.filter(s => s.termKey === 'y1').length,
    y2: stations.filter(s => s.termKey === 'y2').length,
    y3: stations.filter(s => s.termKey === 'y3').length,
    y4: stations.filter(s => s.termKey === 'y4').length,
    gt5: stations.filter(s => s.termKey === 'gt5').length
  };

  return (
    <Document title={`รายงานสรุปภาพรวมวาระคงเหลือเจ้าหน้าที่รัฐ กรมการปกครองและประมาณการงบประมาณ (${scopeLabel})`}>
      <Page size="A4" style={styles.page}>
        {/* Header (Company Branding & Logo) */}
        <View style={styles.headerSection}>
          <Image src="/images/logo.png" style={styles.logo} />
          <View style={styles.companyDetails}>
            <Text style={styles.companyTh}>บริษัท ฟอร์ท คอร์ปอเรชั่น จำกัด (มหาชน)</Text>
            <Text style={styles.companyEn}>FORTH CORPORATION PUBLIC COMPANY LIMITED</Text>
            <Text style={styles.companyAddress}>1053/1 ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400 โทรศัพท์ : 02-265-6700</Text>
          </View>
        </View>

        {/* Document Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>รายงานสรุปภาพรวมวาระคงเหลือเจ้าหน้าที่รัฐ กรมการปกครองและประมาณการงบประมาณ</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.docBadge}>
              <Text style={styles.docBadgeText}>OFFICIAL REPORT • v1.13.10</Text>
            </View>
            <Text style={styles.metaText}>วันที่พิมพ์: {printDate}</Text>
            <Text style={styles.scopeBadge}>ขอบเขต: {scopeLabel}</Text>
          </View>
        </View>

        {/* 4 Summary Metric KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { borderLeftColor: '#2563eb' }]}>
            <Text style={styles.kpiTitle}>สถานีทั้งหมด</Text>
            <Text style={[styles.kpiValue, { color: '#1e40af' }]}>{metrics.totalStations.toLocaleString('th-TH')} สถานี</Text>
            <Text style={styles.kpiSub}>ใน {scopeLabel}</Text>
          </View>
          <View style={[styles.kpiBox, { borderLeftColor: '#dc2626' }]}>
            <Text style={styles.kpiTitle}>กลุ่มวาระเร่งด่วน (≤ 4 ปี)</Text>
            <Text style={[styles.kpiValue, { color: '#b91c1c' }]}>{metrics.priorityStationsSum.toLocaleString('th-TH')} สถานี</Text>
            <Text style={styles.kpiSub}>คิดเป็น {metrics.priorityPct}% ของพื้นที่</Text>
          </View>
          <View style={[styles.kpiBox, { borderLeftColor: '#16a34a' }]}>
            <Text style={styles.kpiTitle}>งบประมาณรวมทั้งสิ้น</Text>
            <Text style={[styles.kpiValue, { color: '#15803d' }]}>{formatThb(metrics.grandBudgetSum)}</Text>
            <Text style={styles.kpiSub}>รวมงบหลัก + งานเพิ่มเติม</Text>
          </View>
          <View style={[styles.kpiBox, { borderLeftColor: '#ea580c' }]}>
            <Text style={styles.kpiTitle}>งบเฉลี่ยต่อสถานี</Text>
            <Text style={[styles.kpiValue, { color: '#c2410c' }]}>{formatThb(metrics.avgPerStation)}</Text>
            <Text style={styles.kpiSub}>ถัวเฉลี่ยทุกช่วงวาระ</Text>
          </View>
        </View>

        {/* Table 1: Budget Breakdown Table */}
        <View style={{ marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>• ตารางแสดงงบประมาณตามช่วงวาระคงเหลือ</Text>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={{ ...styles.thText, ...colB1 }}>ช่วงวาระคงเหลือ</Text>
              <Text style={{ ...styles.thText, ...colB2 }}>ระดับความเร่งด่วน</Text>
              <Text style={{ ...styles.thText, ...colB3 }}>จำนวน</Text>
              <Text style={{ ...styles.thText, ...colB4 }}>สัดส่วน</Text>
              <Text style={{ ...styles.thText, ...colB5 }}>งบหลัก/สถานี</Text>
              <Text style={{ ...styles.thText, ...colB6 }}>งานเพิ่ม/สถานี</Text>
              <Text style={{ ...styles.thText, ...colB7 }}>งบประมาณรวม</Text>
            </View>

            {metrics.rows.map((r, i) => (
              <View key={`r_${r.key}_${i}`} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={{ ...styles.cellText, ...colB1, fontWeight: 'bold' }}>{r.name}</Text>
                <View style={{ ...colB2, alignItems: 'center' }}>
                  <Text style={{ fontSize: 6.8, color: r.priColor, backgroundColor: r.priBg, paddingVertical: 1, paddingHorizontal: 2.5, borderRadius: 2 }}>
                    {r.priority}
                  </Text>
                </View>
                <Text style={{ ...styles.cellText, ...colB3, fontWeight: 'bold' }}>{r.count.toLocaleString('th-TH')} สถานี</Text>
                <Text style={{ ...styles.cellText, ...colB4, color: '#475569' }}>{r.pct}%</Text>
                <Text style={{ ...styles.cellText, ...colB5, color: '#334155' }}>{formatThb(r.basePerStation)}</Text>
                <Text style={{ ...styles.cellText, ...colB6, color: '#2563eb', fontWeight: 'bold' }}>{formatThb(r.extraPerStation)}</Text>
                <Text style={{ ...styles.cellText, ...colB7, fontWeight: 'bold', color: '#1e40af' }}>{formatThb(r.rowTotal)}</Text>
              </View>
            ))}

            {/* Subtotal Row */}
            <View style={styles.subtotalRow}>
              <Text style={{ ...styles.cellText, width: '38%', fontWeight: 'bold', color: '#991b1b' }}>รวมเฉพาะกลุ่มวาระเร่งด่วน (≤ 4 ปี)</Text>
              <Text style={{ ...styles.cellText, ...colB3, fontWeight: 'bold', color: '#991b1b' }}>{metrics.priorityStationsSum.toLocaleString('th-TH')} สถานี</Text>
              <Text style={{ ...styles.cellText, ...colB4, color: '#991b1b' }}>{metrics.priorityPct}%</Text>
              <Text style={{ ...styles.cellText, width: '26%', textAlign: 'right', fontSize: 7, color: '#64748b', paddingRight: 4 }}>รวมงบหลัก + งานเพิ่มเติมกลุ่ม</Text>
              <Text style={{ ...styles.cellText, ...colB7, fontWeight: 'bold', color: '#b91c1c' }}>{formatThb(metrics.priorityBudgetSum)}</Text>
            </View>

            {/* Grand Total Row */}
            <View style={styles.grandTotalRow}>
              <Text style={{ ...styles.cellText, width: '38%', fontWeight: 'bold', color: '#1e3a8a' }}>ยอดรวมงบประมาณทั้งสิ้น (Grand Total)</Text>
              <Text style={{ ...styles.cellText, ...colB3, fontWeight: 'bold', color: '#1e3a8a' }}>{metrics.totalStations.toLocaleString('th-TH')} สถานี</Text>
              <Text style={{ ...styles.cellText, ...colB4, color: '#1e3a8a' }}>100%</Text>
              <Text style={{ ...styles.cellText, width: '26%', textAlign: 'right', fontSize: 7, color: '#475569', paddingRight: 4 }}>รวมทุกช่วงวาระ</Text>
              <Text style={{ ...styles.cellText, ...colB7, fontWeight: 'bold', color: '#1d4ed8' }}>{formatThb(metrics.grandBudgetSum)}</Text>
            </View>
          </View>
        </View>

        {/* Table 2: Provincial Status Overview Table */}
        <View style={{ marginBottom: 6 }}>
          <Text style={styles.sectionTitle}>• ตารางสรุปข้อมูล</Text>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={{ ...styles.thText, ...colPName }}>จังหวัด</Text>
              <Text style={{ ...styles.thText, ...colPStat }}>ทั้งหมด</Text>
              <Text style={{ ...styles.thText, ...colPStat }}>&lt; 1 ปี</Text>
              <Text style={{ ...styles.thText, ...colPStat }}>1 ปี</Text>
              <Text style={{ ...styles.thText, ...colPStat }}>2 ปี</Text>
              <Text style={{ ...styles.thText, ...colPStat }}>3 ปี</Text>
              <Text style={{ ...styles.thText, ...colPStat }}>4 ปี</Text>
              <Text style={{ ...styles.thText, ...colPStat }}>&gt; 5 ปี</Text>
            </View>

            {provincialData.map((p, idx) => (
              <View key={`p_${p.province}_${idx}`} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={{ ...styles.cellText, ...colPName, fontWeight: 'bold' }}>{p.province}</Text>
                <Text style={{ ...styles.cellText, ...colPStat, fontWeight: 'bold' }}>{Number(p.total) || 0}</Text>
                <Text style={{ ...styles.cellText, ...colPStat, color: '#dc2626', fontWeight: 'bold' }}>{Number(p.lt1) || 0}</Text>
                <Text style={{ ...styles.cellText, ...colPStat, color: '#ea580c' }}>{Number(p.y1) || 0}</Text>
                <Text style={{ ...styles.cellText, ...colPStat, color: '#ca8a04' }}>{Number(p.y2) || 0}</Text>
                <Text style={{ ...styles.cellText, ...colPStat, color: '#16a34a' }}>{Number(p.y3) || 0}</Text>
                <Text style={{ ...styles.cellText, ...colPStat, color: '#2563eb' }}>{Number(p.y4) || 0}</Text>
                <Text style={{ ...styles.cellText, ...colPStat, color: '#7c3aed', fontWeight: 'bold' }}>{Number(p.gt5) || 0}</Text>
              </View>
            ))}

            {/* Provincial Summary Row */}
            <View style={styles.summaryRow}>
              <Text style={{ ...styles.cellText, ...colPName, fontWeight: 'bold', color: '#1e40af' }}>รวมทั้งสิ้น (TOTAL)</Text>
              <Text style={{ ...styles.cellText, ...colPStat, fontWeight: 'bold', color: '#1e40af' }}>{Number(totRow.total) || 0}</Text>
              <Text style={{ ...styles.cellText, ...colPStat, fontWeight: 'bold', color: '#dc2626' }}>{Number(totRow.lt1) || 0}</Text>
              <Text style={{ ...styles.cellText, ...colPStat, fontWeight: 'bold', color: '#ea580c' }}>{Number(totRow.y1) || 0}</Text>
              <Text style={{ ...styles.cellText, ...colPStat, fontWeight: 'bold', color: '#ca8a04' }}>{Number(totRow.y2) || 0}</Text>
              <Text style={{ ...styles.cellText, ...colPStat, fontWeight: 'bold', color: '#16a34a' }}>{Number(totRow.y3) || 0}</Text>
              <Text style={{ ...styles.cellText, ...colPStat, fontWeight: 'bold', color: '#2563eb' }}>{Number(totRow.y4) || 0}</Text>
              <Text style={{ ...styles.cellText, ...colPStat, fontWeight: 'bold', color: '#7c3aed' }}>{Number(totRow.gt5) || 0}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Wara Dashboard v1.13.10 — Forth Corporation Public Company Limited</Text>
          <Text render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

// ==============================================================================
// 6. Template 2: StationBudgetDetailPDF (Detailed Station Budget Drilldown Slip)
// ==============================================================================
export const StationBudgetDetailPDF = ({
  bracketKey = 'lt1',
  bracketName = '< 1 ปี',
  province = 'รวม',
  stations = [],
  siteBudgets = {},
  defaultBase = 20000,
  defaultExtra = 0,
  dateFormatted = ''
}) => {
  const printDate = dateFormatted || new Date().toLocaleDateString('th-TH');

  const colS1 = { width: '9%', textAlign: 'center' };
  const colS2 = { width: '27%' };
  const colS3 = { width: '12%', textAlign: 'center' };
  const colS4 = { width: '14%' };
  const colS5 = { width: '12%', textAlign: 'right' };
  const colS6 = { width: '12%', textAlign: 'right' };
  const colS7 = { width: '14%', textAlign: 'right' };

  let totalBracketBudget = 0;
  let customCount = 0;

  const processedStations = stations.map(s => {
    const custom = siteBudgets[s.id];
    const isBaseCustom = custom && custom.base !== undefined && custom.base !== null && !isNaN(custom.base);
    const isExtraCustom = custom && custom.extra !== undefined && custom.extra !== null && !isNaN(custom.extra);
    const isCustom = isBaseCustom || isExtraCustom;
    if (isCustom) customCount++;

    const base = isBaseCustom ? parseFloat(custom.base) : defaultBase;
    const extra = isExtraCustom ? parseFloat(custom.extra) : defaultExtra;
    const total = base + extra;
    totalBracketBudget += total;

    return {
      ...s,
      base,
      extra,
      total,
      isCustom
    };
  });

  return (
    <Document title={`เอกสารเจาะลึกงบประมาณรายสถานี_${bracketKey}_${province}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Image src="/images/logo.png" style={styles.logo} />
          <View style={styles.companyDetails}>
            <Text style={styles.companyTh}>บริษัท ฟอร์ท คอร์ปอเรชั่น จำกัด (มหาชน)</Text>
            <Text style={styles.companyEn}>FORTH CORPORATION PUBLIC COMPANY LIMITED</Text>
            <Text style={styles.companyAddress}>1053/1 ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400 โทรศัพท์ : 02-265-6700</Text>
          </View>
        </View>

        {/* Title Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>เอกสารเจาะลึกงบประมาณรายสถานี</Text>
            <Text style={styles.subTitle}>
              ช่วงวาระ: {bracketName} • ขอบเขต: {province === 'รวม' ? 'ทุกจังหวัด' : `จังหวัด${province}`}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.docBadge, { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}>
              <Text style={[styles.docBadgeText, { color: '#dc2626' }]}>STATION BUDGET SLIP</Text>
            </View>
            <Text style={styles.metaText}>วันที่พิมพ์: {printDate}</Text>
          </View>
        </View>

        {/* Station Overview KPIs */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { borderLeftColor: '#2563eb' }]}>
            <Text style={styles.kpiTitle}>จำนวนสถานีในกลุ่มนี้</Text>
            <Text style={[styles.kpiValue, { color: '#1e40af' }]}>{processedStations.length.toLocaleString('th-TH')} สถานี</Text>
            <Text style={styles.kpiSub}>ปรับแก้เฉพาะสถานี {customCount} แห่ง</Text>
          </View>
          <View style={[styles.kpiBox, { borderLeftColor: '#16a34a' }]}>
            <Text style={styles.kpiTitle}>งบหลักต่อสถานี (มาตรฐาน)</Text>
            <Text style={[styles.kpiValue, { color: '#15803d' }]}>{formatThb(defaultBase)}</Text>
            <Text style={styles.kpiSub}>เกณฑ์มาตรฐานของช่วง</Text>
          </View>
          <View style={[styles.kpiBox, { borderLeftColor: '#ea580c' }]}>
            <Text style={styles.kpiTitle}>งบเพิ่มเติมต่อสถานี (มาตรฐาน)</Text>
            <Text style={[styles.kpiValue, { color: '#c2410c' }]}>{formatThb(defaultExtra)}</Text>
            <Text style={styles.kpiSub}>เกณฑ์มาตรฐานของช่วง</Text>
          </View>
          <View style={[styles.kpiBox, { borderLeftColor: '#7c3aed' }]}>
            <Text style={styles.kpiTitle}>รวมงบประมาณกลุ่มนี้</Text>
            <Text style={[styles.kpiValue, { color: '#6d28d9' }]}>{formatThb(totalBracketBudget)}</Text>
            <Text style={styles.kpiSub}>รวมทุกสถานีในกลุ่ม</Text>
          </View>
        </View>

        {/* Table: Station Details */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={{ ...styles.thText, ...colS1 }}>ลำดับ TOR</Text>
            <Text style={{ ...styles.thText, ...colS2 }}>ชื่อหมู่บ้าน / ที่ตั้ง</Text>
            <Text style={{ ...styles.thText, ...colS3 }}>วาระคงเหลือ</Text>
            <Text style={{ ...styles.thText, ...colS4 }}>ประเภทเสา</Text>
            <Text style={{ ...styles.thText, ...colS5 }}>งบหลัก/สถานี</Text>
            <Text style={{ ...styles.thText, ...colS6 }}>งานเพิ่ม/สถานี</Text>
            <Text style={{ ...styles.thText, ...colS7 }}>รวมสุทธิ</Text>
          </View>

          {processedStations.length === 0 ? (
            <View style={[styles.tableRow, { justifyContent: 'center', paddingVertical: 12 }]}>
              <Text style={{ color: '#94a3b8', fontSize: 9 }}>ไม่พบสถานีในกลุ่มวาระนี้</Text>
            </View>
          ) : (
            processedStations.map((s, idx) => {
              const loc = `${s.subdistrict ? `ต.${s.subdistrict} ` : ''}${s.district ? `อ.${s.district} ` : ''}จ.${s.province}`;
              return (
                <View key={`s_${s.id}_${idx}`} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
                  <Text style={{ ...styles.cellTextCenter, ...colS1, fontWeight: 'bold' }}>{s.id}</Text>
                  <View style={colS2}>
                    <Text style={{ ...styles.cellText, fontWeight: 'bold' }}>
                      {s.village} {s.isCustom ? '(ปรับเฉพาะ)' : ''}
                    </Text>
                    <Text style={{ fontSize: 6.5, color: '#64748b' }}>{loc}</Text>
                  </View>
                  <Text style={{ ...styles.cellTextCenter, ...colS3, color: '#dc2626', fontWeight: 'bold' }}>
                    {s.remaining || '-'}
                  </Text>
                  <View style={colS4}>
                    <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#0f766e' }}>เสา {s.towerHeight || s.height || '9'} ม.</Text>
                    {s.typicalType ? <Text style={{ fontSize: 6.5, color: '#6366f1' }}>{s.typicalType}</Text> : null}
                  </View>
                  <Text style={{ ...styles.cellTextRight, ...colS5 }}>{formatThb(s.base)}</Text>
                  <Text style={{ ...styles.cellTextRight, ...colS6, color: '#2563eb', fontWeight: 'bold' }}>{formatThb(s.extra)}</Text>
                  <Text style={{ ...styles.cellTextRight, ...colS7, color: '#1e40af', fontWeight: 'bold' }}>{formatThb(s.total)}</Text>
                </View>
              );
            })
          )}

          {/* Total Row */}
          <View style={styles.grandTotalRow} wrap={false}>
            <Text style={{ ...styles.cellText, width: '48%', fontWeight: 'bold', color: '#1e3a8a' }}>
              รวมงบประมาณทั้งสิ้นในกลุ่มนี้ ({processedStations.length} สถานี)
            </Text>
            <Text style={{ ...styles.cellText, width: '14%' }} />
            <Text style={{ ...styles.cellText, ...colS5, textAlign: 'right', fontWeight: 'bold', color: '#1e3a8a' }} />
            <Text style={{ ...styles.cellText, ...colS6, textAlign: 'right', fontWeight: 'bold', color: '#1e3a8a' }} />
            <Text style={{ ...styles.cellTextRight, ...colS7, fontWeight: 'bold', color: '#1d4ed8' }}>
              {formatThb(totalBracketBudget)}
            </Text>
          </View>
        </View>

        {/* Dual Signatures Approval Section */}
        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.sigName}>( ........................................................... )</Text>
            <Text style={styles.sigRole}>ผู้จัดทำข้อมูล / วิศวกรโครงการ USO</Text>
            <Text style={styles.sigDate}>วันที่: ...... / ...... / ..........</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.sigName}>( ........................................................... )</Text>
            <Text style={styles.sigRole}>ผู้ตรวจสอบ / ผู้มีอำนาจอนุมัติงบประมาณ</Text>
            <Text style={styles.sigDate}>วันที่: ...... / ...... / ..........</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Wara Dashboard v1.13.10 — Forth Corporation Public Company Limited</Text>
          <Text render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

// ==============================================================================
// 7. Template 3: TenureIntervalAnalysisPDF (Interval & Tower Height Analysis)
// ==============================================================================
export const TenureIntervalAnalysisPDF = ({
  scopeName = 'ภาพรวมทั้งประเทศ (181 สถานี)',
  intervalsData = [],
  totalStations = 181,
  totalBudget = 0,
  dateFormatted = ''
}) => {
  const printDate = dateFormatted || new Date().toLocaleDateString('th-TH');

  const colT1 = { width: '15%' };
  const colT2 = { width: '11%', textAlign: 'center' };
  const colT3 = { width: '8%', textAlign: 'right' };
  const colT4 = { width: '6%', textAlign: 'right' };
  const colT5 = { width: '8%', textAlign: 'center' };
  const colT6 = { width: '7%', textAlign: 'right' };
  const colT7 = { width: '7%', textAlign: 'right' };
  const colT8 = { width: '7%', textAlign: 'right' };
  const colT9 = { width: '6%', textAlign: 'right' };
  const colT10 = { width: '6%', textAlign: 'right' };
  const colT11 = { width: '6%', textAlign: 'right' };
  const colT12 = { width: '13%', textAlign: 'right' };

  return (
    <Document title={`รายงานวิเคราะห์วาระคงเหลือและความสูงเสาอากาศ_${scopeName}`}>
      <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Image src="/images/logo.png" style={styles.logo} />
          <View style={styles.companyDetails}>
            <Text style={styles.companyTh}>บริษัท ฟอร์ท คอร์ปอเรชั่น จำกัด (มหาชน)</Text>
            <Text style={styles.companyEn}>FORTH CORPORATION PUBLIC COMPANY LIMITED</Text>
            <Text style={styles.companyAddress}>1053/1 ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400 โทรศัพท์ : 02-265-6700</Text>
          </View>
        </View>

        {/* Title Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>รายงานวิเคราะห์วาระคงเหลือและความสูงเสาอากาศ USO (Tenure & Tower Analysis)</Text>
            <Text style={styles.subTitle}>ขอบเขตการประมวลผล: {scopeName}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.docBadge, { borderColor: '#86efac', backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.docBadgeText, { color: '#15803d' }]}>TOWER & INTERVAL ANALYSIS</Text>
            </View>
            <Text style={styles.metaText}>วันที่พิมพ์: {printDate}</Text>
          </View>
        </View>

        {/* Data Table */}
        <View style={styles.table}>
          <View style={styles.tableHead} fixed>
            <Text style={{ ...styles.thText, ...colT1 }}>ช่วงเวลา (Interval)</Text>
            <Text style={{ ...styles.thText, ...colT2 }}>ระดับความเร่งด่วน</Text>
            <Text style={{ ...styles.thText, ...colT3 }}>จำนวน</Text>
            <Text style={{ ...styles.thText, ...colT4 }}>สัดส่วน</Text>
            <Text style={{ ...styles.thText, ...colT5 }}>จังหวัด</Text>
            <Text style={{ ...styles.thText, ...colT6 }}>เสา 9 ม.</Text>
            <Text style={{ ...styles.thText, ...colT7 }}>เสา 18 ม.</Text>
            <Text style={{ ...styles.thText, ...colT8 }}>เสา 30 ม.</Text>
            <Text style={{ ...styles.thText, ...colT9 }}>Type A</Text>
            <Text style={{ ...styles.thText, ...colT10 }}>Type B</Text>
            <Text style={{ ...styles.thText, ...colT11 }}>Type C</Text>
            <Text style={{ ...styles.thText, ...colT12 }}>ประมาณการงบรวม</Text>
          </View>

          {intervalsData.map((item, idx) => (
            <View key={`int_${item.bucket?.id || idx}`} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
              <Text style={{ ...styles.cellText, ...colT1, fontWeight: 'bold' }}>{item.bucket?.label || '-'}</Text>
              <Text style={{ ...styles.cellTextCenter, ...colT2, fontSize: 7, color: '#b91c1c' }}>{item.bucket?.priority || '-'}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT3, fontWeight: 'bold' }}>{Number(item.count || 0).toLocaleString('th-TH')} สถานี</Text>
              <Text style={{ ...styles.cellTextRight, ...colT4, color: '#475569' }}>{item.pct || '0.0'}%</Text>
              <Text style={{ ...styles.cellTextCenter, ...colT5 }}>{Number(item.provCount || 0)} จว.</Text>
              <Text style={{ ...styles.cellTextRight, ...colT6 }}>{Number(item.heights?.h9 || 0)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT7 }}>{Number(item.heights?.h18 || 0)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT8 }}>{Number(item.heights?.h30 || 0)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT9 }}>{Number(item.types?.typeA || 0)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT10 }}>{Number(item.types?.typeB || 0)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT11 }}>{Number(item.types?.typeC || 0)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT12, fontWeight: 'bold', color: '#1e40af' }}>
                {formatThb(item.estBudget || 0)}
              </Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <View style={styles.grandTotalRow} wrap={false}>
            <Text style={{ ...styles.cellText, width: '26%', fontWeight: 'bold', color: '#1e3a8a' }}>
              รวมทุกช่วงเวลาที่ประมวลผล
            </Text>
            <Text style={{ ...styles.cellTextRight, ...colT3, fontWeight: 'bold', color: '#1e3a8a' }}>
              {Number(totalStations).toLocaleString('th-TH')} สถานี
            </Text>
            <Text style={{ ...styles.cellTextRight, ...colT4, fontWeight: 'bold', color: '#1e3a8a' }}>100%</Text>
            <Text style={{ ...styles.cellText, width: '47%', fontSize: 7, color: '#475569', paddingLeft: 8 }}>
              วิเคราะห์ครอบคลุมเสาทุกความสูง (9m, 18m, 30m) และ Typical Type A, B, C
            </Text>
            <Text style={{ ...styles.cellTextRight, ...colT12, fontWeight: 'bold', color: '#1d4ed8' }}>
              {formatThb(totalBudget)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Wara Dashboard v1.13.10 — Forth Corporation Public Company Limited</Text>
          <Text render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

// ==============================================================================
// 8. Backward-Compatible Aliases
// ==============================================================================
export const MaterialWithdrawalPDF = StationBudgetDetailPDF;
export const StockReportPDF = WaraSummaryReportPDF;
export const SiteKitsReportPDF = TenureIntervalAnalysisPDF;

export default {
  WaraSummaryReportPDF,
  StationBudgetDetailPDF,
  TenureIntervalAnalysisPDF,
  MaterialWithdrawalPDF,
  StockReportPDF,
  SiteKitsReportPDF,
  calculateWaraBudgetMetrics,
  formatThb,
  BRACKET_CONFIG,
  DEFAULT_BUDGET_MAP,
  DEFAULT_ADDITIONAL_BUDGET_MAP
};
