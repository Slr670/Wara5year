import React, { useState, Suspense } from 'react';
import { AuroraBackground } from '../components/react-bits/AuroraBackground.jsx';
import { PageHeader } from '../features/header/PageHeader.jsx';
import { Topbar } from '../features/header/Topbar.jsx';
import { KpiGrid } from '../features/kpi/KpiGrid.jsx';
import { SummaryTable } from '../features/summary-table/SummaryTable.jsx';
import { BudgetSection } from '../features/budget/BudgetSection.jsx';
import { IntervalSection } from '../features/intervals/IntervalSection.jsx';
import { VillageFilters } from '../features/villages/VillageFilters.jsx';
import { VillageGrid } from '../features/villages/VillageGrid.jsx';

import { useWaraData } from '../hooks/useWaraData.js';
import { useGoogleSheetSync } from '../hooks/useGoogleSheetSync.js';
import { useBudgetMetrics } from '../hooks/useBudgetMetrics.js';
import { useIntervalMetrics } from '../hooks/useIntervalMetrics.js';
import { APP_CONFIG, APP_VERSION } from '../config/app.config.js';

// Lazy-loaded heavy modules for optimal Lighthouse Performance & TBT
const ChartSection = React.lazy(() =>
  import('../features/charts/ChartSection.jsx').then(m => ({ default: m.ChartSection }))
);
const AntennaMap = React.lazy(() =>
  import('../features/map/AntennaMap.jsx').then(m => ({ default: m.AntennaMap }))
);
const PasswordAuthModal = React.lazy(() =>
  import('../features/alerts/PasswordAuthModal.jsx').then(m => ({ default: m.PasswordAuthModal }))
);
const PdfExportDialog = React.lazy(() =>
  import('../features/pdf-export/PdfExportDialog.jsx').then(m => ({ default: m.PdfExportDialog }))
);
const SettingsModal = React.lazy(() =>
  import('../features/settings/SettingsModal.jsx').then(m => ({ default: m.SettingsModal }))
);

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 animate-pulse" aria-hidden="true">
      <div className="lg:col-span-5 h-[340px] rounded-2xl bg-slate-900/60 border border-slate-800/80" />
      <div className="lg:col-span-7 h-[340px] rounded-2xl bg-slate-900/60 border border-slate-800/80" />
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="w-full h-[460px] rounded-2xl bg-slate-900/60 border border-slate-800/80 mb-6 flex flex-col items-center justify-center gap-2 animate-pulse" aria-hidden="true">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500/40 border-t-blue-500 animate-spin" />
      <span className="text-xs text-slate-400 font-medium">กำลังโหลดแผนที่ตำแหน่งสถานี...</span>
    </div>
  );
}

