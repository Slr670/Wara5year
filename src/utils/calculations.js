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
export function aggregateDataByIntervals(
  stations = [],
  budgetMap = DEFAULT_BUDGET_MAP,
  siteBaseBudgets = {},
  siteBudgets = {},
  additionalBudgetMap = DEFAULT_ADDITIONAL_BUDGET_MAP
) {
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
    let typeOther = 0;
    let estBudget = 0;

    const defaultBase = budgetMap[bucket.termKey] !== undefined ? Number(budgetMap[bucket.termKey]) : 20000;
    const defaultAdd = additionalBudgetMap[bucket.termKey] !== undefined ? Number(additionalBudgetMap[bucket.termKey]) : 0;

    matched.forEach(s => {
      const hStr = String(s.towerHeight || '').trim();
      const is18 = hStr.includes('18');
      const is30 = hStr.includes('30');

      if (is18) h18++;
      else if (is30) h30++;
      else h9++; // default 9m fallback

      // Tower Classification Rule:
      // All 18m (9 stations) and 30m (3 stations) towers must strictly belong to 'อื่นๆ' (Others / Special Structures).
      // Only 9m towers can be classified under TYPE A, TYPE B, or TYPE C.
      if (is18 || is30) {
        typeOther++;
      } else {
        const tStr = String(s.typicalType || '').toLowerCase().trim();
        if (tStr.includes('type a') || tStr.includes('แบบ a')) typeA++;
        else if (tStr.includes('type b') || tStr.includes('แบบ b')) typeB++;
        else if (tStr.includes('type c') || tStr.includes('แบบ c')) typeC++;
        else typeOther++;
      }

      const sBase = siteBaseBudgets[s.id] !== undefined && siteBaseBudgets[s.id] !== '' ? Number(siteBaseBudgets[s.id]) : defaultBase;
      const sAdd = siteBudgets[s.id] !== undefined && siteBudgets[s.id] !== '' ? Number(siteBudgets[s.id]) : defaultAdd;
      estBudget += (sBase + sAdd);
    });

    return {
      bucket,
      count,
      pct,
      provCount: provs.size,
      heights: { h9, h18, h30 },
      types: { typeA, typeB, typeC, typeOther, other: typeOther },
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
  additionalBudgetMap = DEFAULT_ADDITIONAL_BUDGET_MAP,
  siteBaseBudgets = {}
) {
  const totalStations = stations.length;
  const bMap = { ...DEFAULT_BUDGET_MAP, ...budgetMap };
  const aMap = { ...DEFAULT_ADDITIONAL_BUDGET_MAP, ...additionalBudgetMap };

  let grandBudgetSum = 0;
  let grandBaseTotal = 0;
  let grandAddTotal = 0;
  let priorityBudgetSum = 0;
  let priorityStationsSum = 0;

  const rows = BRACKET_CONFIG.map(bracket => {
    const matched = stations.filter(s => {
      const k = s.termKey || getTermKey(s.term);
      return k === bracket.key;
    });
    const count = matched.length;
    const sharePct = totalStations > 0 ? ((count / totalStations) * 100).toFixed(1) : '0.0';

    const defaultBasePerStation = bMap[bracket.key] !== undefined ? Number(bMap[bracket.key]) : 20000;
    const defaultAddPerStation = aMap[bracket.key] !== undefined ? Number(aMap[bracket.key]) : 0;

    let baseTotal = 0;
    let addTotal = 0;

    matched.forEach(s => {
      const sBase = siteBaseBudgets[s.id] !== undefined && siteBaseBudgets[s.id] !== ''
        ? Number(siteBaseBudgets[s.id])
        : defaultBasePerStation;
      const sAdd = siteBudgets[s.id] !== undefined && siteBudgets[s.id] !== ''
        ? Number(siteBudgets[s.id])
        : defaultAddPerStation;

      baseTotal += sBase;
      addTotal += sAdd;
    });

    const bracketGrandTotal = baseTotal + addTotal;
    grandBaseTotal += baseTotal;
    grandAddTotal += addTotal;
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
      basePerStation: count > 0 ? Math.round(baseTotal / count) : defaultBasePerStation,
      baseTotal,
      addPerStation: count > 0 ? Math.round(addTotal / count) : defaultAddPerStation,
      addTotal,
      siteAddSum: addTotal,
      bracketGrandTotal
    };
  });

  return {
    rows,
    totalStations,
    grandBaseTotal,
    grandAddTotal,
    grandBudgetSum,
    priorityStationsSum,
    priorityBudgetSum
  };
}
