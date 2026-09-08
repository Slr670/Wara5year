import React from 'react';
import { Table, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { formatNumber } from '../../utils/formatters.js';

export function SummaryTable({
  provinceSummary,
  selectedProvince,
  onSelectProvince
}) {
  const { rows = [], totalRow = {} } = provinceSummary || {};

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Table className="w-4 h-4 text-blue-400" />
            <span>ตารางสรุปข้อมูลวาระคงเหลือแยกรายจังหวัด</span>
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">
            คลิกที่แถวของจังหวัดเพื่อกรองข้อมูลเฉพาะจังหวัดนั้น
          </p>
        </div>
        {selectedProvince !== 'ทั้งหมด' && (
          <button
            onClick={() => onSelectProvince('ทั้งหมด')}
            className="text-xs text-blue-400 hover:text-blue-300 underline font-medium self-start sm:self-auto"
          >
            แสดงทุกจังหวัด
          </button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-800/90 text-slate-300 text-xs uppercase border-b border-slate-700">
                <th className="py-3 px-4 text-left font-semibold sticky left-0 z-10 bg-slate-800 w-[23%]">
                  จังหวัด
                </th>
                <th className="py-3 px-2 text-center font-semibold w-[11%]">ทั้งหมด</th>
                <th className="py-3 px-2 text-center font-semibold w-[11%] text-red-400">&lt; 1 ปี</th>
                <th className="py-3 px-2 text-center font-semibold w-[11%] text-orange-400">1 - 2 ปี</th>
                <th className="py-3 px-2 text-center font-semibold w-[11%] text-amber-400">2 - 3 ปี</th>
                <th className="py-3 px-2 text-center font-semibold w-[11%] text-emerald-400">3 - 4 ปี</th>
                <th className="py-3 px-2 text-center font-semibold w-[11%] text-blue-400">4 - 5 ปี</th>
                <th className="py-3 px-2 text-center font-semibold w-[11%] text-purple-400">&gt; 5 ปี</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((row) => {
                const isSelected = selectedProvince === row.province;
                return (
                  <tr
                    key={row.province}
                    onClick={() => onSelectProvince(isSelected ? 'ทั้งหมด' : row.province)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-900/30 text-blue-100 font-semibold'
                        : 'hover:bg-slate-800/40 text-slate-200'
                    }`}
                  >
                    <td className={`py-2.5 px-4 font-medium sticky left-0 z-10 ${
                      isSelected ? 'bg-slate-900 text-blue-400' : 'bg-slate-900/95 text-slate-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        <span>{row.province}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-100">{formatNumber(row.total)}</td>
                    <td className="py-2.5 px-2 text-center text-red-400 font-medium">{formatNumber(row.lt1)}</td>
                    <td className="py-2.5 px-2 text-center text-orange-400 font-medium">{formatNumber(row.y1)}</td>
                    <td className="py-2.5 px-2 text-center text-amber-400 font-medium">{formatNumber(row.y2)}</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400 font-medium">{formatNumber(row.y3)}</td>
                    <td className="py-2.5 px-2 text-center text-blue-400 font-medium">{formatNumber(row.y4)}</td>
                    <td className="py-2.5 px-2 text-center text-purple-400 font-medium">{formatNumber(row.gt5)}</td>
                  </tr>
                );
              })}

              {/* Total Summary Row */}
              {totalRow && (
                <tr className="bg-slate-800/90 font-bold text-slate-100 border-t-2 border-slate-700">
                  <td className="py-3 px-4 sticky left-0 z-10 bg-slate-800 text-blue-400">
                    {totalRow.province}
                  </td>
                  <td className="py-3 px-2 text-center text-blue-400 font-extrabold">{formatNumber(totalRow.total)}</td>
                  <td className="py-3 px-2 text-center text-red-400">{formatNumber(totalRow.lt1)}</td>
                  <td className="py-3 px-2 text-center text-orange-400">{formatNumber(totalRow.y1)}</td>
                  <td className="py-3 px-2 text-center text-amber-400">{formatNumber(totalRow.y2)}</td>
                  <td className="py-3 px-2 text-center text-emerald-400">{formatNumber(totalRow.y3)}</td>
                  <td className="py-3 px-2 text-center text-blue-400">{formatNumber(totalRow.y4)}</td>
                  <td className="py-3 px-2 text-center text-purple-400">{formatNumber(totalRow.gt5)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
