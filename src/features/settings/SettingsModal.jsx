import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Lock,
  ShieldCheck,
  Send,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Mail,
  Zap
} from 'lucide-react';
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
import {
  DEFAULT_SMTP_CONFIG,
  getSavedSmtpConfig,
  saveSmtpConfig,
  sendEmailAlert
} from '../../services/api/emailService.js';

export function SettingsModal({
  isOpen,
  onClose,
  defaultTab = 'smtp'
}) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'sheet' | 'smtp'

  // Tab 1: Google Sheet & General Settings
  const [destEmail, setDestEmail] = useState(() => {
    return localStorage.getItem('WARA_ALERT_DESTINATION_EMAIL') || 'wara.noreply.app@gmail.com';
  });
  const [customSheetUrl, setCustomSheetUrl] = useState(() => {
    return localStorage.getItem('CUSTOM_SHEET_URL') || '';
  });

  // Tab 2: SMTP Configuration State
  const [smtpConfig, setSmtpConfig] = useState(getSavedSmtpConfig);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState(destEmail);

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync saved config when modal opens
  useEffect(() => {
    if (isOpen) {
      setSmtpConfig(getSavedSmtpConfig());
      setDestEmail(localStorage.getItem('WARA_ALERT_DESTINATION_EMAIL') || 'wara.noreply.app@gmail.com');
      setCustomSheetUrl(localStorage.getItem('CUSTOM_SHEET_URL') || '');
      setStatusMessage(null);
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setSmtpConfig((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Preset: Gmail Defaults
  const applyGmailPreset = () => {
    const gmailPreset = {
      ...DEFAULT_SMTP_CONFIG,
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_user: 'wara.noreply.app@gmail.com',
      sender_email: 'wara.noreply.app@gmail.com',
      sender_name: 'USO Project Team',
      smtp_secure: false,
      reject_unauthorized: true
    };
    setSmtpConfig(gmailPreset);
    setStatusMessage({
      type: 'info',
      text: 'โหลดค่า Preset สำหรับ Gmail เรียบร้อยแล้ว (อย่าลืมกรอก App Password หากต้องการใช้บัญชีของตนเอง)'
    });
  };

  // Reset to initial default config
  const resetToDefault = () => {
    setSmtpConfig({ ...DEFAULT_SMTP_CONFIG });
    setStatusMessage({
      type: 'info',
      text: 'รีเซ็ตค่ากลับเป็นค่าเริ่มต้นของระบบแล้ว'
    });
  };

  // Save Google Sheet & General Settings
  const handleSaveSheetSettings = () => {
    localStorage.setItem('WARA_ALERT_DESTINATION_EMAIL', destEmail.trim());
    if (customSheetUrl.trim()) {
      localStorage.setItem('CUSTOM_SHEET_URL', customSheetUrl.trim());
    } else {
      localStorage.removeItem('CUSTOM_SHEET_URL');
    }
    setStatusMessage({ type: 'success', text: 'บันทึกการตั้งค่า Google Sheet & ระบบเรียบร้อยแล้ว' });
  };

  // Save SMTP Settings
  const handleSaveSmtpSettings = (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      const sanitized = {
        ...smtpConfig,
        smtp_host: (smtpConfig.smtp_host || '').trim(),
        smtp_port: parseInt(smtpConfig.smtp_port, 10) || 587,
        smtp_user: (smtpConfig.smtp_user || '').trim(),
        sender_email: (smtpConfig.sender_email || '').trim(),
        sender_name: (smtpConfig.sender_name || '').trim(),
        smtp_pw: (smtpConfig.smtp_pw || '').trim(),
        smtp_secure: Boolean(smtpConfig.smtp_secure),
        reject_unauthorized: Boolean(smtpConfig.reject_unauthorized)
      };

      saveSmtpConfig(sanitized);
      setSmtpConfig(sanitized);
      setStatusMessage({
        type: 'success',
        text: 'บันทึกการตั้งค่าเซิร์ฟเวอร์ SMTP เรียบร้อยแล้ว (Active Config อัปเดตทันที)'
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `เกิดข้อผิดพลาดในการบันทึก: ${err.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Test Email Dispatch via Server API
  const handleTestEmail = async () => {
    const target = (testEmailAddress || destEmail || '').trim();
    if (!target || !target.includes('@')) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณากรอกอีเมลปลายทางสำหรับทดสอบให้ถูกต้อง'
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage({
      type: 'info',
      text: `กำลังส่งคำขอทดสอบไปยังเซิร์ฟเวอร์ผ่าน SMTP (${smtpConfig.smtp_host || 'default'})...`
    });

    try {
      // Pass the current in-form SMTP config so user can test before or after saving
      const res = await sendEmailAlert([], true, target, smtpConfig);
      if (res && res.success) {
        setStatusMessage({
          type: 'success',
          text: `ทดสอบเชื่อมต่อและส่งอีเมลสำเร็จ! ได้รับการตอบรับจากเซิร์ฟเวอร์เรียบร้อย (ปลายทาง: ${target})`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `เซิร์ฟเวอร์ตอบกลับ: ${res?.message || 'ไม่สามารถส่งอีเมลทดสอบได้'}`
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: `ทดสอบไม่สำเร็จ: ${err.message || 'โปรดตรวจสอบ Host, Port, รหัสผ่าน หรือการตั้งค่าความปลอดภัย'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Determine active config indicators
  const isCustomUser = Boolean(smtpConfig.smtp_pw || (smtpConfig.smtp_user && smtpConfig.smtp_user !== DEFAULT_SMTP_CONFIG.smtp_user));
  const activePort = smtpConfig.smtp_port || 587;
  const isSecure = Boolean(smtpConfig.smtp_secure);
  const rejectUnauth = Boolean(smtpConfig.reject_unauthorized);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-6 flex flex-col max-h-[92vh] bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-2xl">
        {/* Header */}
        <DialogHeader className="pb-2 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-100">
                  การตั้งค่าระบบ & เซิร์ฟเวอร์ SMTP
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  กำหนดค่าการเชื่อมต่อฐานข้อมูล Google Sheet และเซิร์ฟเวอร์ส่งจดหมายแจ้งเตือน
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-slate-800 mt-3 text-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('smtp'); setStatusMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all ${
              activeTab === 'smtp'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>เซิร์ฟเวอร์ SMTP (SMTP Server Configuration)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('sheet'); setStatusMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all ${
              activeTab === 'sheet'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheet & ระบบ</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-4 text-xs pr-1">
          {/* TAB 1: SMTP Server Configuration */}
          {activeTab === 'smtp' && (
            <div className="space-y-4">
              {/* Dynamic Active Config Status Chips */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Config Status
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={applyGmailPreset}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors flex items-center gap-1"
                      title="โหลดค่าเริ่มต้น Gmail"
                    >
                      <Zap className="w-3 h-3" />
                      <span>ใช้ค่า Gmail เริ่มต้น</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetToDefault}
                      className="px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 transition-colors flex items-center gap-1"
                      title="รีเซ็ตค่า"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>คืนค่า</span>
                    </button>
                  </div>
                </div>

                {/* Chips Grid */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold border ${
                    isCustomUser
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isCustomUser ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    {isCustomUser ? 'Active Config: Custom Local' : 'Active Config: Default System'}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-mono text-slate-300 bg-slate-800/90 border border-slate-700">
                    <Lock className="w-3 h-3 text-blue-400" />
                    {smtpConfig.smtp_host || 'smtp.gmail.com'}:{activePort}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-medium text-slate-300 bg-slate-800/90 border border-slate-700">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {isSecure ? 'SSL/TLS (Implicit)' : 'STARTTLS (Explicit)'}
                  </span>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] border ${
                    rejectUnauth
                      ? 'bg-slate-800/90 text-slate-300 border-slate-700'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}>
                    {rejectUnauth ? 'TLS: Strict Verify' : 'TLS: Allow Self-Signed'}
                  </span>
                </div>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleSaveSmtpSettings} className="space-y-3.5">
                {/* Row 1: Host & Port */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">
                      SMTP Host <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.smtp_host}
                      onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                      placeholder="e.g. smtp.gmail.com หรือ smtp.office365.com"
                      className="w-full bg-slate-800/90 text-xs text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      SMTP Port <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={smtpConfig.smtp_port}
                      onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                      className="w-full bg-slate-800/90 text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                    >
                      <option value="587">587 (STARTTLS - แนะนำ)</option>
                      <option value="465">465 (SSL/TLS)</option>
                      <option value="25">25 (Standard SMTP)</option>
                      <option value="2525">2525 (Alternative)</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: User & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      SMTP Username / Email Account <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.smtp_user}
                      onChange={(e) => handleInputChange('smtp_user', e.target.value)}
                      placeholder="e.g. wara.noreply.app@gmail.com"
                      className="w-full bg-slate-800/90 text-xs text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-medium">
                        SMTP Password / App Password <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPassword ? 'ซ่อน' : 'แสดง'}</span>
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={smtpConfig.smtp_pw}
                      onChange={(e) => handleInputChange('smtp_pw', e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-slate-800/90 text-xs text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      เว้นว่างไว้เพื่อใช้รหัสผ่านจากค่า Environment ของเซิร์ฟเวอร์
                    </p>
                  </div>
                </div>

                {/* Row 3: Sender Name & Sender Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Sender Name (ชื่อผู้ส่งที่แสดง)
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.sender_name}
                      onChange={(e) => handleInputChange('sender_name', e.target.value)}
                      placeholder="e.g. USO Project Team"
                      className="w-full bg-slate-800/90 text-xs text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Sender Email (อีเมลผู้ส่ง)
                    </label>
                    <input
                      type="email"
                      value={smtpConfig.sender_email}
                      onChange={(e) => handleInputChange('sender_email', e.target.value)}
                      placeholder="e.g. wara.noreply.app@gmail.com"
                      className="w-full bg-slate-800/90 text-xs text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Row 4: Security Toggles */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="text-[11.5px] font-bold text-slate-300">
                    Security & Protocol Options
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 p-2 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={smtpConfig.smtp_secure}
                        onChange={(e) => handleInputChange('smtp_secure', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-200">Enforce SSL/TLS (smtp_secure)</div>
                        <div className="text-[10.5px] text-slate-400">สำหรับพอร์ต 465 (พอร์ต 587 ควรปิดเพื่อให้ใช้ STARTTLS)</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-slate-800/60 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={smtpConfig.reject_unauthorized}
                        onChange={(e) => handleInputChange('reject_unauthorized', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-200">Strict Certificate (reject_unauthorized)</div>
                        <div className="text-[10.5px] text-slate-400">ตรวจสอบใบรับรอง SSL แท้ (ปิดเฉพาะเมื่อทดสอบ self-signed)</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Row 5: Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <Button
                    type="submit"
                    variant="primary"
                    size="default"
                    disabled={isSaving}
                    className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า SMTP (Save Settings)'}</span>
                  </Button>
                </div>
              </form>

              {/* Dedicated Test Email Dispatch Section */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-blue-900/40 space-y-2 mt-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <Send className="w-4 h-4" />
                  <span>ทดสอบเชื่อมต่อและส่งอีเมล (Test Email Dispatch)</span>
                </div>
                <p className="text-[11.5px] text-slate-400">
                  ส่งอีเมลทดสอบเชื่อมต่อตรงไปยังเซิร์ฟเวอร์ SMTP ตามการตั้งค่าปัจจุบัน เพื่อตรวจสอบว่า Host, Port, และ Password ใช้งานได้จริง
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="ใส่อีเมลปลายทางสำหรับรับเมลทดสอบ"
                    className="w-full sm:flex-1 bg-slate-800/90 text-xs text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="default"
                    onClick={handleTestEmail}
                    disabled={isTesting}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-blue-500/30 px-4 py-2 font-semibold rounded-lg flex items-center justify-center gap-2 shrink-0 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isTesting ? 'กำลังเชื่อมต่อและส่ง...' : 'ทดสอบส่งเมล (Test Email)'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Google Sheet & System Settings */}
          {activeTab === 'sheet' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40">
                <div className="font-bold text-blue-300 text-sm mb-1 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>การเชื่อมต่อ Google Sheet & ข้อมูลสถานี</span>
                </div>
                <p className="text-slate-400">
                  ระบบจะดึงข้อมูลหมู่บ้าน ตำบล อำเภอ จังหวัด และวาระคงเหลือจาก Published CSV Link โดยอัตโนมัติ
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    อีเมลปลายทางรับการแจ้งเตือนเริ่มต้น (Default Alert Email):
                  </label>
                  <input
                    type="email"
                    value={destEmail}
                    onChange={(e) => setDestEmail(e.target.value)}
                    placeholder="wara.noreply.app@gmail.com"
                    className="w-full bg-slate-800/90 text-xs text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    อีเมลที่จะถูกตั้งเป็นค่าเริ่มต้นสำหรับการแจ้งเตือนวิกฤตและรอบประจำเดือน
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Google Sheet Published CSV URL (กำหนดเอง):
                  </label>
                  <input
                    type="url"
                    value={customSheetUrl}
                    onChange={(e) => setCustomSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                    className="w-full bg-slate-800/90 text-xs text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    เว้นว่างไว้เพื่อใช้ URL เริ่มต้นของโครงการ หรือกรอก Published CSV Link จาก Google Sheet เพื่อสลับชุดข้อมูล
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="default"
                    onClick={handleSaveSheetSettings}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกการตั้งค่า Google Sheet</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                  : statusMessage.type === 'warning'
                  ? 'bg-amber-950/50 border-amber-800 text-amber-300'
                  : 'bg-blue-950/50 border-blue-800 text-blue-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            การตั้งค่าจะถูกจัดเก็บในหน่วยความจำเบราว์เซอร์ (Client-side LocalStorage)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            ปิดหน้าต่าง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
