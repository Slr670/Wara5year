import defaultStations from '../../data/defaultStations.json';
import coordinatesMap from '../../data/coordinates.json';
import villageTowerMap from '../../data/villageTowerMapping.json';
import { getTermKey } from '../../utils/calculations.js';
import { APP_CONFIG } from '../../config/app.config.js';

export function parseCSV(text) {
  const lines = text.replace(/\r/g, '').trim().split('\n');
  return lines.map(line => {
    const row = [];
    let inQuotes = false;
    let cell = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        row.push(cell.trim().replace(/^"|"$/g, ''));
        cell = '';
      } else {
        cell += c;
      }
    }
    row.push(cell.trim().replace(/^"|"$/g, ''));
    return row;
  });
}

export function normalizeSheetUrl(url) {
  if (!url) return '';
  url = url.trim();
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '42783416';
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
  }
  return url;
}

/**
 * Builds lookup maps for Column L remarks/updates
 * matching by TOR index (ลำดับ TOR) and village name (หมู่บ้าน)
 * @param {Array} records - Array of raw CSV rows or station objects
 * @returns {Object} { byTorIndex: Record<string, string>, byVillage: Record<string, string> }
 */
export function buildRemarksMap(records = []) {
  const map = {
    byTorIndex: {},
    byVillage: {}
  };

  if (!Array.isArray(records)) return map;

  for (const item of records) {
    if (!item) continue;

    if (Array.isArray(item)) {
      const torId = String(item[0] || '').trim();
      const village = String(item[1] || '').trim();
      const remark = String(item[11] || '').trim();

      if (remark) {
        if (torId) map.byTorIndex[torId] = remark;
        if (village) map.byVillage[village] = remark;
      }
    } else {
      const torId = String(item.id || item.torIndex || '').trim();
      const village = String(item.village || item.villageName || '').trim();
      const remark = String(item.remark || item.update || item.notes || item.columnL || '').trim();

      if (remark) {
        if (torId) map.byTorIndex[torId] = remark;
        if (village) map.byVillage[village] = remark;
      }
    }
  }

  return map;
}

/**
 * Resolves remark/update text for a station by matching village name or TOR index
 * @param {Object} station
 * @param {Object|null} remarksMap
 * @returns {string} remark text or empty string if blank
 */
export function getStationRemark(station, remarksMap = null) {
  if (!station) return '';

  // 1. Direct property already ingested on station
  const direct = (station.remark || station.update || station.notes || station.columnL || '').trim();
  if (direct) return direct;

  // 2. Lookup via remarksMap by TOR index or village name
  if (remarksMap) {
    const torId = String(station.id ?? '').trim();
    const village = String(station.village ?? '').trim();

    if (torId) {
      if (remarksMap.byTorIndex && remarksMap.byTorIndex[torId]) {
        return String(remarksMap.byTorIndex[torId]).trim();
      }
      if (remarksMap[torId] !== undefined) {
        return String(remarksMap[torId]).trim();
      }
    }

    if (village) {
      if (remarksMap.byVillage && remarksMap.byVillage[village]) {
        return String(remarksMap.byVillage[village]).trim();
      }
      if (remarksMap[village] !== undefined) {
        return String(remarksMap[village]).trim();
      }
      const norm = village.replace(/\s+/g, ' ');
      if (remarksMap.byVillage && remarksMap.byVillage[norm]) {
        return String(remarksMap.byVillage[norm]).trim();
      }
      if (remarksMap[norm] !== undefined) {
        return String(remarksMap[norm]).trim();
      }
    }
  }

  return '';
}

export async function fetchGoogleSheetStations(customUrl = null) {
  const customOrStorage = customUrl || localStorage.getItem('CUSTOM_SHEET_URL');
  const urlsToTry = [
    customOrStorage ? normalizeSheetUrl(customOrStorage) : null,
    APP_CONFIG.defaultSheetUrl,
    APP_CONFIG.fallbackSheetUrl || '/sheet1_live.csv',
    '/sheet1_live.csv'
  ].filter(Boolean);

  // Remove duplicates while preserving order
  const uniqueUrls = [...new Set(urlsToTry)];

  for (const targetUrl of uniqueUrls) {
    try {
      const response = await fetch(targetUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const text = await response.text();
      const rows = parseCSV(text);
      if (!rows || rows.length < 1) {
        throw new Error('CSV is empty');
      }

      // Check if first row is header or data row
      const firstRowIsHeader = isNaN(parseInt(rows[0][0], 10));
      const startIndex = firstRowIsHeader ? 1 : 0;

      // Process records from CSV rows
      const stations = [];
      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 5) continue;
        const id = parseInt(row[0], 10) || (stations.length + 1);
        const village = (row[1] || '').trim();
        const subdistrict = (row[2] || '').trim();
        const district = (row[3] || '').trim();
        const province = (row[4] || '').trim();
        const phone = (row[5] || '').trim();
        const term = (row[6] || '').trim();

        // Coordinates lookup (prefer CSV columns 7 & 8, fallback to coordinatesMap)
        const coord = coordinatesMap[id] || { lat: 13.7563, lng: 100.5018 };
        const rawLat = parseFloat(row[7]);
        const rawLng = parseFloat(row[8]);
        const lat = !isNaN(rawLat) ? rawLat : (coord.lat || 13.7563);
        const lng = !isNaN(rawLng) ? rawLng : (coord.lng || 100.5018);

        // Tower lookup
        const towerInfo = villageTowerMap[id] || {};
        const towerHeight = (row[9] || '').trim() || towerInfo.towerHeight || '9';
        const isSpecialTower = towerHeight.includes('18') || towerHeight.includes('30');
        const rawType = (row[10] || '').trim() || towerInfo.typicalType;
        const typicalType = isSpecialTower ? 'อื่นๆ' : (rawType || 'Typical Type C');

        // Column L (index 11): Remarks / Updates from Sheet1
        const remark = (row[11] || '').trim();

        stations.push({
          id,
          village,
          subdistrict,
          district,
          province,
          phone,
          term,
          lat,
          lng,
          towerHeight,
          typicalType,
          termKey: getTermKey(term),
          remark,
          update: remark
        });
      }

      if (stations.length > 0) {
        return stations;
      }
    } catch (err) {
      console.warn(`Fetch error for ${targetUrl}:`, err.message || err);
    }
  }

  // Fallback to default bundled stations
  return defaultStations.map(s => {
    const isSpecialTower = String(s.towerHeight).includes('18') || String(s.towerHeight).includes('30');
    const remark = (s.remark || s.update || '').trim();
    return {
      ...s,
      typicalType: isSpecialTower ? 'อื่นๆ' : (s.typicalType || 'Typical Type C'),
      termKey: getTermKey(s.term),
      remark,
      update: remark
    };
  });
}
