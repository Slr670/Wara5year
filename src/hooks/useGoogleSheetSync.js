import { useState, useEffect, useCallback } from 'react';
import { fetchGoogleSheetStations } from '../services/sheet/googleSheetService.js';
import { APP_CONFIG } from '../config/app.config.js';

export function useGoogleSheetSync(onStationsUpdated) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncMessage, setSyncMessage] = useState('พร้อมซิงค์ข้อมูล Google Sheet');

  const syncData = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncMessage('กำลังซิงค์ข้อมูลล่าสุดจาก Google Sheet...');

    try {
      const data = await fetchGoogleSheetStations();
      if (data && data.length > 0) {
        if (onStationsUpdated) {
          onStationsUpdated(data);
        }
        setSyncStatus('success');
        const now = new Date();
        setLastSyncTime(now);
        setSyncMessage(`ซิงค์ข้อมูลล่าสุดเมื่อ ${now.toLocaleTimeString('th-TH')}`);
      } else {
        throw new Error('No data received');
      }
    } catch (err) {
      console.error('Google Sheet Sync Error:', err);
      setSyncStatus('error');
      setSyncMessage('เกิดข้อผิดพลาดในการซิงค์ข้อมูล ใช้ข้อมูลแคชในระบบ');
    } finally {
      setIsSyncing(false);
    }
  }, [onStationsUpdated]);

  // Initial sync & auto-refresh interval
  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, APP_CONFIG.autoSyncIntervalMs);
    return () => clearInterval(interval);
  }, [syncData]);

  return {
    isSyncing,
    syncStatus,
    lastSyncTime,
    syncMessage,
    syncData
  };
}
