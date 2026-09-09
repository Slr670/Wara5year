import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { styles } from './pdfStyles.js';
import { formatThb } from '../../utils/formatters.js';
import { APP_VERSION } from '../../config/app.config.js';

export const TenureIntervalAnalysisDocument = ({
  scopeName = 'ภาพรวมทุกช่วงเวลา (181 สถานี)',
  intervalsData = [],
  totalStations = 181,
  totalBudget = 0,
  dateFormatted = ''
}) => {
  const printDate = dateFormatted || new Date().toLocaleDateString('th-TH');

  const colT1 = { width: '14%' };
  const colT2 = { width: '11%', textAlign: 'center' };
  const colT3 = { width: '7%', textAlign: 'right' };
  const colT4 = { width: '5%', textAlign: 'right' };
  const colT5 = { width: '6%', textAlign: 'center' };
  const colT6 = { width: '6%', textAlign: 'right' };
  const colT7 = { width: '6%', textAlign: 'right' };
  const colT8 = { width: '6%', textAlign: 'right' };
  const colT9 = { width: '6%', textAlign: 'right' };
  const colT10 = { width: '6%', textAlign: 'right' };
  const colT11 = { width: '6%', textAlign: 'right' };
  const colT12 = { width: '6%', textAlign: 'right' };
  const colT13 = { width: '15%', textAlign: 'right' };

  return (
    <Document title={`รายงานวิเคราะห์วาระคงเหลือและความสูงเสาอากาศ_${scopeName}`}>
      <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image src="/images/logo.png" style={styles.logo} />
          </View>
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
            <Text style={{ ...styles.thText, ...colT12 }}>อื่นๆ</Text>
            <Text style={{ ...styles.thText, ...colT13 }}>ประมาณการงบรวม</Text>
          </View>

          {intervalsData.map((item, idx) => (
            <View key={`int_${item.bucket.id || idx}`} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt} wrap={false}>
              <Text style={{ ...styles.cellText, ...colT1, fontWeight: 'bold' }}>{item.bucket.label}</Text>
              <Text style={{ ...styles.cellTextCenter, ...colT2, fontSize: 7, color: '#b91c1c' }}>{item.bucket.priority}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT3, fontWeight: 'bold' }}>{Number(item.count).toLocaleString('th-TH')} สถานี</Text>
              <Text style={{ ...styles.cellTextRight, ...colT4, color: '#475569' }}>{item.pct}%</Text>
              <Text style={{ ...styles.cellTextCenter, ...colT5 }}>{Number(item.provCount)} จว.</Text>
              <Text style={{ ...styles.cellTextRight, ...colT6 }}>{Number(item.heights.h9)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT7 }}>{Number(item.heights.h18)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT8 }}>{Number(item.heights.h30)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT9 }}>{Number(item.types.typeA)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT10 }}>{Number(item.types.typeB)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT11 }}>{Number(item.types.typeC)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT12 }}>{Number(item.types.typeOther || item.types.other || 0)}</Text>
              <Text style={{ ...styles.cellTextRight, ...colT13, fontWeight: 'bold', color: '#1e40af' }}>
                {formatThb(item.estBudget)}
              </Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <View style={styles.grandTotalRow} wrap={false}>
            <Text style={{ ...styles.cellText, width: '25%', fontWeight: 'bold', color: '#1e3a8a' }}>
              รวมทุกช่วงเวลาที่ประมวลผล
            </Text>
            <Text style={{ ...styles.cellTextRight, ...colT3, fontWeight: 'bold', color: '#1e3a8a' }}>
              {Number(totalStations).toLocaleString('th-TH')} สถานี
            </Text>
            <Text style={{ ...styles.cellTextRight, ...colT4, fontWeight: 'bold', color: '#1e3a8a' }}>100%</Text>
            <Text style={{ ...styles.cellText, width: '48%', fontSize: 7, color: '#475569', paddingLeft: 8 }}>
              วิเคราะห์ครอบคลุมเสาทุกความสูง (9m, 18m, 30m) และโครงสร้าง Typical Type A, B, C และ อื่นๆ/พิเศษ
            </Text>
            <Text style={{ ...styles.cellTextRight, ...colT13, fontWeight: 'bold', color: '#1d4ed8' }}>
              {formatThb(totalBudget)}
            </Text>
          </View>
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
