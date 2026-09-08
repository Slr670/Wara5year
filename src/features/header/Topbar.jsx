import React from 'react';
import { RefreshCw, FileDown, Settings, Bell } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { BorderBeam } from '../../components/react-bits/BorderBeam.jsx';
import { LiveClock } from './LiveClock.jsx';
import { APP_VERSION } from '../../config/app.config.js';

export function Topbar({
  isSyncing,
  syncMessage,
  onManualSync,
  onOpenPdfDialog,
  onOpenSettings,
  onOpenAlertModal
}) {
  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg mb-6">
      {/* Left: Branding & Sync Chip */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSyncing ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isSyncing ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          </div>
          <div className="relative overflow-hidden rounded-xl bg-slate-800/80 px-3 py-1.5 border border-slate-700/60 text-xs text-slate-300 font-medium flex items-center gap-2">
            <BorderBeam size={120} duration={8} colorFrom="#38bdf8" colorTo="#818cf8" />
            <span className="truncate max-w-[220px] sm:max-w-xs">{syncMessage}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onManualSync}
          disabled={isSyncing}
          className="text-xs text-slate-400 hover:text-white"
          title="ซิงค์ข้อมูล Google Sheet ตอนนี้"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden sm:inline">ซิงค์ชีต</span>
        </Button>
      </div>

      {/* Right: Actions & Clock */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenPdfDialog}
          className="shadow-blue-500/20"
        >
          <FileDown className="w-4 h-4" />
          <span>ส่งออก PDF</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenAlertModal}
          className="border-slate-700/80"
          title="ระบบแจ้งเตือนทาง Email"
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">การแจ้งเตือน</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenSettings}
          className="border-slate-700/80"
          title="ตั้งค่า Google Sheet"
        >
          <Settings className="w-4 h-4 text-slate-300" />
          <span className="hidden sm:inline">ตั้งค่าชีต</span>
        </Button>

        <div className="hidden lg:block pl-2 border-l border-slate-800">
          <LiveClock />
        </div>

        <span className="text-[11px] font-semibold text-blue-400/90 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md select-none">
          {APP_VERSION}
        </span>
      </div>
    </header>
  );
}
