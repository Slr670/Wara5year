import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { styles } from './pdfStyles.js';
import { formatThb } from '../../utils/formatters.js';
import { normalizeThai } from '../../utils/thaiFontHelper.js';
import { APP_VERSION } from '../../config/app.config.js';

export const WaraSummaryReportDocument = ({
  scopeName = 'ภาพรวมทั้งสิ้น 14 จังหวัด (181 สถานี)',
  budgetMetrics = { rows: [], grandBudgetSum: 0, totalStations: 181, priorityStationsSum: 0, priorityBudgetSum: 0 },
  provincesData = [],
  dateFormatted = ''
}) => {
  const printDate = dateFormatted || new Date().toLocaleDateString('th-TH');

  const colB1 = { width: '22%' };
  const colB2 = { width: '20%' };
  const colB3 = { width: '10%', textAlign: 'right' };
  const colB4 = { width: '9%', textAlign: 'right' };
  const colB5 = { width: '13%', textAlign: 'right' };
  const colB6 = { width: '12%', textAlign: 'right' };
  const colB7 = { width: '14%', textAlign: 'right' };

  const colPProv = { width: '23%' };
  const colPStat = { width: '11%' };

  return (
    <Document title={`รายงานสรุปภาพรวมวาระเจ้าหน้าที่รัฐ_${scopeName}`}>
      <Page size="A4" orientation="portrait" style={styles.pagePortrait}>
        {/* Header Section */}
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
            <Text style={styles.title}>รายงานสรุปภาพรวมวาระเจ้าหน้าที่รัฐ กรมการปกครอง</Text>
            <Text style={styles.subTitle}>ขอบเขตการประมวลผล: {scopeName}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.docBadge}>
              <Text style={styles.docBadgeText}>EXECUTIVE TENURE & BUDGET REPORT</Text>
            </View>
            <Text style={styles.metaText}>วันที่พิมพ์: {printDate}</Text>
          </View>
        </View>

        {/* Table 1: Budget Matrix */}
        <Text style={styles.sectionTitle}>• ประมาณการงบประมาณรายวาระ (Budget Matrix)</Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={{ ...styles.thText, ...colB1 }}>ช่วงวาระ</Text>
            <Text style={{ ...styles.thText, ...colB2 }}>ระดับความเร่งด่วน</Text>
            <Text style={{ ...styles.thText, ...colB3 }}>จำนวนสถานี</Text>
            <Text style={{ ...styles.thText, ...colB4 }}>สัดส่วน</Text>
            <Text style={{ ...styles.thText, ...colB5 }}>งบพื้นฐาน/แห่ง</Text>
            <Text style={{ ...styles.thText, ...colB6 }}>ปรับเพิ่มส่วนกลาง</Text>
            <Text style={{ ...styles.thText, ...colB7 }}>งบประมาณรวม</Text>
          </View>

          {budgetMetrics.rows.map((row, idx) => (
            <View key={`b_row_${row.bracket.key}`} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={{ ...styles.cellText, ...colB1, fontWeight: 'bold' }}>{row.bracket.name}</Text>
              <Text style={{ ...styles.cellText, ...colB2, fontSize: 7, color: row.bracket.priColor || '#dc2626' }}>
                {row.bracket.priority}
              </Text>
              <Text style={{ ...styles.cellTextRight, ...colB3 }}>{Number(row.count).toLocaleString('th-TH')}</Text>
              <Text style={{ ...styles.cellTextRight, ...colB4 }}>{row.sharePct}%</Text>
              <Text style={{ ...styles.cellTextRight, ...colB5 }}>{formatThb(row.basePerStation)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colB6 }}>{formatThb(row.addPerStation)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colB7, fontWeight: 'bold', color: '#1e40af' }}>
                {formatThb(row.bracketGrandTotal)}
              </Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <View style={styles.grandTotalRow}>
            <Text style={{ ...styles.cellText, width: '42%', fontWeight: 'bold', color: '#1e3a8a' }}>
              รวมทั้งสิ้น (TOTAL)
            </Text>
            <Text style={{ ...styles.cellTextRight, ...colB3, fontWeight: 'bold', color: '#1e3a8a' }}>
              {Number(budgetMetrics.totalStations).toLocaleString('th-TH')}
            </Text>
            <Text style={{ ...styles.cellTextRight, ...colB4, fontWeight: 'bold', color: '#1e3a8a' }}>100%</Text>
            <Text style={{ ...styles.cellTextRight, width: '25%', fontSize: 7, color: '#475569' }}>
              รวมเฉพาะกลุ่มเร่งด่วน (&lt; 1 ถึง 5 ปี): {formatThb(budgetMetrics.priorityBudgetSum)}
            </Text>
            <Text style={{ ...styles.cellTextRight, ...colB7, fontWeight: 'bold', color: '#1d4ed8' }}>
              {formatThb(budgetMetrics.grandBudgetSum)}
            </Text>
          </View>
        </View>

        {/* Table 2: Province Summary */}
        <Text style={styles.sectionTitle}>• ตารางสรุปข้อมูลวาระคงเหลือแยกรายจังหวัด</Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={{ ...styles.thText, ...colPProv, textAlign: 'left' }}>จังหวัด</Text>
            <Text style={{ ...styles.thText, ...colPStat, textAlign: 'center' }}>ทั้งหมด</Text>
            <Text style={{ ...styles.thText, ...colPStat, textAlign: 'center' }}>&lt; 1 ปี</Text>
            <Text style={{ ...styles.thText, ...colPStat, textAlign: 'center' }}>1 - 2 ปี</Text>
            <Text style={{ ...styles.thText, ...colPStat, textAlign: 'center' }}>2 - 3 ปี</Text>
            <Text style={{ ...styles.thText, ...colPStat, textAlign: 'center' }}>3 - 4 ปี</Text>
            <Text style={{ ...styles.thText, ...colPStat, textAlign: 'center' }}>4 - 5 ปี</Text>
            <Text style={{ ...styles.thText, ...colPStat, textAlign: 'center' }}>&gt; 5 ปี</Text>
          </View>

          {provincesData.map((prov, idx) => (
            <View key={`prov_${prov.province || idx}`} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={{ ...styles.cellText, ...colPProv, fontWeight: 'bold' }}>{prov.province}</Text>
              <Text style={{ ...styles.cellTextCenter, ...colPStat, fontWeight: 'bold' }}>{prov.total}</Text>
              <Text style={{ ...styles.cellTextCenter, ...colPStat, color: '#dc2626' }}>{prov.lt1 || 0}</Text>
              <Text style={{ ...styles.cellTextCenter, ...colPStat, color: '#ea580c' }}>{prov.y1 || 0}</Text>
              <Text style={{ ...styles.cellTextCenter, ...colPStat, color: '#d97706' }}>{prov.y2 || 0}</Text>
              <Text style={{ ...styles.cellTextCenter, ...colPStat, color: '#16a34a' }}>{prov.y3 || 0}</Text>
              <Text style={{ ...styles.cellTextCenter, ...colPStat, color: '#2563eb' }}>{prov.y4 || 0}</Text>
              <Text style={{ ...styles.cellTextCenter, ...colPStat, color: '#7c3aed' }}>{prov.gt5 || 0}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Wara Dashboard {APP_VERSION} — Forth Corporation Public Company Limited</Text>
          <Text render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
