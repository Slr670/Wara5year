/**
 * Base API Client resolving between local powershell server and Netlify functions
 */
export function getApiEndpoints(path) {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocal) {
    return [
      `http://127.0.0.1:3001/api${path}`,
      `/api${path}`,
      `/.netlify/functions${path}`
    ];
  }
  return [
    `/api${path}`,
    `/.netlify/functions${path}`,
    `http://127.0.0.1:3001/api${path}`
  ];
}

export async function requestWithFallback(path, options = {}) {
  const endpoints = getApiEndpoints(path);
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Failed to request ${path} across all endpoints`);
}
