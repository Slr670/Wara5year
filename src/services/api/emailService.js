import { requestWithFallback } from './apiClient.js';

export async function sendEmailAlert(villages = [], isTest = false, toEmail = 'wara.noreply.app@gmail.com') {
  return await requestWithFallback('/send-email', {
    method: 'POST',
    body: JSON.stringify({
      to: toEmail,
      isTest,
      villages
    })
  });
}

export async function runMonthlyCronAlert(toEmail = 'wara.noreply.app@gmail.com') {
  return await requestWithFallback('/monthly-alert-cron', {
    method: 'POST',
    body: JSON.stringify({ to: toEmail })
  });
}
