import React from 'react';
import { BRACKET_CONFIG } from '../../config/brackets.config.js';

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-slate-400 font-medium mr-1">สัญลักษณ์วาระ:</span>
      {BRACKET_CONFIG.map(b => (
        <div
          key={b.key}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-200"
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
          <span>{b.name}</span>
        </div>
      ))}
    </div>
  );
}
