import React from 'react';
import { MapPin, Phone, Radio, Compass } from 'lucide-react';
import { BRACKET_CONFIG } from '../../config/brackets.config.js';
import { Card } from '../../components/ui/card.jsx';

export function VillageCard({ station, onSelect }) {
  const bracket = BRACKET_CONFIG.find(b => b.key === station.termKey) || BRACKET_CONFIG[5];

  return (
    <Card
      onClick={() => onSelect && onSelect(station)}
      className="p-4 hover:border-blue-500/60 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
            <span>ลำดับ TOR</span>
            <span className="font-bold text-slate-200">{station.id}</span>
          </div>

          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-md border"
            style={{
              color: bracket.color,
              backgroundColor: `${bracket.color}15`,
              borderColor: `${bracket.color}35`
            }}
          >
            {station.term}
          </span>
        </div>

        {/* Village Name & Location */}
        <h4 className="font-bold text-base text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
          {station.village}
        </h4>

        <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">
            ต.{station.subdistrict} อ.{station.district} จ.{station.province}
          </span>
        </div>
      </div>

      {/* Footer Specs & Action */}
      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="bg-slate-800/80 text-blue-300 border border-slate-700/60 px-2 py-0.5 rounded text-[11px]">
            เสา {station.towerHeight || '9'} ม.
          </span>
          <span className="bg-slate-800/80 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded text-[11px]">
            {station.typicalType || (['18', '30'].includes(String(station.towerHeight)) ? 'อื่นๆ' : 'Type C')}
          </span>
        </div>

        {station.phone && (
          <div className="flex items-center gap-1 text-slate-400 text-[11px]" title={station.phone}>
            <Phone className="w-3 h-3 text-emerald-400" />
            <span className="truncate max-w-[90px]">{station.phone.split(',')[0]}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
