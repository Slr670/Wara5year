import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { TenureDonutChart } from './TenureDonutChart.jsx';
import { TenureBarChart } from './TenureBarChart.jsx';
import { BRACKET_CONFIG } from '../../config/brackets.config.js';

export function ChartSection({ kpiStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
      {/* Donut Chart */}
      <Card className="lg:col-span-5 flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>สัดส่วนวาระคงเหลือ</span>
            <span className="text-xs font-normal text-slate-400">ภาพรวมสถานี</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TenureDonutChart kpiStats={kpiStats} />
        </CardContent>
      </Card>

      {/* Bar Chart & Legend */}
      <Card className="lg:col-span-7 flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>จำนวนสถานีแบ่งตามช่วงเวลา</span>
            <span className="text-xs font-normal text-slate-400">เปรียบเทียบตามวาระ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TenureBarChart kpiStats={kpiStats} />
          {/* Chart Legend Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3 pt-3 border-t border-slate-800">
            {BRACKET_CONFIG.map(b => (
              <div key={b.key} className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
