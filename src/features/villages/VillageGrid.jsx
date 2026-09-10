import React, { useState } from 'react';
import { VillageCard } from './VillageCard.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Radio } from 'lucide-react';

export function VillageGrid({ stations = [], onSelectStation }) {
  const [displayLimit, setDisplayLimit] = useState(24);

  const displayedStations = stations.slice(0, displayLimit);
  const hasMore = stations.length > displayLimit;

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800 rounded-2xl text-center mb-8">
        <Radio className="w-10 h-10 text-slate-600 mb-3" />
        <h4 className="text-base font-bold text-slate-300">ไม่พบสถานีที่ตรงกับเงื่อนไขการค้นหา</h4>
        <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองช่วงวาระและจังหวัดใหม่</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 mb-4">
        {displayedStations.map(station => (
          <VillageCard
            key={station.id}
            station={station}
            onSelect={onSelectStation}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            variant="secondary"
            onClick={() => setDisplayLimit(prev => prev + 24)}
            aria-label={`แสดงสถานีเพิ่มเติม อีก ${stations.length - displayLimit} สถานี`}
            className="px-6 text-xs text-slate-300 hover:text-white"
          >
            แสดงสถานีเพิ่มเติม ({stations.length - displayLimit} สถานีที่เหลือ)
          </Button>
        </div>
      )}
    </div>
  );
}
