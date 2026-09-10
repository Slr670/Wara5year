import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { formatThb } from '../../utils/formatters.js';
import './pdfStyles.js'; // Ensure Thai fonts are registered

// Dedicated single-page optimized styles for Executive All-in-One Report (1 / 1 Page)
const allInOneStyles = StyleSheet.create({
  pagePortrait: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 18,
    fontFamily: 'THSarabunNew',
    fontSize: 7,
    color: '#0f172a',
    backgroundColor: '#ffffff'
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 2
  },
  logoContainer: {
    width: 68,
    height: 24,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 68,
    height: 24,
    objectFit: 'contain'
  },
  companyDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  companyTh: {
    fontSize: 9.5,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 0.5,
    lineHeight: 1.1
  },
  companyEn: {
    fontSize: 7,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#0284c7',
    lineHeight: 1.05
  },
  companyAddress: {
    fontSize: 5.5,
    fontFamily: 'THSarabunNew',
    color: '#64748b',
    marginTop: 0.5,
    lineHeight: 1.05
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 0.6,
    borderColor: '#cbd5e1',
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginBottom: 3
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: 9.5,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  subTitle: {
    fontSize: 7,
    color: '#475569',
    marginTop: 0.5
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  docBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 0.6,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    marginBottom: 1
  },
  docBadgeText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#1d4ed8'
  },
  metaText: {
    fontSize: 6,
    color: '#64748b'
  },
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 2.5,
    marginBottom: 1.5
  },
  table: {
    width: '100%',
    borderWidth: 0.6,
    borderColor: '#cbd5e1',
    marginBottom: 2.5
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    borderBottomWidth: 0.6,
    borderBottomColor: '#1e3a8a'
  },
  thText: {
    paddingVertical: 1.2,
    paddingHorizontal: 1.5,
    fontSize: 5.8,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'THSarabunNew'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.4,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff'
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.4,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderTopWidth: 0.6,
    borderTopColor: '#93c5fd'
  },
  cellText: {
    paddingVertical: 1,
    paddingHorizontal: 1.5,
    fontSize: 5.8,
    color: '#1e293b'
  },
  cellTextCenter: {
    paddingVertical: 1,
    paddingHorizontal: 1,
    fontSize: 5.8,
    textAlign: 'center',
    color: '#1e293b'
  },
  cellTextRight: {
    paddingVertical: 1,
    paddingHorizontal: 1.5,
    fontSize: 5.8,
    textAlign: 'right',
    color: '#1e293b'
  },
  footer: {
    position: 'absolute',
    bottom: 6,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6,
    color: '#94a3b8',
    borderTopWidth: 0.4,
    borderTopColor: '#e2e8f0',
    paddingTop: 1.5
  }
});

