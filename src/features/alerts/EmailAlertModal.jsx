import React, { useState } from 'react';
import { Bell, Mail, Send, Calendar, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
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
import { sendEmailAlert, runMonthlyCronAlert } from '../../services/api/emailService.js';
import { isZeroYearOneMonth } from '../../utils/calculations.js';

export function EmailAlertModal({
  isOpen,
  onClose,
  stations = []
}) {
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'cron' | 'settings'
  const [destEmail, setDestEmail] = useState(() => {
    return localStorage.getItem('WARA_ALERT_DESTINATION_EMAIL') || 'wara.noreply.app@gmail.com';
  });
  const [customSheetUrl, setCustomSheetUrl] = useState(() => {
    return localStorage.getItem('CUSTOM_SHEET_URL') || '';
  });

  const [statusMessage, setStatusMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Target stations for 0 year 1 month alert
  const targetStations = stations.filter(isZeroYearOneMonth);

  const handleSaveSettings = () => {
    localStorage.setItem('WARA_ALERT_DESTINATION_EMAIL', destEmail.trim());
    if (customSheetUrl.trim()) {
      localStorage.setItem('CUSTOM_SHEET_URL', customSheetUrl.trim());
    } else {
      localStorage.removeItem('CUSTOM_SHEET_URL');
    }
    setStatusMessage({ type: 'success', text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
  };

  const handleSendLiveAlert = async () => {
    if (!targetStations.length) {
      setStatusMessage({ type: 'warning', text: 'ไม่พบสถานีที่เข้าเกณฑ์วาระ 0 ปี 1 เดือน' });
      return;
    }

    setIsSending(true);
    setStatusMessage({ type: 'info', text: 'กำลังส่ง Email Alert ไปยัง USO Project Team...' });

    try {
      await sendEmailAlert(targetStations, false, destEmail.trim());
      setStatusMessage({
        type: 'success',
        text: `ส่ง Live Alert สำเร็จ! ไปยัง ${destEmail} (พบ ${targetStations.length} สถานีวิกฤต)`
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: `ส่งไม่สำเร็จ: ${err.message || 'โปรดตรวจสอบการเชื่อมต่อ SMTP'}` });
    } finally {
      setIsSending(false);
    }
  };

  const handleRunMonthlyCron = async () => {
    setIsSending(true);
    setStatusMessage({ type: 'info', text: 'กำลังทดสอบประมวลผล Scheduled Monthly Alert Cron...' });

    try {
      await runMonthlyCronAlert(destEmail.trim());
      setStatusMessage({
        type: 'success',
        text: `ประมวลผล Cron จำลองสำเร็จ! ข้อมูลถูกส่งต่อไปยัง ${destEmail}`
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: `รัน Cron ไม่สำเร็จ: ${err.message || 'ข้อผิดพลาดระบบ'}` });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-6 flex flex-col max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <DialogTitle>ระบบจัดการการแจ้งเตือนและการตั้งค่าชีต</DialogTitle>
          </div>
          <DialogDescription>
            แจ้งเตือนอัตโนมัติเมื่อวาระเข้าสู่ภาวะวิกฤต (0 ปี 1 เดือน) และตั้งค่าปลายทาง Email
          </DialogDescription>
        </DialogHeader>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 my-2 text-xs">
          <button
            onClick={() => { setActiveTab('live'); setStatusMessage(null); }}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'live' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ส่ง Live Alert ทันที
          </button>
          <button
            onClick={() => { setActiveTab('cron'); setStatusMessage(null); }}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'cron' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ทดสอบ Monthly Cron
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setStatusMessage(null); }}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ตั้งค่าชีต & อีเมล
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar my-2 space-y-4 text-xs">
          {activeTab === 'live' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/50">
                <div className="font-bold text-rose-300 text-sm mb-1">
                  สถานีที่เข้าเกณฑ์วาระ 0 ปี 1 เดือน (พบ {targetStations.length} สถานี)
                </div>
                <p className="text-slate-400">
                  ระบบจะสร้างสรุปรายชื่อหมู่บ้าน ตำบล อำเภอ จังหวัด และเบอร์ติดต่อส่งตรงไปยังทีมงาน USO Project Team
                </p>
              </div>

              {targetStations.length > 0 ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-2 bg-slate-800/80 font-semibold text-slate-300">
                    รายชื่อสถานีที่ต้องตรวจสอบเร่งด่วน:
                  </div>
                  <div className="divide-y divide-slate-800 max-h-44 overflow-y-auto custom-scrollbar">
                    {targetStations.map(s => (
                      <div key={s.id} className="p-2.5 flex items-center justify-between text-slate-200">
                        <div>
                          <div className="font-bold">{s.village}</div>
                          <div className="text-[11px] text-slate-400">
                            ต.{s.subdistrict} อ.{s.district} จ.{s.province}
                          </div>
                        </div>
                        <span className="text-rose-400 font-bold font-mono px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800">
                          {s.term}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 bg-slate-800/40 rounded-xl">
                  ขณะนี้ไม่มีสถานีใดที่อยู่ในช่วงวิกฤต 0 ปี 1 เดือน
                </div>
              )}

              <Button
                variant="danger"
                size="default"
                onClick={handleSendLiveAlert}
                disabled={isSending || targetStations.length === 0}
                className="w-full mt-2"
              >
                <Send className="w-4 h-4 mr-1.5" />
                <span>{isSending ? 'กำลังส่งแจ้งเตือน...' : 'ส่ง Live Alert ตอนนี้'}</span>
              </Button>
            </div>
          )}

          {activeTab === 'cron' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/50">
                <div className="font-bold text-blue-300 text-sm mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Scheduled Monthly Alert Cron (0 9 1 * *)</span>
                </div>
                <p className="text-slate-400">
                  ระบบอัตโนมัติตั้งเวลาทำงานทุกวันที่ 1 ของทุกเดือน เวลา 09:00 น. เพื่อสรุปรายงานและส่งเมลแจ้งเตือน
                </p>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <div className="text-slate-300 font-medium mb-1">การจำลองคำสั่ง Cron:</div>
                <p className="text-slate-400">
                  กดปุ่มด้านล่างเพื่อทดสอบยิง API ไปยังเซิร์ฟเวอร์ Netlify Functions หรือ Local PowerShell Server
                </p>
              </div>

              <Button
                variant="primary"
                size="default"
                onClick={handleRunMonthlyCron}
                disabled={isSending}
                className="w-full mt-2"
              >
                <Send className="w-4 h-4 mr-1.5" />
                <span>{isSending ? 'กำลังประมวลผล...' : 'ทดสอบสั่งรัน Monthly Cron'}</span>
              </Button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  อีเมลปลายทางรับการแจ้งเตือน (Destination Email):
                </label>
                <Input
                  type="email"
                  value={destEmail}
                  onChange={(e) => setDestEmail(e.target.value)}
                  placeholder="vara.noreply.app@gmail.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Google Sheet Published CSV URL (กำหนดเอง):
                </label>
                <Input
                  type="url"
                  value={customSheetUrl}
                  onChange={(e) => setCustomSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  เว้นว่างไว้เพื่อใช้ URL เริ่มต้นของระบบ หรือกรอก Published CSV Link
                </p>
              </div>

              <Button
                variant="default"
                size="default"
                onClick={handleSaveSettings}
                className="w-full mt-2"
              >
                <Settings className="w-4 h-4 mr-1.5" />
                <span>บันทึกการตั้งค่า</span>
              </Button>
            </div>
          )}

          {/* Feedback Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : statusMessage.type === 'warning'
                  ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                  : 'bg-blue-950/40 border-blue-800 text-blue-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            ปิดหน้าต่าง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
