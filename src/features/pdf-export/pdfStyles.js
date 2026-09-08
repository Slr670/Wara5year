import { StyleSheet, Font } from '@react-pdf/renderer';

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
  console.warn('PDF Font Registration Note:', e);
}

export const styles = StyleSheet.create({
  pagePortrait: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 28,
    fontFamily: 'THSarabunNew',
    fontSize: 9.5,
    color: '#0f172a',
    backgroundColor: '#ffffff'
  },
  pageLandscape: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    fontFamily: 'THSarabunNew',
    fontSize: 8.5,
    color: '#0f172a',
    backgroundColor: '#ffffff'
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 6
  },
  logo: {
    width: 44,
    height: 44,
    marginRight: 10
  },
  companyDetails: {
    flex: 1
  },
  companyTh: {
    fontSize: 12,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#1e3a8a',
    lineHeight: 1.2
  },
  companyEn: {
    fontSize: 8,
    fontFamily: 'THSarabunNew',
    color: '#475569',
    lineHeight: 1.1
  },
  companyAddress: {
    fontSize: 7.5,
    fontFamily: 'THSarabunNew',
    color: '#64748b',
    lineHeight: 1.1
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 6,
    marginBottom: 8
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: 13,
    fontFamily: 'THSarabunNew',
    fontWeight: 'bold',
    color: '#1e3a8a'
  },
  subTitle: {
    fontSize: 9,
    color: '#475569',
    marginTop: 1
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  docBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    marginBottom: 2
  },
  docBadgeText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#1d4ed8'
  },
  metaText: {
    fontSize: 7.5,
    color: '#64748b'
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 6,
    marginBottom: 4
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 6
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a8a'
  },
  thText: {
    paddingVertical: 3.5,
    paddingHorizontal: 3,
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'THSarabunNew'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff'
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  grandTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderTopWidth: 1,
    borderTopColor: '#93c5fd'
  },
  cellText: {
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    fontSize: 7.5,
    color: '#1e293b'
  },
  cellTextCenter: {
    paddingVertical: 2.5,
    paddingHorizontal: 2,
    fontSize: 7.5,
    textAlign: 'center',
    color: '#1e293b'
  },
  cellTextRight: {
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    fontSize: 7.5,
    textAlign: 'right',
    color: '#1e293b'
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#94a3b8',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 3
  }
});
