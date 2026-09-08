import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../../components/ui/input.jsx';
import { Select } from '../../components/ui/select.jsx';
import { PROVINCES_ORDER, BRACKET_CONFIG } from '../../config/brackets.config.js';

export function VillageFilters({
  selectedProvince,
  onSelectProvince,
  selectedTermKey,
  onSelectTermKey,
  searchQuery,
  onSearchChange,
  totalCount
}) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-slate-900/70 border border-slate-800 rounded-2xl mb-4 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="ค้นหาชื่อหมู่บ้าน, ตำบล, อำเภอ, จังหวัด, รหัส หรือเบอร์โทร..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-xs sm:text-sm h-10"
          />
        </div>

        {/* Province Filter */}
        <div className="w-full sm:w-48">
          <Select
            value={selectedProvince}
            onChange={(e) => onSelectProvince(e.target.value)}
            className="text-xs sm:text-sm h-10"
          >
            {PROVINCES_ORDER.map(prov => (
              <option key={prov} value={prov} className="bg-slate-900 text-slate-100">
                {prov === 'ทั้งหมด' ? 'ทุกจังหวัด (14 จว.)' : `จ. ${prov}`}
              </option>
            ))}
          </Select>
        </div>

        {/* Tenure Bracket Filter */}
        <div className="w-full sm:w-44">
          <Select
            value={selectedTermKey}
            onChange={(e) => onSelectTermKey(e.target.value)}
            className="text-xs sm:text-sm h-10"
          >
            <option value="all" className="bg-slate-900 text-slate-100">ทุกช่วงวาระ</option>
            {BRACKET_CONFIG.map(b => (
              <option key={b.key} value={b.key} className="bg-slate-900 text-slate-100">
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Count Badge */}
      <div className="text-xs text-slate-400 font-medium whitespace-nowrap self-end md:self-center">
        พบ <span className="font-bold text-blue-400">{totalCount}</span> สถานี
      </div>
    </div>
  );
}