export function DashboardPage() {
  const {
    stations,
    setStations,
    selectedProvince,
    setSelectedProvince,
    selectedTermKey,
    setSelectedTermKey,
    searchQuery,
    setSearchQuery,
    filteredStations,
    provinceStations,
    kpiStats,
    provinceSummary
  } = useWaraData();

  const {
    isSyncing,
    syncMessage,
    syncData
  } = useGoogleSheetSync(setStations);

  const {
    budgetMap,
    additionalBudgetMap,
    siteBudgets,
    siteBaseBudgets,
    metrics: budgetMetrics,
    updateBaseBudget,
    updateAdditionalBudget,
    updateSiteBudget,
    updateSiteBaseBudget,
    resetBracketSiteBudgets
  } = useBudgetMetrics(provinceStations);

  const {
    intervalsData,
    totalIntervalBudget
  } = useIntervalMetrics(provinceStations, budgetMap, siteBaseBudgets, siteBudgets, additionalBudgetMap);

  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedMapStation, setSelectedMapStation] = useState(null);

  return (
    <AuroraBackground className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Top Page Header */}
        <PageHeader
          totalStations={stations.length || 181}
          totalProvinces={provinceSummary?.length || 10}
        />

        {/* Topbar */}
        <Topbar
          isSyncing={isSyncing}
          syncMessage={syncMessage}
          onManualSync={syncData}
          onOpenPdfDialog={() => setIsPdfModalOpen(true)}
          onOpenSettings={() => setIsPasswordModalOpen(true)}
        />

        {/* 1. KPI Metric Cards */}
        <KpiGrid
          kpiStats={kpiStats}
          selectedTermKey={selectedTermKey}
          onSelectTermKey={setSelectedTermKey}
        />

        {/* 2. Charts Section */}
        <Suspense fallback={<ChartSkeleton />}>
          <ChartSection kpiStats={kpiStats} />
        </Suspense>

        {/* 3. Interactive Antenna Map */}
        <Suspense fallback={<MapSkeleton />}>
          <AntennaMap
            stations={filteredStations}
            selectedStation={selectedMapStation}
            onSelectStation={(s) => setSelectedMapStation(s)}
          />
        </Suspense>

        {/* 4. Province Summary Table with Sticky Column */}
        <SummaryTable
          provinceSummary={provinceSummary}
          selectedProvince={selectedProvince}
          onSelectProvince={setSelectedProvince}
        />

        {/* 5. Budget Matrix & Site Adjustment Section */}
        <BudgetSection
          metrics={budgetMetrics}
          stations={provinceStations}
          siteBudgets={siteBudgets}
          siteBaseBudgets={siteBaseBudgets}
          budgetMap={budgetMap}
          additionalBudgetMap={additionalBudgetMap}
          onUpdateSiteBudget={updateSiteBudget}
          onUpdateSiteBaseBudget={updateSiteBaseBudget}
          onResetBracketSites={resetBracketSiteBudgets}
          provinceSummary={provinceSummary}
          intervalsData={intervalsData}
          totalIntervalBudget={totalIntervalBudget}
          selectedProvince={selectedProvince}
        />

        {/* 6. Tenure & Tower Height Intervals Breakdown */}
        <IntervalSection
          intervalsData={intervalsData}
          totalStations={provinceStations.length}
          totalIntervalBudget={totalIntervalBudget}
          onSelectInterval={(key) => setSelectedTermKey(key)}
        />

        {/* 7. Village Directory Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-100">
              รายชื่อสถานีและหมู่บ้านในพื้นที่ USO ({filteredStations.length} สถานี)
            </h3>
          </div>
          <VillageFilters
            selectedProvince={selectedProvince}
            onSelectProvince={setSelectedProvince}
            selectedTermKey={selectedTermKey}
            onSelectTermKey={setSelectedTermKey}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalCount={filteredStations.length}
          />
          <VillageGrid
            stations={filteredStations}
            onSelectStation={(s) => {
              setSelectedMapStation(s);
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 pb-8 border-t border-slate-850 text-center text-xs text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">
            {APP_CONFIG.companyTh} — {APP_CONFIG.companyEn}
          </div>
          <div className="text-[11px] text-slate-400">
            {APP_CONFIG.companyAddress}
          </div>
          <div>
            {APP_CONFIG.fullName} • เวอร์ชัน <span className="font-mono text-blue-400 font-bold">{APP_VERSION}</span>
          </div>
        </footer>
      </main>

      {/* Password Authentication Modal */}
      {isPasswordModalOpen && (
        <Suspense fallback={null}>
          <PasswordAuthModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            onSuccess={() => setIsSettingsModalOpen(true)}
          />
        </Suspense>
      )}

      {/* System Settings & Notification Modal */}
      {isSettingsModalOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            stations={stations}
          />
        </Suspense>
      )}

      {/* PDF Export Dialog */}
      {isPdfModalOpen && (
        <Suspense fallback={null}>
          <PdfExportDialog
            isOpen={isPdfModalOpen}
            onClose={() => setIsPdfModalOpen(false)}
            budgetMetrics={budgetMetrics}
            provinceSummary={provinceSummary}
            intervalsData={intervalsData}
            totalStations={provinceStations.length}
            totalIntervalBudget={totalIntervalBudget}
            selectedProvince={selectedProvince}
            stations={provinceStations}
            siteBudgets={siteBudgets}
            siteBaseBudgets={siteBaseBudgets}
            budgetMap={budgetMap}
            additionalBudgetMap={additionalBudgetMap}
          />
        </Suspense>
      )}
    </AuroraBackground>
  );
}
