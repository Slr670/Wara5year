import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { BRACKET_CONFIG } from '../../config/brackets.config.js';

export function TenureDonutChart({ kpiStats }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const urgentCount = (kpiStats.lt1 || 0) + (kpiStats.y1 || 0) + (kpiStats.y2 || 0) + (kpiStats.y3 || 0) + (kpiStats.y4 || 0);
  const total = kpiStats.total || 1;
  const urgentPct = ((urgentCount / total) * 100).toFixed(1);

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

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-64">
      <div className="relative w-full h-52">
        <canvas ref={canvasRef} />
        {/* Center Donut Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-2xl font-black text-white">{kpiStats.total || 0}</span>
          <span className="text-[11px] font-medium text-slate-400">สถานีทั้งหมด</span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          ระยะไม่เกิน 5 ปี {urgentCount} สถานี ({urgentPct}%)
        </span>
      </div>
    </div>
  );
}
