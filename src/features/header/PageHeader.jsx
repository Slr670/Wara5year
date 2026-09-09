import React from 'react';
import { ShieldCheck, MapPin } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config.js';

export function PageHeader({ totalStations = 181, totalProvinces = 10 }) {
  return (
    <header className="mb-6 pb-5 border-b border-slate-800/80">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Official Logo & Exact Title & Subtitle */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="shrink-0 flex items-center justify-center w-12 h-12 p-1.5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 shadow-lg shadow-blue-500/5 overflow-hidden">
            <img
              src="/images/NBTC1.png"
              alt="ตราสัญลักษณ์ทางการ"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold tracking-tight text-white font-sans">
              วาระคงเหลือเจ้าหน้าที่รัฐ กรมการปกครอง
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium flex items-center gap-2 flex-wrap">
              <span>ระบบติดตามวาระคงเหลือและการบริหารจัดการงบประมาณ {totalStations} สถานี USO</span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-slate-500">Department of Provincial Administration</span>
            </p>
          </div>
        </div>

        {/* Right: Meta Summary Pills */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-medium backdrop-blur-md shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span><strong className="text-white font-semibold">{totalStations}</strong> สถานี</span>
            <span className="text-slate-600">•</span>
            <span><strong className="text-white font-semibold">{totalProvinces}</strong> จังหวัด</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ข้อมูลทางการ กรมการปกครอง</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default PageHeader;
