import { requestWithFallback } from './apiClient.js';

export const DEFAULT_SMTP_CONFIG = {
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: 'wara.noreply.app@gmail.com',
  sender_email: 'wara.noreply.app@gmail.com',
  sender_name: 'USO Project Team',
  smtp_pw: '',
  smtp_secure: false,
  reject_unauthorized: true
};

export function getSavedSmtpConfig() {
  try {
    const raw = localStorage.getItem('WARA_SMTP_CONFIG');
    if (raw) {
      return { ...DEFAULT_SMTP_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to parse WARA_SMTP_CONFIG from localStorage', e);
  }
  return { ...DEFAULT_SMTP_CONFIG };
}

export function saveSmtpConfig(config) {
  try {
    localStorage.setItem('WARA_SMTP_CONFIG', JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save WARA_SMTP_CONFIG to localStorage', e);
    return false;
  }
}

export async function sendEmailAlert(villages = [], isTest = false, toEmail = 'wara.noreply.app@gmail.com', customSmtp = null) {
  const payload = {
    to: toEmail,
    isTest,
    villages
  };
  if (customSmtp) {
    payload.customSmtp = customSmtp;
  }
  return await requestWithFallback('/send-email', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function runMonthlyCronAlert(toEmail = 'wara.noreply.app@gmail.com') {
  return await requestWithFallback('/monthly-alert-cron', {
    method: 'POST',
    body: JSON.stringify({ to: toEmail })
  });
}

