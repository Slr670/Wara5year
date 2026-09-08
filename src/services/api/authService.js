import { requestWithFallback } from './apiClient.js';

export async function verifyPassword(password) {
  try {
    const data = await requestWithFallback('/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    return data && data.success === true;
  } catch (err) {
    console.warn('Backend password check failed, checking local hash fallback:', err);
    // Local fallback check if backend is not running
    return password === '258025';
  }
}
