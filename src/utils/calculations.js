import { BRACKET_CONFIG } from '../config/brackets.config.js';
import { DEFAULT_BUDGET_MAP, DEFAULT_ADDITIONAL_BUDGET_MAP } from '../config/budget.config.js';

/**
 * Parse tenure string into floating years
 * e.g., "5 ปี 0 เดือน" -> 5.0, "0 ปี 1 เดือน" -> 0.0833
 */
export function parseTenureValue(termStr) {
  if (!termStr || typeof termStr !== 'string') return 0;
  const yMatch = termStr.match(/(\d+)\s*ปี/);
  const mMatch = termStr.match(/(\d+)\s*เดือน/);
  const years = yMatch ? parseInt(yMatch[1], 10) : 0;
  const months = mMatch ? parseInt(mMatch[1], 10) : 0;
  return years + (months / 12);
}

/**
 * Maps tenure string to bracket key ('lt1', 'y1', 'y2', 'y3', 'y4', 'gt5')
 */
export function getTermKey(termStr) {
  if (!termStr) return 'gt5';
  const val = parseTenureValue(termStr);
  if (val < 1) return 'lt1';
  if (val < 2) return 'y1';
  if (val < 2.999) return 'y2';
  if (val < 3.999) return 'y3';
  if (val < 4.999) return 'y4';
  return 'gt5';
}

/**
 * Check if a station is in the urgent alert category: 0 years 1 month
 */
export function isZeroYearOneMonth(station) {
  if (!station || !station.term) return false;
  const term = station.term.trim();
  const yMatch = term.match(/(\d+)\s*ปี/);
  const mMatch = term.match(/(\d+)\s*เดือน/);
  const y = yMatch ? parseInt(yMatch[1], 10) : null;
  const m = mMatch ? parseInt(mMatch[1], 10) : null;
  if (y === 0 && m === 1) return true;
  if (y === 0 && m === 0) return true;
  if (term === '0 ปี 1 เดือน' || term === '0ปี1เดือน' || term.startsWith('0 ปี 1')) return true;
  return false;
}

/**
 * Interval bucket definitions for Tower & Interval Breakdown Table
 */
export function getIntervalBuckets() {
  return [
    { id: 'int_lt1', label: '< 1 ปี', termKey: 'lt1', priority: 'เร่งด่วนระดับ 1', minYears: 0, maxYears: 1 },
    { id: 'int_y1', label: '1 - 2 ปี', termKey: 'y1', priority: 'เร่งด่วนระดับ 2', minYears: 1, maxYears: 2 },
    { id: 'int_y2', label: '2 - 3 ปี', termKey: 'y2', priority: 'เร่งด่วนระดับ 3', minYears: 2, maxYears: 3 },
    { id: 'int_y3', label: '3 - 4 ปี', termKey: 'y3', priority: 'เฝ้าระวังระดับ 1', minYears: 3, maxYears: 4 },
    { id: 'int_y4', label: '4 - 5 ปี', termKey: 'y4', priority: 'เฝ้าระวังระดับ 2', minYears: 4, maxYears: 5 },
    { id: 'int_gt5', label: '> 5 ปี', termKey: 'gt5', priority: 'ปกติ / ระยะยาว', minYears: 5, maxYears: 999 }
  ];
}

/**
 * Aggregates stations by tenure interval and tower dimensions (heights & typical types)
 */
export function aggregateDataByIntervals(stations = [], budgetMap = DEFAULT_BUDGET_MAP) {
  const buckets = getIntervalBuckets();
  const total = stations.length || 1;

  return buckets.map(bucket => {
    const matched = stations.filter(s => {
      const k = s.termKey || getTermKey(s.term);
      return k === bucket.termKey;
    });

    const count = matched.length;
    const pct = ((count / total) * 100).toFixed(1);
    const provs = new Set(matched.map(s => s.province));

    let h9 = 0;
    let h18 = 0;
    let h30 = 0;
    let typeA = 0;
    let typeB = 0;
    let typeC = 0;

    matched.forEach(s => {
      const hStr = String(s.towerHeight || '').trim();
      if (hStr.includes('9')) h9++;
      else if (hStr.includes('18')) h18++;
      else if (hStr.includes('30')) h30++;
      else h9++; // default fallback

      const tStr = String(s.typicalType || '').toLowerCase();
      if (tStr.includes('type a') || tStr.includes('แบบ a')) typeA++;
      else if (tStr.includes('type b') || tStr.includes('แบบ b')) typeB++;
      else if (tStr.includes('type c') || tStr.includes('แบบ c')) typeC++;
      else typeC++; // default fallback
    });

    const baseCost = budgetMap[bucket.termKey] !== undefined ? budgetMap[bucket.termKey] : 20000;
    const estBudget = count * baseCost;

    return {
      bucket,
      count,
      pct,
      provCount: provs.size,
      heights: { h9, h18, h30 },
      types: { typeA, typeB, typeC },
      estBudget
    };
  });
}

/**
 * Calculates budget matrix, urgent group sums (< 1 ถึง 5 ปี), and site budget additions
 */
export function calculateBudgetMetrics(
  stations = [],
  siteBudgets = {},
  budgetMap = DEFAULT_BUDGET_MAP,
  additionalBudgetMap = DEFAULT_ADDITIONAL_BUDGET_MAP
) {
  const totalStations = stations.length;
  const bMap = { ...DEFAULT_BUDGET_MAP, ...budgetMap };
  const aMap = { ...DEFAULT_ADDITIONAL_BUDGET_MAP, ...additionalBudgetMap };

  let grandBudgetSum = 0;
  let priorityBudgetSum = 0;
  let priorityStationsSum = 0;

  const rows = BRACKET_CONFIG.map(bracket => {
    const matched = stations.filter(s => {
      const k = s.termKey || getTermKey(s.term);
      return k === bracket.key;
    });
    const count = matched.length;
    const sharePct = totalStations > 0 ? ((count / totalStations) * 100).toFixed(1) : '0.0';

    const basePerStation = bMap[bracket.key] !== undefined ? Number(bMap[bracket.key]) : 20000;
    const baseTotal = count * basePerStation;

    const addPerStation = aMap[bracket.key] !== undefined ? Number(aMap[bracket.key]) : 0;
    const addTotal = count * addPerStation;

    let siteAddSum = 0;
    matched.forEach(s => {
      if (siteBudgets[s.id] !== undefined) {
        siteAddSum += Number(siteBudgets[s.id]) || 0;
      }
    });

    const bracketGrandTotal = baseTotal + addTotal + siteAddSum;
    grandBudgetSum += bracketGrandTotal;

    // Urgent group threshold: <= 5 years (< 1 ปี ถึง 4 - 5 ปี)
    if (['lt1', 'y1', 'y2', 'y3', 'y4'].includes(bracket.key)) {
      priorityStationsSum += count;
      priorityBudgetSum += bracketGrandTotal;
    }

    return {
      bracket,
      count,
      sharePct,
      basePerStation,
      baseTotal,
      addPerStation,
      addTotal,
      siteAddSum,
      bracketGrandTotal
    };
  });

  return {
    rows,
    totalStations,
    grandBudgetSum,
    priorityStationsSum,
    priorityBudgetSum
  };
}
