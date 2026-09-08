import { useState, useMemo, useCallback } from 'react';
import defaultStations from '../data/defaultStations.json';
import { getTermKey } from '../utils/calculations.js';
import { BRACKET_CONFIG, PROVINCES_ORDER } from '../config/brackets.config.js';

export function useWaraData() {
  const [stations, setStations] = useState(() => {
    return defaultStations.map(s => ({
      ...s,
      termKey: getTermKey(s.term)
    }));
  });

  const [selectedProvince, setSelectedProvince] = useState('ทั้งหมด');
  const [selectedTermKey, setSelectedTermKey] = useState('all'); // 'all' | 'lt1' | 'y1' ...
  const [searchQuery, setSearchQuery] = useState('');

  const updateStations = useCallback((newStations) => {
    setStations(newStations.map(s => ({
      ...s,
      termKey: s.termKey || getTermKey(s.term)
    })));
  }, []);

  // Filter stations based on province, termKey, and search query
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      // Province filter
      if (selectedProvince !== 'ทั้งหมด' && station.province !== selectedProvince) {
        return false;
      }
      // Bracket/TermKey filter
      if (selectedTermKey !== 'all' && station.termKey !== selectedTermKey) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const v = (station.village || '').toLowerCase();
        const sub = (station.subdistrict || '').toLowerCase();
        const dist = (station.district || '').toLowerCase();
        const prov = (station.province || '').toLowerCase();
        const phone = (station.phone || '').toLowerCase();
        const id = String(station.id);
        if (!v.includes(q) && !sub.includes(q) && !dist.includes(q) && !prov.includes(q) && !phone.includes(q) && !id.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [stations, selectedProvince, selectedTermKey, searchQuery]);

  // Stations for current province (ignoring bracket filter so KPI counts reflect province total)
  const provinceStations = useMemo(() => {
    if (selectedProvince === 'ทั้งหมด') return stations;
    return stations.filter(s => s.province === selectedProvince);
  }, [stations, selectedProvince]);

  // KPI counts for current province selection
  const kpiStats = useMemo(() => {
    const total = provinceStations.length;
    const counts = {
      total,
      lt1: 0,
      y1: 0,
      y2: 0,
      y3: 0,
      y4: 0,
      gt5: 0
    };

    provinceStations.forEach(s => {
      if (counts[s.termKey] !== undefined) {
        counts[s.termKey]++;
      }
    });

    return counts;
  }, [provinceStations]);

  // Province-by-province summary for the Summary Table
  const provinceSummary = useMemo(() => {
    const listProvinces = PROVINCES_ORDER.filter(p => p !== 'ทั้งหมด');
    const rows = listProvinces.map(provName => {
      const pStations = stations.filter(s => s.province === provName);
      const row = {
        province: provName,
        total: pStations.length,
        lt1: 0,
        y1: 0,
        y2: 0,
        y3: 0,
        y4: 0,
        gt5: 0
      };
      pStations.forEach(s => {
        if (row[s.termKey] !== undefined) {
          row[s.termKey]++;
        }
      });
      return row;
    });

    const totalRow = {
      province: 'รวมทุกจังหวัด (14 จังหวัด)',
      total: stations.length,
      lt1: 0,
      y1: 0,
      y2: 0,
      y3: 0,
      y4: 0,
      gt5: 0
    };
    stations.forEach(s => {
      if (totalRow[s.termKey] !== undefined) {
        totalRow[s.termKey]++;
      }
    });

    return { rows, totalRow };
  }, [stations]);

  return {
    stations,
    setStations: updateStations,
    selectedProvince,
    setSelectedProvince,
    selectedTermKey,
    setSelectedTermKey,
    searchQuery,
    setSearchQuery,
    filteredStations,
    provinceStations,
    kpiStats,
    provinceSummary
  };
}
