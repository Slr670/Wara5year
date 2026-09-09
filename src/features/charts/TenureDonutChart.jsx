import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { BRACKET_CONFIG } from '../../config/brackets.config.js';
import { formatNumber } from '../../utils/formatters.js';

export function TenureDonutChart({ kpiStats }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const urgentCount = (kpiStats.lt1 || 0) + (kpiStats.y1 || 0) + (kpiStats.y2 || 0) + (kpiStats.y3 || 0) + (kpiStats.y4 || 0);
  const total = kpiStats.total || 1;
  const urgentPct = ((urgentCount / total) * 100).toFixed(1);

  const legendItems = BRACKET_CONFIG.map((b, idx) => {
    const count = kpiStats[b.key] || 0;
    const pct = ((count / total) * 100).toFixed(1);
    return {
      ...b,
      index: idx,
      count,
      pct
    };
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    const dataValues = BRACKET_CONFIG.map(b => kpiStats[b.key] || 0);
    const backgroundColors = BRACKET_CONFIG.map(b => b.color);
    const labels = BRACKET_CONFIG.map(b => b.name);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: '#0f172a',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            padding: 10,
            callbacks: {
              label: function(context) {
                const val = context.parsed;
                const p = ((val / total) * 100).toFixed(1);
                return ` ${context.label}: ${val} สถานี (${p}%)`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [kpiStats, total]);

  const handleLegendHover = (index) => {
    const chart = chartInstanceRef.current;
    if (!chart) return;
    try {
      chart.setActiveElements([{ datasetIndex: 0, index }]);
      chart.update();
    } catch {
      // safe fallback
    }
  };

  const handleLegendLeave = () => {
    const chart = chartInstanceRef.current;
    if (!chart) return;
    try {
      chart.setActiveElements([]);
      chart.update();
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top: Donut on Left & Legend on Right */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
        {/* Donut Chart Ring */}
        <div className="relative w-48 h-48 sm:w-44 sm:h-44 md:w-48 md:h-48 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
          <canvas ref={canvasRef} />
          {/* Center Donut Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-black text-white">{kpiStats.total || 0}</span>
            <span className="text-[11px] font-medium text-slate-400">สถานีทั้งหมด</span>
          </div>
        </div>

        {/* Detailed Right-Hand Legend List */}
        <div className="flex-1 w-full flex flex-col justify-center gap-1.5 min-w-[210px]">
          {legendItems.map(item => (
            <div
              key={item.key}
              onMouseEnter={() => handleLegendHover(item.index)}
              onMouseLeave={handleLegendLeave}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/50 transition-colors text-xs cursor-default"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-slate-200 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono">
                <span className="font-bold text-slate-100">{formatNumber(item.count)} สถานี</span>
                <span className="text-slate-400 text-[11px]">({item.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Urgent Badge */}
      <div className="mt-3 pt-2 text-center border-t border-slate-800/60">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          ระยะไม่เกิน 5 ปี {urgentCount} สถานี ({urgentPct}%)
        </span>
      </div>
    </div>
  );
}
