import React, { useState } from 'react';
import { Download, RotateCcw, Building2, FileText, Loader2 } from 'lucide-react';
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
import { Input } from '../../components/ui/input.jsx';
import { formatThb } from '../../utils/formatters.js';
import { exportBracketSitesCsv } from '../../utils/exportCsv.js';
import { ExecutiveAllInOneDocument } from '../pdf-export/ExecutiveAllInOneDocument.jsx';

export function SiteBudgetModal({
  isOpen,
  onClose,
  bracket,
  stations = [],
  siteBudgets = {},
  siteBaseBudgets = {},
  baseBudget = 20000,
  additionalBudget = 0,
  onUpdateSiteBudget,
  onUpdateSiteBaseBudget,
  onResetBracketSites,
  budgetMetrics,
  provinceSummary,
  intervalsData,
  totalIntervalBudget = 0,
  selectedProvince = 'ทั้งหมด'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!bracket) return null;

  const bracketStations = stations.filter(s => s.termKey === bracket.key);
  const filtered = bracketStations.filter(s => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (s.village || '').toLowerCase().includes(q) ||
      (s.subdistrict || '').toLowerCase().includes(q) ||
      (s.district || '').toLowerCase().includes(q) ||
      (s.province || '').toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  });

  const totalBracketCost = bracketStations.reduce((sum, s) => {
    const sBase = siteBaseBudgets[s.id] !== undefined && siteBaseBudgets[s.id] !== '' ? Number(siteBaseBudgets[s.id]) : baseBudget;
    const sAdd = siteBudgets[s.id] !== undefined && siteBudgets[s.id] !== '' ? Number(siteBudgets[s.id]) : additionalBudget;
    return sum + sBase + sAdd;
  }, 0);

  const handleExportCsv = () => {
    exportBracketSitesCsv(
      bracket.key,
      bracket.name,
      bracketStations,
      siteBudgets,
      baseBudget,
      additionalBudget,
      siteBaseBudgets
    );
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const scopeName = selectedProvince === 'ทั้งหมด'
        ? 'ภาพรวมทั้งสิ้น 10 จังหวัด (181 สถานี)'
        : `เฉพาะจังหวัด ${selectedProvince}`;

      const doc = (
        <ExecutiveAllInOneDocument
          scopeName={scopeName}
          selectedIntervalKey={bracket.key}
          budgetMetrics={budgetMetrics || { rows: [] }}
          provincesData={provinceSummary?.rows || []}
          intervalsData={intervalsData || []}
          stations={stations}
          siteBudgets={siteBudgets}
          siteBaseBudgets={siteBaseBudgets}
          budgetMap={{ [bracket.key]: baseBudget }}
          additionalBudgetMap={{ [bracket.key]: additionalBudget }}
          totalStations={stations.length}
          totalIntervalBudget={totalIntervalBudget}
        />
      );

      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const cleanBracketName = bracket.name.replace(/[^a-zA-Z0-9ก-๙]/g, '');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `รายงานรวมผู้บริหารหน้าเดียว_${cleanBracketName}_${selectedProvince}_${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting PDF from SiteBudgetModal:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <DialogTitle>
              กำหนดงบประมาณเฉพาะไซต์ — ช่วง {bracket.name} ({bracketStations.length} สถานี)
            </DialogTitle>
          </div>
          <DialogDescription>
            ปรับแต่งงบประมาณเพิ่มเติมสำหรับแต่ละหมู่บ้าน/สถานี หรือดาวน์โหลดไฟล์ CSV
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-2">
          <Input
            placeholder="ค้นหาหมู่บ้าน, ตำบล, อำเภอ, จังหวัด หรือรหัสสถานี..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm h-9 text-xs"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResetBracketSites(bracket.key, bracketStations)}
              className="text-xs text-rose-400 hover:text-rose-300 border-rose-900/50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตค่าช่วงนี้</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="text-xs font-semibold"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 mr-1" />
              )}
              <span>{isExportingPdf ? 'กำลังสร้าง PDF...' : 'ส่งออก PDF หน้าเดียว'}</span>
            </Button>
          </div>
        </div>

        {/* Stations Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-800 rounded-xl my-2">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-800/90 text-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-2.5 text-center w-12">ลำดับ TOR</th>
                <th className="p-2.5">หมู่บ้าน / สถานที่</th>
                <th className="p-2.5">ตำบล / อำเภอ / จังหวัด</th>
                <th className="p-2.5 text-center">วาระคงเหลือ</th>
                <th className="p-2.5 text-right">งบตั้งต้น/สถานี</th>
                <th className="p-2.5 text-right">งบเพิ่มเติม/สถานี</th>
                <th className="p-2.5 text-right">งบประมาณรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(station => {
                const stationBase = siteBaseBudgets[station.id] !== undefined ? siteBaseBudgets[station.id] : baseBudget;
                const stationAdd = siteBudgets[station.id] !== undefined ? siteBudgets[station.id] : additionalBudget;
                const net = (Number(stationBase) || 0) + (Number(stationAdd) || 0);

                return (
                  <tr key={station.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 text-center font-mono text-slate-400">{station.id}</td>
                    <td className="p-2.5 font-medium text-slate-100">{station.village}</td>
                    <td className="p-2.5 text-slate-400">
                      ต.{station.subdistrict} อ.{station.district} จ.{station.province}
                    </td>
                    <td className="p-2.5 text-center font-semibold" style={{ color: bracket.color }}>
                      {station.term}
                    </td>
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={stationBase}
                        onChange={(e) => onUpdateSiteBaseBudget && onUpdateSiteBaseBudget(station.id, e.target.value)}
                        className="w-28 text-right px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={stationAdd}
                        onChange={(e) => onUpdateSiteBudget && onUpdateSiteBudget(station.id, e.target.value)}
                        className="w-28 text-right px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5 text-right font-bold text-blue-400 font-mono">
                      {formatThb(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <DialogFooter className="flex items-center justify-between border-t border-slate-800 pt-3">
          <div className="text-xs text-slate-400">
            งบประมาณรวมช่วง {bracket.name}: <span className="text-base font-bold text-blue-400">{formatThb(totalBracketCost)}</span>
          </div>
          <Button variant="default" size="sm" onClick={onClose}>
            ปิดหน้าต่าง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