export const ExecutiveAllInOneDocument = ({
  scopeName = 'ภาพรวมทั้งสิ้น 10 จังหวัด (181 สถานี)',
  budgetMetrics = { rows: [], grandBudgetSum: 0, totalStations: 181, priorityStationsSum: 0, priorityBudgetSum: 0, grandBaseTotal: 0, grandAddTotal: 0 },
  provincesData = [],
  intervalsData = [],
  stations = [],
  siteBudgets = {},
  siteBaseBudgets = {},
  budgetMap = {},
  totalStations = 181,
  totalIntervalBudget = 0,
  dateFormatted = ''
}) => {
  const printDate = dateFormatted || new Date().toLocaleDateString('th-TH');

  // Column layout for Section 1: Site-Level Customized Budget Breakdown (100%)
  const colS1 = { width: '18%' };
  const colS2 = { width: '12%', textAlign: 'right' };
  const colS3 = { width: '14%', textAlign: 'center' };
  const colS4 = { width: '18%', textAlign: 'right' };
  const colS5 = { width: '18%', textAlign: 'right' };
  const colS6 = { width: '20%', textAlign: 'right' };

  // Column layout for Section 2: Budget Matrix (100%)
  const colB1 = { width: '20%' };
  const colB2 = { width: '18%' };
  const colB3 = { width: '9%', textAlign: 'right' };
  const colB4 = { width: '8%', textAlign: 'right' };
  const colB5 = { width: '15%', textAlign: 'right' };
  const colB6 = { width: '14%', textAlign: 'right' };
  const colB7 = { width: '16%', textAlign: 'right' };

  // Column layout for Section 3: Tenure & Tower Analysis (100%)
  const colT1 = { width: '13.5%' };
  const colT2 = { width: '13.5%', textAlign: 'center' };
  const colT3 = { width: '5.5%', textAlign: 'right' };
  const colT4 = { width: '5.5%', textAlign: 'right' };
  const colT5 = { width: '5%', textAlign: 'center' };
  const colT6 = { width: '5%', textAlign: 'right' };
  const colT7 = { width: '5%', textAlign: 'right' };
  const colT8 = { width: '5%', textAlign: 'right' };
  const colT9 = { width: '5%', textAlign: 'right' };
  const colT10 = { width: '5%', textAlign: 'right' };
  const colT11 = { width: '5%', textAlign: 'right' };
  const colT12 = { width: '5%', textAlign: 'right' };
  const colT13 = { width: '22%', textAlign: 'right' };

  // Column layout for Section 4: Province Summary (100%)
  const colPProv = { width: '23%' };
  const colPStat = { width: '11%' };

  // Calculate customized sites per bracket
  const rowsWithCustomCount = (budgetMetrics.rows || []).map(r => {
    let customCount = 0;
    if (stations && stations.length > 0) {
      const bStations = stations.filter(s => (s.termKey || '') === r.bracket.key);
      customCount = bStations.filter(s => {
        const hasAdd = siteBudgets[s.id] !== undefined && siteBudgets[s.id] !== '' && Number(siteBudgets[s.id]) > 0;
        const defaultB = budgetMap[r.bracket.key] !== undefined ? Number(budgetMap[r.bracket.key]) : 20000;
        const hasBaseMod = siteBaseBudgets[s.id] !== undefined && siteBaseBudgets[s.id] !== '' && Number(siteBaseBudgets[s.id]) !== defaultB;
        return hasAdd || hasBaseMod;
      }).length;
    }
    return {
      ...r,
      customSites: customCount
    };
  });

  const totalCustomSites = rowsWithCustomCount.reduce((sum, r) => sum + r.customSites, 0);

  // Safe intervals data fallback if empty
  const safeIntervals = (intervalsData && intervalsData.length > 0)
    ? intervalsData
    : (budgetMetrics.rows || []).map(r => ({
        bucket: {
          id: `int_${r.bracket.key}`,
          label: r.bracket.name,
          termKey: r.bracket.key,
          priority: r.bracket.priority === 'เร่งด่วนระดับ 1 (วิกฤต)' ? 'เร่งด่วนระดับ 1' : r.bracket.priority,
          priColor: r.bracket.priColor || '#dc2626'
        },
        count: r.count,
        pct: r.sharePct,
        provCount: '-',
        heights: { h9: r.count, h18: 0, h30: 0 },
        types: { typeA: 0, typeB: 0, typeC: 0, typeOther: r.count },
        estBudget: r.bracketGrandTotal
      }));

  const sumH9 = safeIntervals.reduce((acc, i) => acc + (i.heights?.h9 || 0), 0);
  const sumH18 = safeIntervals.reduce((acc, i) => acc + (i.heights?.h18 || 0), 0);
  const sumH30 = safeIntervals.reduce((acc, i) => acc + (i.heights?.h30 || 0), 0);
  const sumTypeA = safeIntervals.reduce((acc, i) => acc + (i.types?.typeA || 0), 0);
  const sumTypeB = safeIntervals.reduce((acc, i) => acc + (i.types?.typeB || 0), 0);
  const sumTypeC = safeIntervals.reduce((acc, i) => acc + (i.types?.typeC || 0), 0);
  const sumTypeOther = safeIntervals.reduce((acc, i) => acc + (i.types?.typeOther || i.types?.other || 0), 0);
  const sumIntervalBudget = totalIntervalBudget || safeIntervals.reduce((acc, i) => acc + (i.estBudget || 0), 0);
  const sumStationCount = totalStations || budgetMetrics.totalStations || safeIntervals.reduce((acc, i) => acc + (i.count || 0), 0);

  return (
    <Document title={`รายงานรวมผู้บริหารแบบหน้าเดียว_${scopeName}`}>
      <Page size="A4" orientation="portrait" style={allInOneStyles.pagePortrait}>
        {/* Header Section */}
        <View style={allInOneStyles.headerSection}>
          <View style={allInOneStyles.logoContainer}>
            <Image src="/images/logo.png" style={allInOneStyles.logo} />
          </View>
          <View style={allInOneStyles.companyDetails}>
            <Text style={allInOneStyles.companyTh}>บริษัท ฟอร์ท คอร์ปอเรชั่น จำกัด (มหาชน)</Text>
            <Text style={allInOneStyles.companyEn}>FORTH CORPORATION PUBLIC COMPANY LIMITED</Text>
            <Text style={allInOneStyles.companyAddress}>1053/1 ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400 โทรศัพท์ : 02-265-6700</Text>
          </View>
        </View>

        {/* Title Banner */}
        <View style={allInOneStyles.headerBanner}>
          <View style={allInOneStyles.headerLeft}>
            <Text style={allInOneStyles.title}>รายงานรวมผู้บริหารแบบหน้าเดียว (Executive All-in-One Report)</Text>
            <Text style={allInOneStyles.subTitle}>{scopeName}</Text>
          </View>
          <View style={allInOneStyles.headerRight}>
            <View style={allInOneStyles.docBadge}>
              <Text style={allInOneStyles.docBadgeText}>EXECUTIVE ALL-IN-ONE REPORT</Text>
            </View>
            <Text style={allInOneStyles.metaText}>วันที่พิมพ์: {printDate}</Text>
          </View>
        </View>

        {/* 1. Site-level customized budget breakdown by tenure interval */}
        <Text style={allInOneStyles.sectionTitle}>• 1. งบประมาณเฉพาะไซต์แต่ละช่วงปี (Site-Level Customized Budget Breakdown)</Text>
        <View style={allInOneStyles.table} wrap={false}>
          <View style={allInOneStyles.tableHead}>
            <Text style={{ ...allInOneStyles.thText, ...colS1 }}>ช่วงวาระ</Text>
            <Text style={{ ...allInOneStyles.thText, ...colS2 }}>จำนวนสถานี</Text>
            <Text style={{ ...allInOneStyles.thText, ...colS3 }}>ไซต์ที่ปรับงบ</Text>
            <Text style={{ ...allInOneStyles.thText, ...colS4 }}>งบตั้งต้นเฉลี่ย/ไซต์</Text>
            <Text style={{ ...allInOneStyles.thText, ...colS5 }}>งบเพิ่มเติมเฉลี่ย/ไซต์</Text>
            <Text style={{ ...allInOneStyles.thText, ...colS6 }}>รวมงบปรับเพิ่มเฉพาะไซต์</Text>
          </View>

          {rowsWithCustomCount.map((row, idx) => (
            <View key={`s_row_${row.bracket.key}`} style={idx % 2 === 0 ? allInOneStyles.tableRow : allInOneStyles.tableRowAlt}>
              <Text style={{ ...allInOneStyles.cellText, ...colS1, fontWeight: 'bold' }}>{row.bracket.name}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colS2 }}>{Number(row.count).toLocaleString('th-TH')}</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colS3 }}>{row.customSites > 0 ? `${row.customSites} ไซต์` : '-'}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colS4 }}>{formatThb(row.basePerStation)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colS5 }}>{formatThb(row.addPerStation)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colS6, fontWeight: 'bold', color: row.addTotal > 0 ? '#1e40af' : '#64748b' }}>
                {formatThb(row.addTotal)}
              </Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <View style={allInOneStyles.grandTotalRow}>
            <Text style={{ ...allInOneStyles.cellText, ...colS1, fontWeight: 'bold', color: '#1e3a8a' }}>
              รวมทุกช่วงวาระ
            </Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colS2, fontWeight: 'bold', color: '#1e3a8a' }}>
              {Number(budgetMetrics.totalStations).toLocaleString('th-TH')}
            </Text>
            <Text style={{ ...allInOneStyles.cellTextCenter, ...colS3, fontWeight: 'bold', color: '#1e3a8a' }}>
              {totalCustomSites > 0 ? `${totalCustomSites} ไซต์` : '-'}
            </Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colS4, color: '#64748b' }}>-</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colS5, color: '#64748b' }}>-</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colS6, fontWeight: 'bold', color: '#1d4ed8' }}>
              {formatThb(budgetMetrics.grandAddTotal || 0)}
            </Text>
          </View>
        </View>

        {/* 2. Budget Matrix & Estimates table */}
        <Text style={allInOneStyles.sectionTitle}>• 2. ประมาณการงบประมาณรายวาระ (Budget Matrix & Estimates)</Text>
        <View style={allInOneStyles.table} wrap={false}>
          <View style={allInOneStyles.tableHead}>
            <Text style={{ ...allInOneStyles.thText, ...colB1 }}>ช่วงวาระ</Text>
            <Text style={{ ...allInOneStyles.thText, ...colB2 }}>ระดับความเร่งด่วน</Text>
            <Text style={{ ...allInOneStyles.thText, ...colB3 }}>จำนวนสถานี</Text>
            <Text style={{ ...allInOneStyles.thText, ...colB4 }}>สัดส่วน</Text>
            <Text style={{ ...allInOneStyles.thText, ...colB5 }}>งบตั้งต้นรวม</Text>
            <Text style={{ ...allInOneStyles.thText, ...colB6 }}>งบเพิ่มเติมรวม</Text>
            <Text style={{ ...allInOneStyles.thText, ...colB7 }}>งบประมาณรวม</Text>
          </View>

          {budgetMetrics.rows.map((row, idx) => (
            <View key={`b_row_${row.bracket.key}`} style={idx % 2 === 0 ? allInOneStyles.tableRow : allInOneStyles.tableRowAlt}>
              <Text style={{ ...allInOneStyles.cellText, ...colB1, fontWeight: 'bold' }}>{row.bracket.name}</Text>
              <Text style={{ ...allInOneStyles.cellText, ...colB2, fontSize: 5.8, color: row.bracket.priColor || '#dc2626' }}>
                {row.bracket.priority === 'เร่งด่วนระดับ 1 (วิกฤต)' ? 'เร่งด่วนระดับ 1' : row.bracket.priority}
              </Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colB3 }}>{Number(row.count).toLocaleString('th-TH')}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colB4 }}>{row.sharePct}%</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colB5 }}>{formatThb(row.baseTotal)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colB6 }}>{formatThb(row.addTotal)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colB7, fontWeight: 'bold', color: '#1e40af' }}>
                {formatThb(row.bracketGrandTotal)}
              </Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <View style={allInOneStyles.grandTotalRow}>
            <Text style={{ ...allInOneStyles.cellText, width: '38%', fontWeight: 'bold', color: '#1e3a8a' }}>
              รวมทั้งสิ้น (TOTAL)
            </Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colB3, fontWeight: 'bold', color: '#1e3a8a' }}>
              {Number(budgetMetrics.totalStations).toLocaleString('th-TH')}
            </Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colB4, fontWeight: 'bold', color: '#1e3a8a' }}>100%</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, width: '29%', fontSize: 5.5, color: '#475569' }}>
              รวมเฉพาะกลุ่มเร่งด่วน (&lt; 1 ถึง 5 ปี): {formatThb(budgetMetrics.priorityBudgetSum)}
            </Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colB7, fontWeight: 'bold', color: '#1d4ed8' }}>
              {formatThb(budgetMetrics.grandBudgetSum)}
            </Text>
          </View>
        </View>

        {/* 3. Tenure & Tower Analysis table */}
        <Text style={allInOneStyles.sectionTitle}>• 3. วิเคราะห์วาระคงเหลือและความสูงเสาอากาศ (Tenure & Tower Analysis)</Text>
        <View style={allInOneStyles.table} wrap={false}>
          <View style={allInOneStyles.tableHead}>
            <Text style={{ ...allInOneStyles.thText, ...colT1 }}>ช่วงเวลา (Interval)</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT2 }}>ระดับความเร่งด่วน</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT3 }}>จำนวน</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT4 }}>สัดส่วน</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT5 }}>จังหวัด</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT6 }}>เสา 9 ม.</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT7 }}>เสา 18 ม.</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT8 }}>เสา 30 ม.</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT9 }}>Type A</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT10 }}>Type B</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT11 }}>Type C</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT12 }}>อื่นๆ</Text>
            <Text style={{ ...allInOneStyles.thText, ...colT13 }}>ประมาณการงบรวม</Text>
          </View>

          {safeIntervals.map((item, idx) => (
            <View key={`int_row_${item.bucket.id || idx}`} style={idx % 2 === 0 ? allInOneStyles.tableRow : allInOneStyles.tableRowAlt}>
              <Text style={{ ...allInOneStyles.cellText, ...colT1, fontWeight: 'bold' }}>{item.bucket.label}</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colT2, fontSize: 5.8, color: item.bucket.priColor || '#b91c1c' }}>
                {item.bucket.priority}
              </Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT3 }}>{Number(item.count).toLocaleString('th-TH')}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT4 }}>{item.pct}%</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colT5 }}>{typeof item.provCount === 'number' ? Number(item.provCount) : item.provCount}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT6 }}>{Number(item.heights?.h9 || 0)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT7 }}>{Number(item.heights?.h18 || 0)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT8 }}>{Number(item.heights?.h30 || 0)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT9 }}>{Number(item.types?.typeA || 0)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT10 }}>{Number(item.types?.typeB || 0)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT11 }}>{Number(item.types?.typeC || 0)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT12 }}>{Number(item.types?.typeOther || item.types?.other || 0)}</Text>
              <Text style={{ ...allInOneStyles.cellTextRight, ...colT13, fontWeight: 'bold', color: '#1e40af' }}>
                {formatThb(item.estBudget)}
              </Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <View style={allInOneStyles.grandTotalRow}>
            <Text style={{ ...allInOneStyles.cellText, ...colT1, fontWeight: 'bold', color: '#1e3a8a' }}>
              รวมทุกช่วงเวลา
            </Text>
            <Text style={{ ...allInOneStyles.cellTextCenter, ...colT2 }}>-</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT3, fontWeight: 'bold', color: '#1e3a8a' }}>
              {Number(sumStationCount).toLocaleString('th-TH')}
            </Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT4, fontWeight: 'bold', color: '#1e3a8a' }}>100%</Text>
            <Text style={{ ...allInOneStyles.cellTextCenter, ...colT5 }}>-</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT6, fontWeight: 'bold' }}>{Number(sumH9)}</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT7, fontWeight: 'bold' }}>{Number(sumH18)}</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT8, fontWeight: 'bold' }}>{Number(sumH30)}</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT9, fontWeight: 'bold' }}>{Number(sumTypeA)}</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT10, fontWeight: 'bold' }}>{Number(sumTypeB)}</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT11, fontWeight: 'bold' }}>{Number(sumTypeC)}</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT12, fontWeight: 'bold' }}>{Number(sumTypeOther)}</Text>
            <Text style={{ ...allInOneStyles.cellTextRight, ...colT13, fontWeight: 'bold', color: '#1d4ed8' }}>
              {formatThb(sumIntervalBudget)}
            </Text>
          </View>
        </View>

        {/* 4. Provincial tenure summary table */}
        <Text style={allInOneStyles.sectionTitle}>• 4. สรุปข้อมูลวาระคงเหลือแยกรายจังหวัด (Provincial Tenure Summary)</Text>
        <View style={allInOneStyles.table} wrap={false}>
          <View style={allInOneStyles.tableHead}>
            <Text style={{ ...allInOneStyles.thText, ...colPProv, textAlign: 'left' }}>จังหวัด</Text>
            <Text style={{ ...allInOneStyles.thText, ...colPStat, textAlign: 'center' }}>ทั้งหมด</Text>
            <Text style={{ ...allInOneStyles.thText, ...colPStat, textAlign: 'center' }}>&lt; 1 ปี</Text>
            <Text style={{ ...allInOneStyles.thText, ...colPStat, textAlign: 'center' }}>1 - 2 ปี</Text>
            <Text style={{ ...allInOneStyles.thText, ...colPStat, textAlign: 'center' }}>2 - 3 ปี</Text>
            <Text style={{ ...allInOneStyles.thText, ...colPStat, textAlign: 'center' }}>3 - 4 ปี</Text>
            <Text style={{ ...allInOneStyles.thText, ...colPStat, textAlign: 'center' }}>4 - 5 ปี</Text>
            <Text style={{ ...allInOneStyles.thText, ...colPStat, textAlign: 'center' }}>&gt; 5 ปี</Text>
          </View>

          {provincesData.map((prov, idx) => (
            <View key={`prov_${prov.province || idx}`} style={idx % 2 === 0 ? allInOneStyles.tableRow : allInOneStyles.tableRowAlt}>
              <Text style={{ ...allInOneStyles.cellText, ...colPProv, fontWeight: 'bold' }}>{prov.province}</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colPStat, fontWeight: 'bold' }}>{prov.total}</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colPStat, color: '#dc2626' }}>{prov.lt1 || 0}</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colPStat, color: '#ea580c' }}>{prov.y1 || 0}</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colPStat, color: '#d97706' }}>{prov.y2 || 0}</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colPStat, color: '#16a34a' }}>{prov.y3 || 0}</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colPStat, color: '#2563eb' }}>{prov.y4 || 0}</Text>
              <Text style={{ ...allInOneStyles.cellTextCenter, ...colPStat, color: '#7c3aed' }}>{prov.gt5 || 0}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={allInOneStyles.footer} fixed>
          <Text>Forth Corporation Public Company Limited</Text>
          <Text render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
