import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';
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
import { verifyPassword } from '../../services/api/authService.js';

export function PasswordAuthModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password.trim()) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await verifyPassword(password.trim());
      if (isValid) {
        setPassword('');
        onSuccess();
        onClose();
      } else {
        setError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Lock className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-base font-bold">
            ยืนยันรหัสผ่านเพื่อเข้าสู่การตั้งค่า
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            ระบบป้องกันการแก้ไขการตั้งค่าชีต กรุณากรอกรหัสผ่านเพื่อดำเนินการต่อ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="password"
                placeholder="กรอกรหัสผ่าน..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-sm"
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={loading}>
              ยกเลิก
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={loading}>
              {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัสผ่าน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
