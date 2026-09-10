import React, { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../components/ui/dialog.jsx';
import { Button } from '../../components/ui/button.jsx';
import { WaraSummaryReportDocument } from './WaraSummaryReportDocument.jsx';
import { TenureIntervalAnalysisDocument } from './TenureIntervalAnalysisDocument.jsx';
import { ExecutiveAllInOneDocument } from './ExecutiveAllInOneDocument.jsx';
import { BRACKET_CONFIG } from '../../config/brackets.config.js';

export function PdfExportDialog({
  isOpen,
  onClose,
  budgetMetrics,
  provinceSummary,
  intervalsData,
  totalStations = 181,
  totalIntervalBudget = 0,
  selectedProvince = 'ทั้งหมด',
  stations = [],
  siteBudgets = {},
  siteBaseBudgets = {},
  budgetMap = {},
  additionalBudgetMap = {}
}) {
  const [loadingType, setLoadingType] = useState(null); // null | 'summary' | 'interval' | 'allInOne'
  const [selectedIntervalKey, setSelectedIntervalKey] = useState('lt1');

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSummaryReport = async () => {
    setLoadingType('summary');
    try {
      const scopeName = selectedProvince === 'ทั้งหมด'
        ? 'ภาพรวมทั้งสิ้น 10 จังหวัด (181 สถานี)'
        : `เฉพาะจังหวัด ${selectedProvince}`;

      const doc = (
        <WaraSummaryReportDocument
          scopeName={scopeName}
          budgetMetrics={budgetMetrics}
          provincesData={provinceSummary.rows}
          intervalsData={intervalsData}
          totalStations={totalStations}
          totalIntervalBudget={totalIntervalBudget}
        />
      );

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      downloadBlob(blob, `รายงานสรุปวาระและงบประมาณ_${selectedProvince}_${dateStr}.pdf`);
    } catch (err) {
      console.error('Error generating summary PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF สรุปภาพรวม');
    } finally {
      setLoadingType(null);
    }
  };

  const handleExportIntervalReport = async () => {
    setLoadingType('interval');
    try {
      const doc = (
        <TenureIntervalAnalysisDocument
          scopeName="ภาพรวมทุกช่วงเวลา (181 สถานี)"
          intervalsData={intervalsData}
          totalStations={totalStations}
          totalBudget={totalIntervalBudget}
        />
      );

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      downloadBlob(blob, `รายงานวิเคราะห์วาระและความสูงเสาอากาศ_${dateStr}.pdf`);
    } catch (err) {
      console.error('Error generating interval PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF วิเคราะห์เสาอากาศ');
    } finally {
      setLoadingType(null);
    }
  };

  const handleExportAllInOneReport = async () => {
    setLoadingType('allInOne');
    try {
      const scopeName = selectedProvince === 'ทั้งหมด'
        ? 'ภาพรวมทั้งสิ้น 10 จังหวัด (181 สถานี)'
        : `เฉพาะจังหวัด ${selectedProvince}`;

      const targetBracket = BRACKET_CONFIG.find(b => b.key === selectedIntervalKey) || BRACKET_CONFIG[0];

      const doc = (
        <ExecutiveAllInOneDocument
          scopeName={scopeName}
          selectedIntervalKey={selectedIntervalKey}
          budgetMetrics={budgetMetrics}
          provincesData={provinceSummary.rows}
          intervalsData={intervalsData}
          stations={stations}
          siteBudgets={siteBudgets}
          siteBaseBudgets={siteBaseBudgets}
          budgetMap={budgetMap}
          additionalBudgetMap={additionalBudgetMap}
          totalStations={totalStations}
          totalIntervalBudget={totalIntervalBudget}
        />
      );

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const cleanBracketName = targetBracket.name.replace(/[^a-zA-Z0-9ก-๙]/g, '');
      downloadBlob(blob, `รายงานรวมผู้บริหารหน้าเดียว_${cleanBracketName}_${selectedProvince}_${dateStr}.pdf`);
    } catch (err) {
      console.error('Error generating all-in-one PDF:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF รายงานรวมผู้บริหารแบบหน้าเดียว');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg p-6">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-base font-bold">
            ส่งออกรายงาน PDF ระดับองค์กร
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            เลือกรูปแบบรายงาน PDF ที่ต้องการดาวน์โหลด พร้อมรูปแบบกราฟิกและตารางสมบูรณ์
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-3">
          {/* Report 1: Executive Summary */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-850/60 hover:border-blue-500/40 transition-colors flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-slate-100">
                1. รายงานสรุปภาพรวมวาระและงบประมาณ
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                ขนาด A4 แนวตั้ง (Portrait) • รวมตารางงบประมาณและสรุป 10 จังหวัด
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportSummaryReport}
              disabled={loadingType !== null}
              className="shrink-0 text-xs"
            >
              {loadingType === 'summary' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1" />
              )}
              <span>{loadingType === 'summary' ? 'กำลังสร้าง...' : 'ดาวน์โหลด'}</span>
            </Button>
          </div>

          {/* Report 2: Tower & Interval Analysis */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-850/60 hover:border-blue-500/40 transition-colors flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-slate-100">
                2. รายงานวิเคราะห์วาระและความสูงเสาอากาศ
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                ขนาด A4 แนวนอน (Landscape) • จำแนกความสูงเสา 9m, 18m, 30m และ Type A, B, C
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportIntervalReport}
              disabled={loadingType !== null}
              className="shrink-0 text-xs"
            >
              {loadingType === 'interval' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1" />
              )}
              <span>{loadingType === 'interval' ? 'กำลังสร้าง...' : 'ดาวน์โหลด'}</span>
            </Button>
          </div>

          {/* Report 3: Executive All-in-One Report */}
          <div className="p-4 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-950/30 to-slate-850/80 hover:border-blue-400/60 transition-colors flex flex-col gap-3">
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center justify-between">
                <span>3. รายงานรวมผู้บริหารแบบหน้าเดียว (Executive All-in-One Report)</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-medium">
                  Single Page
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                รวมรายละเอียดสถานีเฉพาะไซต์รายวาระ + งบประมาณรายวาระ + วิเคราะห์ประเภทเสา + ข้อมูลแยกรายจังหวัด ครบในหน้าเดียว
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <label htmlFor="report-interval-select" className="text-xs text-slate-300 font-medium whitespace-nowrap">
                  ช่วงวาระสถานี:
                </label>
                <select
                  id="report-interval-select"
                  value={selectedIntervalKey}
                  onChange={(e) => setSelectedIntervalKey(e.target.value)}
                  className="bg-slate-900/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {BRACKET_CONFIG.map(b => {
                    const bCount = (stations || []).filter(s => s.termKey === b.key).length;
                    return (
                      <option key={b.key} value={b.key}>
                        {b.name} ({bCount} สถานี) — {b.priority}
                      </option>
                    );
                  })}
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleExportAllInOneReport}
                disabled={loadingType !== null}
                className="shrink-0 text-xs font-semibold"
              >
                {loadingType === 'allInOne' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1" />
                )}
                <span>{loadingType === 'allInOne' ? 'กำลังสร้าง...' : 'ดาวน์โหลด'}</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loadingType !== null}>
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
