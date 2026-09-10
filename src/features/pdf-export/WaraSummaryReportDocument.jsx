import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { formatThb } from '../../utils/formatters.js';

// Dedicated single-page optimized styles for Executive Report
const summaryStyles = StyleSheet.create({
  pagePortrait: {
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    fontFamily: 'THSarabunNew',
    fontSize: 7.5,
    color: '#0f172a',
    backgroundColor: '#ffffff'
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    borderBottomWidth: 1.2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 3
  },
  logoContainer: {
    width: 75,
    height: 28,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 75,
    height: 28,
    objectFit: 'contain'
  },
  companyDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  companyTh: {
    fontSize: 10.5,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 0.5,
    lineHeight: 1.1
  },
  companyEn: {
    fontSize: 7.5,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#0284c7',
    lineHeight: 1.05
  },
  companyAddress: {
    fontSize: 6,
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
    borderWidth: 0.8,
    borderColor: '#cbd5e1',
    borderRadius: 3,
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    marginBottom: 4
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: 10.5,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  subTitle: {
    fontSize: 7.5,
    color: '#475569',
    marginTop: 0.5
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  docBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 2,
    borderWidth: 0.8,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    marginBottom: 1
  },
  docBadgeText: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#1d4ed8'
  },
  metaText: {
    fontSize: 6.5,
    color: '#64748b'
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 3,
    marginBottom: 2
  },
  table: {
    width: '100%',
    borderWidth: 0.8,
    borderColor: '#cbd5e1',
    marginBottom: 3
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    borderBottomWidth: 0.8,
    borderBottomColor: '#1e3a8a'
  },
  thText: {
    paddingVertical: 1.5,
    paddingHorizontal: 1.5,
    fontSize: 6.2,
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
    borderTopWidth: 0.8,
    borderTopColor: '#93c5fd'
  },
  cellText: {
    paddingVertical: 1.2,
    paddingHorizontal: 1.5,
    fontSize: 6.2,
    color: '#1e293b'
  },
  cellTextCenter: {
    paddingVertical: 1.2,
    paddingHorizontal: 1,
    fontSize: 6.2,
    textAlign: 'center',
    color: '#1e293b'
  },
  cellTextRight: {
    paddingVertical: 1.2,
    paddingHorizontal: 1.5,
    fontSize: 6.2,
    textAlign: 'right',
    color: '#1e293b'
  },
  footer: {
    position: 'absolute',
    bottom: 8,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#94a3b8',
    borderTopWidth: 0.4,
    borderTopColor: '#e2e8f0',
    paddingTop: 2
  }
});

