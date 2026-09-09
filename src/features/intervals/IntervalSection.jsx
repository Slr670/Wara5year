import React, { useState } from 'react';
import { Radio, Download, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { formatThb, formatNumber } from '../../utils/formatters.js';
import { exportAllIntervalsCsv } from '../../utils/exportCsv.js';

export function IntervalSection({
  intervalsData = [],
  totalStations = 181,
  totalIntervalBudget = 0,
  onSelectInterval
}) {
  const [copied, setCopied] = useState(false);

  // Column sums
  const sumH9 = intervalsData.reduce((acc, i) => acc + i.heights.h9, 0);
  const sumH18 = intervalsData.reduce((acc, i) => acc + i.heights.h18, 0);
  const sumH30 = intervalsData.reduce((acc, i) => acc + i.heights.h30, 0);
  const sumTypeA = intervalsData.reduce((acc, i) => acc + i.types.typeA, 0);
  const sumTypeB = intervalsData.reduce((acc, i) => acc + i.types.typeB, 0);
  const sumTypeC = intervalsData.reduce((acc, i) => acc + i.types.typeC, 0);
  const sumTypeOther = intervalsData.reduce((acc, i) => acc + (i.types.typeOther || i.types.other || 0), 0);

  const handleCopySummary = () => {
    let text = `รายงานวิเคราะห์วาระคงเหลือและความสูงเสาอากาศ USO (รวม ${totalStations} สถานี)\n`;
    text += `ประมาณการงบรวม: ${formatThb(totalIntervalBudget)}\n\n`;
    intervalsData.forEach(item => {
      text += `• ${item.bucket.label} (${item.bucket.priority}): ${item.count} สถานี (${item.pct}%) | 9m: ${item.heights.h9}, 18m: ${item.heights.h18}, 30m: ${item.heights.h30} | Type A: ${item.types.typeA}, B: ${item.types.typeB}, C: ${item.types.typeC}, อื่นๆ: ${item.types.typeOther || 0} | งบ: ${formatThb(item.estBudget)}\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportCsv = () => {
    exportAllIntervalsCsv(intervalsData, totalStations, totalIntervalBudget);
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400" />
              <span>ตารางวิเคราะห์วาระคงเหลือและความสูงเสาอากาศ (Tenure & Tower Analysis)</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              วิเคราะห์จำแนกตามความสูงเสา (9ม., 18ม., 30ม.) และประเภทโครงสร้างเสาอากาศ (Type A, B, C เฉพาะเสา 9ม. และ อื่นๆ/โครงสร้างพิเศษ สำหรับเสา 18ม. และ 30ม.)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกสรุป'}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-collapse min-w-[880px]">
            <thead className="bg-slate-800/90 text-slate-300 uppercase border-b border-slate-700">
              <tr>
                <th className="py-3 px-3 text-left font-semibold sticky left-0 z-10 bg-slate-800">ช่วงเวลา (Interval)</th>
                <th className="py-3 px-2 text-center font-semibold">ระดับความเร่งด่วน</th>
                <th className="py-3 px-2 text-right font-semibold">จำนวน</th>
                <th className="py-3 px-2 text-right font-semibold">สัดส่วน</th>
                <th className="py-3 px-2 text-center font-semibold">จังหวัด</th>
                <th className="py-3 px-2 text-right font-semibold text-blue-300">เสา 9 ม.</th>
                <th className="py-3 px-2 text-right font-semibold text-blue-300">เสา 18 ม.</th>
                <th className="py-3 px-2 text-right font-semibold text-blue-300">เสา 30 ม.</th>
                <th className="py-3 px-2 text-right font-semibold text-indigo-300">Type A</th>
                <th className="py-3 px-2 text-right font-semibold text-indigo-300">Type B</th>
                <th className="py-3 px-2 text-right font-semibold text-indigo-300">Type C</th>
                <th className="py-3 px-2 text-right font-semibold text-amber-300">อื่นๆ</th>
                <th className="py-3 px-3 text-right font-semibold">ประมาณการงบรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {intervalsData.map((item) => (
                <tr
                  key={item.bucket.id}
                  onClick={() => onSelectInterval && onSelectInterval(item.bucket.termKey)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 sticky left-0 z-10 bg-slate-900/95 font-bold text-slate-100">
                    {item.bucket.label}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-[10px] font-semibold text-red-400 bg-red-950/40 border border-red-800/50 px-1.5 py-0.5 rounded">
                      {item.bucket.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-slate-100">
                    {formatNumber(item.count)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-400 font-mono">
                    {item.pct}%
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-300">
                    {item.provCount}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300 font-mono">
                    {item.heights.h9}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300 font-mono">
                    {item.heights.h18}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300 font-mono">
                    {item.heights.h30}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300 font-mono">
                    {item.types.typeA}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300 font-mono">
                    {item.types.typeB}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300 font-mono">
                    {item.types.typeC}
                  </td>
                  <td className="py-2.5 px-2 text-right text-amber-300 font-mono">
                    {item.types.typeOther || item.types.other || 0}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-400 font-mono">
                    {formatThb(item.estBudget)}
                  </td>
                </tr>
              ))}

              {/* Grand Total Row */}
              <tr className="bg-slate-800/90 font-bold text-slate-100 border-t-2 border-slate-700">
                <td className="py-3 px-3 sticky left-0 z-10 bg-slate-800 text-blue-400">
                  รวมทุกช่วงเวลา
                </td>
                <td className="py-3 px-2 text-center text-slate-400">-</td>
                <td className="py-3 px-2 text-right text-blue-400 font-extrabold">{formatNumber(totalStations)}</td>
                <td className="py-3 px-2 text-right font-mono text-slate-300">100%</td>
                <td className="py-3 px-2 text-center text-slate-400">-</td>
                <td className="py-3 px-2 text-right text-blue-400 font-mono">{sumH9}</td>
                <td className="py-3 px-2 text-right text-blue-400 font-mono">{sumH18}</td>
                <td className="py-3 px-2 text-right text-blue-400 font-mono">{sumH30}</td>
                <td className="py-3 px-2 text-right text-indigo-400 font-mono">{sumTypeA}</td>
                <td className="py-3 px-2 text-right text-indigo-400 font-mono">{sumTypeB}</td>
                <td className="py-3 px-2 text-right text-indigo-400 font-mono">{sumTypeC}</td>
                <td className="py-3 px-2 text-right text-amber-400 font-mono">{sumTypeOther}</td>
                <td className="py-3 px-3 text-right font-extrabold text-emerald-400 font-mono">
                  {formatThb(totalIntervalBudget)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
