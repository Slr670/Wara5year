import React, { useState } from 'react';
import { AuroraBackground } from '../components/react-bits/AuroraBackground.jsx';
import { PageHeader } from '../features/header/PageHeader.jsx';
import { Topbar } from '../features/header/Topbar.jsx';
import { KpiGrid } from '../features/kpi/KpiGrid.jsx';
import { ChartSection } from '../features/charts/ChartSection.jsx';
import { AntennaMap } from '../features/map/AntennaMap.jsx';
import { SummaryTable } from '../features/summary-table/SummaryTable.jsx';
import { BudgetSection } from '../features/budget/BudgetSection.jsx';
import { IntervalSection } from '../features/intervals/IntervalSection.jsx';
import { VillageFilters } from '../features/villages/VillageFilters.jsx';
import { VillageGrid } from '../features/villages/VillageGrid.jsx';
import { PasswordAuthModal } from '../features/alerts/PasswordAuthModal.jsx';
import { EmailAlertModal } from '../features/alerts/EmailAlertModal.jsx';
import { PdfExportDialog } from '../features/pdf-export/PdfExportDialog.jsx';

import { useWaraData } from '../hooks/useWaraData.js';
import { useGoogleSheetSync } from '../hooks/useGoogleSheetSync.js';
import { useBudgetMetrics } from '../hooks/useBudgetMetrics.js';
import { useIntervalMetrics } from '../hooks/useIntervalMetrics.js';
import { APP_CONFIG, APP_VERSION } from '../config/app.config.js';

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
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
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
          onOpenAlertModal={() => setIsAlertModalOpen(true)}
        />

        {/* 1. KPI Metric Cards */}
        <KpiGrid
          kpiStats={kpiStats}
          selectedTermKey={selectedTermKey}
          onSelectTermKey={setSelectedTermKey}
        />

        {/* 2. Charts Section */}
        <ChartSection kpiStats={kpiStats} />

        {/* 3. Interactive Antenna Map */}
        <AntennaMap
          stations={filteredStations}
          selectedStation={selectedMapStation}
          onSelectStation={(s) => setSelectedMapStation(s)}
        />

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
          <div>
            {APP_CONFIG.fullName} • เวอร์ชัน <span className="font-mono text-blue-400 font-bold">{APP_VERSION}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {APP_CONFIG.companyAddress}
          </div>
        </footer>
      </main>

      {/* Password Authentication Modal */}
      <PasswordAuthModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => setIsAlertModalOpen(true)}
      />

      {/* Email Alert & Settings Modal */}
      <EmailAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        stations={stations}
      />

      {/* PDF Export Dialog */}
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
    </AuroraBackground>
  );
}
