import { useMemo } from 'react';
import { aggregateDataByIntervals } from '../utils/calculations.js';

export function useIntervalMetrics(stations = [], budgetMap = {}) {
  const intervalsData = useMemo(() => {
    return aggregateDataByIntervals(stations, budgetMap);
  }, [stations, budgetMap]);

  const totalIntervalBudget = useMemo(() => {
    return intervalsData.reduce((acc, item) => acc + item.estBudget, 0);
  }, [intervalsData]);

  return {
    intervalsData,
    totalIntervalBudget
  };
}
