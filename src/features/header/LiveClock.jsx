import React, { useState, useEffect } from 'react';
import { formatDateThai, formatTimeThai } from '../../utils/formatters.js';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end text-right select-none">
      <span className="text-sm sm:text-base font-bold text-slate-100 font-mono tracking-tight">
        {formatTimeThai(time)}
      </span>
      <span className="text-xs text-slate-400">
        {formatDateThai(time)}
      </span>
    </div>
  );
}
