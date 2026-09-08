import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_BUDGET_MAP, DEFAULT_ADDITIONAL_BUDGET_MAP } from '../config/budget.config.js';
import { calculateBudgetMetrics } from '../utils/calculations.js';

export function useBudgetMetrics(stations = []) {
  const [budgetMap, setBudgetMapState] = useState(() => {
    try {
      const saved = localStorage.getItem('WARA_BUDGET_MAP');
      return saved ? JSON.parse(saved) : DEFAULT_BUDGET_MAP;
    } catch {
      return DEFAULT_BUDGET_MAP;
    }
  });

  const [additionalBudgetMap, setAdditionalBudgetMapState] = useState(() => {
    try {
      const saved = localStorage.getItem('WARA_ADDITIONAL_BUDGET_MAP');
      return saved ? JSON.parse(saved) : DEFAULT_ADDITIONAL_BUDGET_MAP;
    } catch {
      return DEFAULT_ADDITIONAL_BUDGET_MAP;
    }
  });

  const [siteBudgets, setSiteBudgetsState] = useState(() => {
    try {
      const saved = localStorage.getItem('WARA_SITE_BUDGET_MAP');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateBaseBudget = useCallback((termKey, value) => {
    setBudgetMapState(prev => {
      const next = { ...prev, [termKey]: Number(value) || 0 };
      localStorage.setItem('WARA_BUDGET_MAP', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateAdditionalBudget = useCallback((termKey, value) => {
    setAdditionalBudgetMapState(prev => {
      const next = { ...prev, [termKey]: Number(value) || 0 };
      localStorage.setItem('WARA_ADDITIONAL_BUDGET_MAP', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateSiteBudget = useCallback((siteId, value) => {
    setSiteBudgetsState(prev => {
      const next = { ...prev, [siteId]: Number(value) || 0 };
      localStorage.setItem('WARA_SITE_BUDGET_MAP', JSON.stringify(next));
      return next;
    });
  }, []);

  const resetBracketSiteBudgets = useCallback((bracketKey, bracketStations) => {
    setSiteBudgetsState(prev => {
      const next = { ...prev };
      bracketStations.forEach(s => {
        delete next[s.id];
      });
      localStorage.setItem('WARA_SITE_BUDGET_MAP', JSON.stringify(next));
      return next;
    });
  }, []);

  const metrics = useMemo(() => {
    return calculateBudgetMetrics(stations, siteBudgets, budgetMap, additionalBudgetMap);
  }, [stations, siteBudgets, budgetMap, additionalBudgetMap]);

  return {
    budgetMap,
    additionalBudgetMap,
    siteBudgets,
    metrics,
    updateBaseBudget,
    updateAdditionalBudget,
    updateSiteBudget,
    resetBracketSiteBudgets
  };
}
