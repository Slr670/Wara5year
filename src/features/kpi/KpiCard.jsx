import React from 'react';
import { SpotlightCard } from '../../components/react-bits/SpotlightCard.jsx';
import { AnimatedCounter } from '../../components/react-bits/AnimatedCounter.jsx';

export function KpiCard({
  title,
  subtitle,
  count,
  totalStations,
  priority,
  color,
  isSelected,
  onClick
}) {
  const pct = totalStations > 0 ? ((count / totalStations) * 100).toFixed(1) : '0.0';

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
      }`}
    >
      <SpotlightCard
        className={`p-3 sm:p-3.5 xl:p-4 h-full flex flex-col justify-between border ${
          isSelected ? 'border-blue-500 bg-slate-900/90' : 'border-slate-800/90 hover:border-slate-700'
        }`}
        spotlightColor={`${color}22`}
      >
        <div className="flex items-center justify-between gap-1 mb-2 min-w-0">
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase whitespace-nowrap shrink-0">
            {title}
          </span>
          {priority && (
            <span
              className="text-[9.5px] 2xl:text-[10px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap shrink-0 inline-flex items-center justify-center leading-tight tracking-tight shadow-sm"
              style={{
                color: color,
                backgroundColor: `${color}18`,
                borderColor: `${color}40`
              }}
            >
              {priority}
            </span>
          )}
        </div>

        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
            <AnimatedCounter value={count} />
            <span className="text-xs font-medium text-slate-400">สถานี</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-auto">
          <span>{subtitle || 'สัดส่วน'}</span>
          <span className="font-semibold text-slate-200">{pct}%</span>
        </div>
      </SpotlightCard>
    </div>
  );
}
