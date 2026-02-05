// src/utils/clearCache.js
export async function ClearBrowserCache({ reload = true } = {}) {
  // local/session storage
  try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}

  // cookies (expires them)
  document.cookie.split(';').forEach(c => {
    document.cookie = c.replace(/^ +/, '')
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });

  // Cache API (used by service workers)
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }

  // unregister service workers
  if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  }

  // reload page to fetch fresh assets
  if (reload) {
    // Note: reload(true) is deprecated; this will cause a normal reload
    // window.location.reload();
  }
}