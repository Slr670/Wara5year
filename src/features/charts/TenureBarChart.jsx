import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { BRACKET_CONFIG } from '../../config/brackets.config.js';

export function TenureBarChart({ kpiStats }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    const labels = BRACKET_CONFIG.map(b => b.name);
    const dataValues = BRACKET_CONFIG.map(b => kpiStats[b.key] || 0);
    const backgroundColors = BRACKET_CONFIG.map(b => b.color);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.65
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
                return ` ${context.parsed.y} สถานี`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 11, family: 'Prompt, sans-serif' }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(51, 65, 85, 0.4)'
            },
            ticks: {
              color: '#94a3b8',
              stepSize: 10,
              font: { size: 10 }
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
  }, [kpiStats]);

  return (
    <div className="w-full h-64">
      <canvas ref={canvasRef} />
    </div>
  );
}
