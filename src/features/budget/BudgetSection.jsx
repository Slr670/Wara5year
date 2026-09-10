import React, { useState } from 'react';
import { DollarSign, Sliders, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { formatThb, formatNumber } from '../../utils/formatters.js';
import { SiteBudgetModal } from './SiteBudgetModal.jsx';

export function BudgetSection({
  metrics,
  stations,
  siteBudgets,
  siteBaseBudgets,
  budgetMap,
  additionalBudgetMap,
  onUpdateSiteBudget,
  onUpdateSiteBaseBudget,
  onResetBracketSites
}) {
  const [activeBracketModal, setActiveBracketModal] = useState(null);

  const {
    rows = [],
    totalStations = 0,
    grandBaseTotal = 0,
    grandAddTotal = 0,
    grandBudgetSum = 0,
    priorityStationsSum = 0,
    priorityBudgetSum = 0
  } = metrics || {};

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>ประมาณการงบประมาณรายวาระ (Budget Matrix & Estimates)</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              คำนวณงบประมาณตามเกณฑ์วาระคงเหลือ พร้อมระบบปรับแก้งบประมาณเฉพาะไซต์ (Site-by-Site)
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-right">
              <div className="text-[10px] text-slate-400 font-medium">งบประมาณรวมทั้งสิ้น</div>
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                {formatThb(grandBudgetSum)}
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-right">
              <div className="text-[10px] text-rose-300 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>งบกลุ่มเร่งด่วน (วาระ ≤ 5 ปี)</span>
              </div>
              <div className="text-base font-extrabold text-rose-400 font-mono">
                {formatThb(priorityBudgetSum)}
                <span className="text-xs text-rose-300 font-normal ml-1">({priorityStationsSum} สถานี)</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm border-collapse min-w-[760px]">
            <thead className="bg-slate-800/90 text-slate-300 text-xs uppercase border-b border-slate-700">
              <tr>
                <th className="py-3 px-4 text-left font-semibold sticky left-0 z-10 bg-slate-800">ช่วงวาระ</th>
                <th className="py-3 px-2 text-center font-semibold">จำนวนสถานี</th>
                <th className="py-3 px-2 text-center font-semibold">สัดส่วน</th>
                <th className="py-3 px-3 text-right font-semibold">งบตั้งต้นรวม (บาท)</th>
                <th className="py-3 px-3 text-right font-semibold">งบเพิ่มเติมรวม (บาท)</th>
                <th className="py-3 px-4 text-right font-semibold">งบประมาณรวม (บาท)</th>
                <th className="py-3 px-3 text-center font-semibold">จัดการไซต์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map(({ bracket, count, sharePct, baseTotal, addTotal, bracketGrandTotal }) => (
                <tr key={bracket.key} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 sticky left-0 z-10 bg-slate-900/95 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bracket.color }} />
                      <span className="text-slate-100 font-semibold">{bracket.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-slate-100">{formatNumber(count)}</td>
                  <td className="py-3 px-2 text-center text-slate-400 font-mono text-xs">{sharePct}%</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">
                    {formatThb(baseTotal)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">
                    {formatThb(addTotal)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-400 font-mono">
                    {formatThb(bracketGrandTotal)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveBracketModal(bracket)}
                      className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/40"
                    >
                      <Sliders className="w-3.5 h-3.5 mr-1" />
                      <span>ปรับไซต์</span>
                    </Button>
                  </td>
                </tr>
              ))}

              {/* Total Summary Row */}
              <tr className="bg-slate-800/90 font-bold text-slate-100 border-t-2 border-slate-700">
                <td className="py-3 px-4 sticky left-0 z-10 bg-slate-800 text-blue-400">
                  รวมทั้งสิ้น (TOTAL)
                </td>
                <td className="py-3 px-2 text-center text-blue-400 font-extrabold">{formatNumber(totalStations)}</td>
                <td className="py-3 px-2 text-center font-mono text-xs text-slate-300">100%</td>
                <td className="py-3 px-3 text-right text-blue-400 font-mono">
                  {formatThb(grandBaseTotal)}
                </td>
                <td className="py-3 px-3 text-right text-blue-400 font-mono">
                  {formatThb(grandAddTotal)}
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-emerald-400 font-mono text-base">
                  {formatThb(grandBudgetSum)}
                </td>
                <td className="py-3 px-3 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Site Budget Dialog */}
      {activeBracketModal && (
        <SiteBudgetModal
          isOpen={!!activeBracketModal}
          onClose={() => setActiveBracketModal(null)}
          bracket={activeBracketModal}
          stations={stations}
          siteBudgets={siteBudgets}
          siteBaseBudgets={siteBaseBudgets}
          baseBudget={budgetMap[activeBracketModal.key] !== undefined ? budgetMap[activeBracketModal.key] : 20000}
          additionalBudget={additionalBudgetMap[activeBracketModal.key] !== undefined ? additionalBudgetMap[activeBracketModal.key] : 0}
          onUpdateSiteBudget={onUpdateSiteBudget}
          onUpdateSiteBaseBudget={onUpdateSiteBaseBudget}
          onResetBracketSites={onResetBracketSites}
        />
      )}
    </Card>
  );
}
