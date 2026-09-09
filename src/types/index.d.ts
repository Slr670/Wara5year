/**
 * Domain Type Definitions for Wara Dashboard
 */

export interface Station {
  id: number;
  village: string;
  subdistrict: string;
  district: string;
  province: string;
  phone: string;
  term: string;
  lat: number;
  lng: number;
  towerHeight?: string;
  typicalType?: string;
  termKey?: 'lt1' | 'y1' | 'y2' | 'y3' | 'y4' | 'gt5';
}

export interface BracketConfig {
  key: 'lt1' | 'y1' | 'y2' | 'y3' | 'y4' | 'gt5';
  name: string;
  priority: string;
  priColor: string;
  priBg: string;
  minYears: number;
  maxYears: number;
  color: string;
  badgeClass: string;
}

export interface BudgetMetrics {
  rows: Array<{
    bracket: BracketConfig;
    count: number;
    sharePct: string;
    basePerStation: number;
    baseTotal: number;
    addPerStation: number;
    addTotal: number;
    siteAddSum: number;
    bracketGrandTotal: number;
  }>;
  totalStations: number;
  grandBaseTotal: number;
  grandAddTotal: number;
  grandBudgetSum: number;
  priorityStationsSum: number;
  priorityBudgetSum: number;
}

export interface IntervalBucket {
  id: string;
  label: string;
  termKey: string;
  priority: string;
  minYears: number;
  maxYears: number;
}

export interface IntervalAggregationItem {
  bucket: IntervalBucket;
  count: number;
  pct: string;
  provCount: number;
  heights: {
    h9: number;
    h18: number;
    h30: number;
  };
  types: {
    typeA: number;
    typeB: number;
    typeC: number;
    typeOther: number;
    other?: number;
  };
  estBudget: number;
}
