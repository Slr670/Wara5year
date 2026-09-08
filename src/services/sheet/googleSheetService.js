import defaultStations from '../../data/defaultStations.json';
import coordinatesMap from '../../data/coordinates.json';
import villageTowerMap from '../../data/villageTowerMapping.json';
import { getTermKey } from '../../utils/calculations.js';

export function parseCSV(text) {
  const lines = text.trim().split('\n');
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
    return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=0`;
  }
  return url;
}

export async function fetchGoogleSheetStations(customUrl = null) {
  const targetUrl = customUrl || localStorage.getItem('CUSTOM_SHEET_URL') || '/sheet1_live.csv';

  try {
    const response = await fetch(targetUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const text = await response.text();
    const rows = parseCSV(text);
    if (!rows || rows.length <= 1) {
      throw new Error('CSV is empty or invalid header');
    }

    // Process records from CSV rows
    const stations = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 5) continue;
      const id = parseInt(row[0], 10) || i;
      const village = (row[1] || '').trim();
      const subdistrict = (row[2] || '').trim();
      const district = (row[3] || '').trim();
      const province = (row[4] || '').trim();
      const phone = (row[5] || '').trim();
      const term = (row[6] || '').trim();

      // Coordinates lookup
      const coord = coordinatesMap[id] || { lat: 13.7563, lng: 100.5018 };
      // Tower lookup
      const towerInfo = villageTowerMap[id] || {};

      stations.push({
        id,
        village,
        subdistrict,
        district,
        province,
        phone,
        term,
        lat: coord.lat,
        lng: coord.lng,
        towerHeight: row[9] || towerInfo.towerHeight || '9',
        typicalType: row[10] || towerInfo.typicalType || 'Typical Type C',
        termKey: getTermKey(term)
      });
    }

    if (stations.length > 0) {
      return stations;
    }
  } catch (err) {
    console.warn('Live Google Sheet fetch error, falling back to bundled default stations:', err);
  }

  // Fallback to default stations
  return defaultStations.map(s => ({
    ...s,
    termKey: getTermKey(s.term)
  }));
}
