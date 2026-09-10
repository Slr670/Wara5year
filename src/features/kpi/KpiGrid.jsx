import React from 'react';
import { KpiCard } from './KpiCard.jsx';
import { BRACKET_CONFIG } from '../../config/brackets.config.js';

export function KpiGrid({
  kpiStats,
  selectedTermKey,
  onSelectTermKey
}) {
  const total = kpiStats.total || 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 sm:gap-3 mb-6">
      {/* 1. All Stations Card */}
      <KpiCard
        title="สถานีทั้งหมด"
        subtitle="ภาพรวม"
        count={total}
        totalStations={total}
        color="#3b82f6"
        isSelected={selectedTermKey === 'all'}
        onClick={() => onSelectTermKey('all')}
      />

      {/* 2-7. Tenure Bracket Cards with Range Notation */}
      {BRACKET_CONFIG.map(bracket => {
        const count = kpiStats[bracket.key] || 0;
        return (
          <KpiCard
            key={bracket.key}
            title={bracket.name}
            subtitle="สัดส่วน"
            count={count}
            totalStations={total}
            priority={bracket.kpiBadge || bracket.priority}
            color={bracket.color}
            isSelected={selectedTermKey === bracket.key}
            onClick={() => onSelectTermKey(bracket.key === selectedTermKey ? 'all' : bracket.key)}
          />
        );
      })}
    </div>
  );
}