export const WaraSummaryReportDocument = ({
  scopeName = 'ภาพรวมทั้งสิ้น 10 จังหวัด (181 สถานี)',
  budgetMetrics = { rows: [], grandBudgetSum: 0, totalStations: 181, priorityStationsSum: 0, priorityBudgetSum: 0 },
  provincesData = [],
  intervalsData = [],
  totalStations = 181,
  totalIntervalBudget = 0,
  dateFormatted = ''
}) => {
  const printDate = dateFormatted || new Date().toLocaleDateString('th-TH');

  // Column layout for Table 1: Budget Matrix (Sum = 100%)
  const colB1 = { width: '20%' };
  const colB2 = { width: '18%' };
  const colB3 = { width: '9%', textAlign: 'right' };
  const colB4 = { width: '8%', textAlign: 'right' };
  const colB5 = { width: '15%', textAlign: 'right' };
  const colB6 = { width: '14%', textAlign: 'right' };
  const colB7 = { width: '16%', textAlign: 'right' };

  // Column layout for Table 2: Tenure & Tower Analysis (Sum = 100%)
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

  // Column layout for Table 3: Province Summary (Sum = 100%)
  const colPProv = { width: '23%' };
  const colPStat = { width: '11%' };

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
    <Document title={`รายงานสรุปภาพรวมวาระเจ้าหน้าที่รัฐ_${scopeName}`}>
      <Page size="A4" orientation="portrait" style={summaryStyles.pagePortrait}>
        {/* Header Section */}
        <View style={summaryStyles.headerSection}>
          <View style={summaryStyles.logoContainer}>
            <Image src="/images/logo.png" style={summaryStyles.logo} />
          </View>
          <View style={summaryStyles.companyDetails}>
            <Text style={summaryStyles.companyTh}>บริษัท ฟอร์ท คอร์ปอเรชั่น จำกัด (มหาชน)</Text>
            <Text style={summaryStyles.companyEn}>FORTH CORPORATION PUBLIC COMPANY LIMITED</Text>
            <Text style={summaryStyles.companyAddress}>1053/1 ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพมหานคร 10400 โทรศัพท์ : 02-265-6700</Text>
          </View>
        </View>

        {/* Title Banner */}
        <View style={summaryStyles.headerBanner}>
          <View style={summaryStyles.headerLeft}>
            <Text style={summaryStyles.title}>รายงานสรุปภาพรวมวาระเจ้าหน้าที่รัฐ กรมการปกครอง</Text>
            <Text style={summaryStyles.subTitle}>{scopeName}</Text>
          </View>
          <View style={summaryStyles.headerRight}>
            <View style={summaryStyles.docBadge}>
              <Text style={summaryStyles.docBadgeText}>EXECUTIVE TENURE & BUDGET REPORT</Text>
            </View>
            <Text style={summaryStyles.metaText}>วันที่พิมพ์: {printDate}</Text>
          </View>
        </View>

        {/* Table 1: Budget Matrix */}
        <Text style={summaryStyles.sectionTitle}>• ประมาณการงบประมาณรายวาระ (Budget Matrix)</Text>
        <View style={summaryStyles.table} wrap={false}>
          <View style={summaryStyles.tableHead}>
            <Text style={{ ...summaryStyles.thText, ...colB1 }}>ช่วงวาระ</Text>
            <Text style={{ ...summaryStyles.thText, ...colB2 }}>ระดับความเร่งด่วน</Text>
            <Text style={{ ...summaryStyles.thText, ...colB3 }}>จำนวนสถานี</Text>
            <Text style={{ ...summaryStyles.thText, ...colB4 }}>สัดส่วน</Text>
            <Text style={{ ...summaryStyles.thText, ...colB5 }}>งบตั้งต้นรวม</Text>
            <Text style={{ ...summaryStyles.thText, ...colB6 }}>งบเพิ่มเติมรวม</Text>
            <Text style={{ ...summaryStyles.thText, ...colB7 }}>งบประมาณรวม</Text>
          </View>

          {budgetMetrics.rows.map((row, idx) => (
            <View key={`b_row_${row.bracket.key}`} style={idx % 2 === 0 ? summaryStyles.tableRow : summaryStyles.tableRowAlt}>
              <Text style={{ ...summaryStyles.cellText, ...colB1, fontWeight: 'bold' }}>{row.bracket.name}</Text>
              <Text style={{ ...summaryStyles.cellText, ...colB2, fontSize: 6.2, color: row.bracket.priColor || '#dc2626' }}>
                {row.bracket.priority === 'เร่งด่วนระดับ 1 (วิกฤต)' ? 'เร่งด่วนระดับ 1' : row.bracket.priority}
              </Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colB3 }}>{Number(row.count).toLocaleString('th-TH')}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colB4 }}>{row.sharePct}%</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colB5 }}>{formatThb(row.baseTotal)}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colB6 }}>{formatThb(row.addTotal)}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colB7, fontWeight: 'bold', color: '#1e40af' }}>
                {formatThb(row.bracketGrandTotal)}
              </Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <View style={summaryStyles.grandTotalRow}>
            <Text style={{ ...summaryStyles.cellText, width: '38%', fontWeight: 'bold', color: '#1e3a8a' }}>
              รวมทั้งสิ้น (TOTAL)
            </Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colB3, fontWeight: 'bold', color: '#1e3a8a' }}>
              {Number(budgetMetrics.totalStations).toLocaleString('th-TH')}
            </Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colB4, fontWeight: 'bold', color: '#1e3a8a' }}>100%</Text>
            <Text style={{ ...summaryStyles.cellTextRight, width: '29%', fontSize: 6, color: '#475569' }}>
              รวมเฉพาะกลุ่มเร่งด่วน (&lt; 1 ถึง 5 ปี): {formatThb(budgetMetrics.priorityBudgetSum)}
            </Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colB7, fontWeight: 'bold', color: '#1d4ed8' }}>
              {formatThb(budgetMetrics.grandBudgetSum)}
            </Text>
          </View>
        </View>

        {/* Table 2: Tenure & Tower Analysis */}
        <Text style={summaryStyles.sectionTitle}>• ตารางวิเคราะห์วาระคงเหลือและความสูงเสาอากาศ (Tenure & Tower Analysis)</Text>
        <View style={summaryStyles.table} wrap={false}>
          <View style={summaryStyles.tableHead}>
            <Text style={{ ...summaryStyles.thText, ...colT1 }}>ช่วงเวลา (Interval)</Text>
            <Text style={{ ...summaryStyles.thText, ...colT2 }}>ระดับความเร่งด่วน</Text>
            <Text style={{ ...summaryStyles.thText, ...colT3 }}>จำนวน</Text>
            <Text style={{ ...summaryStyles.thText, ...colT4 }}>สัดส่วน</Text>
            <Text style={{ ...summaryStyles.thText, ...colT5 }}>จังหวัด</Text>
            <Text style={{ ...summaryStyles.thText, ...colT6 }}>เสา 9 ม.</Text>
            <Text style={{ ...summaryStyles.thText, ...colT7 }}>เสา 18 ม.</Text>
            <Text style={{ ...summaryStyles.thText, ...colT8 }}>เสา 30 ม.</Text>
            <Text style={{ ...summaryStyles.thText, ...colT9 }}>Type A</Text>
            <Text style={{ ...summaryStyles.thText, ...colT10 }}>Type B</Text>
            <Text style={{ ...summaryStyles.thText, ...colT11 }}>Type C</Text>
            <Text style={{ ...summaryStyles.thText, ...colT12 }}>อื่นๆ</Text>
            <Text style={{ ...summaryStyles.thText, ...colT13 }}>ประมาณการงบรวม</Text>
          </View>

          {safeIntervals.map((item, idx) => (
            <View key={`int_row_${item.bucket.id || idx}`} style={idx % 2 === 0 ? summaryStyles.tableRow : summaryStyles.tableRowAlt}>
              <Text style={{ ...summaryStyles.cellText, ...colT1, fontWeight: 'bold' }}>{item.bucket.label}</Text>
              <Text style={{ ...summaryStyles.cellTextCenter, ...colT2, fontSize: 6.2, color: item.bucket.priColor || '#b91c1c' }}>
                {item.bucket.priority}
              </Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT3 }}>{Number(item.count).toLocaleString('th-TH')}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT4 }}>{item.pct}%</Text>
              <Text style={{ ...summaryStyles.cellTextCenter, ...colT5 }}>{typeof item.provCount === 'number' ? Number(item.provCount) : item.provCount}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT6 }}>{Number(item.heights?.h9 || 0)}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT7 }}>{Number(item.heights?.h18 || 0)}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT8 }}>{Number(item.heights?.h30 || 0)}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT9 }}>{Number(item.types?.typeA || 0)}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT10 }}>{Number(item.types?.typeB || 0)}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT11 }}>{Number(item.types?.typeC || 0)}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT12 }}>{Number(item.types?.typeOther || item.types?.other || 0)}</Text>
              <Text style={{ ...summaryStyles.cellTextRight, ...colT13, fontWeight: 'bold', color: '#1e40af' }}>
                {formatThb(item.estBudget)}
              </Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <View style={summaryStyles.grandTotalRow}>
            <Text style={{ ...summaryStyles.cellText, ...colT1, fontWeight: 'bold', color: '#1e3a8a' }}>
              รวมทุกช่วงเวลา
            </Text>
            <Text style={{ ...summaryStyles.cellTextCenter, ...colT2 }}>-</Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT3, fontWeight: 'bold', color: '#1e3a8a' }}>
              {Number(sumStationCount).toLocaleString('th-TH')}
            </Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT4, fontWeight: 'bold', color: '#1e3a8a' }}>100%</Text>
            <Text style={{ ...summaryStyles.cellTextCenter, ...colT5 }}>-</Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT6, fontWeight: 'bold' }}>{Number(sumH9)}</Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT7, fontWeight: 'bold' }}>{Number(sumH18)}</Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT8, fontWeight: 'bold' }}>{Number(sumH30)}</Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT9, fontWeight: 'bold' }}>{Number(sumTypeA)}</Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT10, fontWeight: 'bold' }}>{Number(sumTypeB)}</Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT11, fontWeight: 'bold' }}>{Number(sumTypeC)}</Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT12, fontWeight: 'bold' }}>{Number(sumTypeOther)}</Text>
            <Text style={{ ...summaryStyles.cellTextRight, ...colT13, fontWeight: 'bold', color: '#1d4ed8' }}>
              {formatThb(sumIntervalBudget)}
            </Text>
          </View>
        </View>

        {/* Table 3: Province Summary */}
        <Text style={summaryStyles.sectionTitle}>• ตารางสรุปข้อมูลวาระคงเหลือแยกรายจังหวัด</Text>
        <View style={summaryStyles.table} wrap={false}>
          <View style={summaryStyles.tableHead}>
            <Text style={{ ...summaryStyles.thText, ...colPProv, textAlign: 'left' }}>จังหวัด</Text>
            <Text style={{ ...summaryStyles.thText, ...colPStat, textAlign: 'center' }}>ทั้งหมด</Text>
            <Text style={{ ...summaryStyles.thText, ...colPStat, textAlign: 'center' }}>&lt; 1 ปี</Text>
            <Text style={{ ...summaryStyles.thText, ...colPStat, textAlign: 'center' }}>1 - 2 ปี</Text>
            <Text style={{ ...summaryStyles.thText, ...colPStat, textAlign: 'center' }}>2 - 3 ปี</Text>
            <Text style={{ ...summaryStyles.thText, ...colPStat, textAlign: 'center' }}>3 - 4 ปี</Text>
            <Text style={{ ...summaryStyles.thText, ...colPStat, textAlign: 'center' }}>4 - 5 ปี</Text>
            <Text style={{ ...summaryStyles.thText, ...colPStat, textAlign: 'center' }}>&gt; 5 ปี</Text>
          </View>

          {provincesData.map((prov, idx) => (
            <View key={`prov_${prov.province || idx}`} style={idx % 2 === 0 ? summaryStyles.tableRow : summaryStyles.tableRowAlt}>
              <Text style={{ ...summaryStyles.cellText, ...colPProv, fontWeight: 'bold' }}>{prov.province}</Text>
              <Text style={{ ...summaryStyles.cellTextCenter, ...colPStat, fontWeight: 'bold' }}>{prov.total}</Text>
              <Text style={{ ...summaryStyles.cellTextCenter, ...colPStat, color: '#dc2626' }}>{prov.lt1 || 0}</Text>
              <Text style={{ ...summaryStyles.cellTextCenter, ...colPStat, color: '#ea580c' }}>{prov.y1 || 0}</Text>
              <Text style={{ ...summaryStyles.cellTextCenter, ...colPStat, color: '#d97706' }}>{prov.y2 || 0}</Text>
              <Text style={{ ...summaryStyles.cellTextCenter, ...colPStat, color: '#16a34a' }}>{prov.y3 || 0}</Text>
              <Text style={{ ...summaryStyles.cellTextCenter, ...colPStat, color: '#2563eb' }}>{prov.y4 || 0}</Text>
              <Text style={{ ...summaryStyles.cellTextCenter, ...colPStat, color: '#7c3aed' }}>{prov.gt5 || 0}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={summaryStyles.footer} fixed>
          <Text>Forth Corporation Public Company Limited</Text>
          <Text render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
