// Helper to clear media-only entries from Cache Storage
export async function ClearMediaCache({ patterns = ['\/static\/media\/','/media/','/images/'], extensions = ['.png','.jpg','.jpeg','.webp','.gif','.svg','.mp4','.webm','.ogg','.mp3','.wav'], refresh = false } = {}) {
  if (!('caches' in window)) return { deleted: 0, checked: 0, removedUrls: [] };

  let deleted = 0;
  let checked = 0;
  const removedUrls = [];

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(async (cacheName) => {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      await Promise.all(requests.map(async (req) => {
        const url = req.url || '';
        checked += 1;
        const matchesPattern = patterns.some(p => {
          try { return new RegExp(p).test(url); } catch { return url.includes(p); }
        });
        const matchesExt = extensions.some(ext => url.toLowerCase().endsWith(ext));
        if (matchesPattern || matchesExt) {
          const ok = await cache.delete(req);
          if (ok) {
            deleted += 1;
            removedUrls.push(url);
          }
        }
      }));
    } catch (err) {
      console.warn('Failed to prune cache', cacheName, err);
    }
  }));

  // Optionally refresh matching media elements in the DOM
  if (refresh && removedUrls.length && typeof document !== 'undefined') {
    try {
      refreshMediaElements(removedUrls, patterns, extensions);
    } catch (e) {
      console.warn('refreshMediaElements failed', e);
    }
  }

  return { deleted, checked, removedUrls };
}

function addCacheBuster(url) {
  try {
    const u = new URL(url, window.location.href);
    u.searchParams.set('cb', String(Date.now()));
    return u.toString();
  } catch (e) {
    // fallback: append simple query param
    return url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  }
}

function refreshMediaElements(removedUrls, patterns, extensions) {
  const els = document.querySelectorAll('img,video,source,audio');
  const lowerExts = extensions.map(e => e.toLowerCase());

  function matches(url) {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    if (removedUrls.some(r => r === url || url.includes(r))) return true;
    if (patterns.some(p => {
      try { return new RegExp(p).test(url); } catch { return url.includes(p); }
    })) return true;
    if (lowerExts.some(ext => urlLower.endsWith(ext))) return true;
    return false;
  }

  els.forEach((el) => {
    // try several attributes
    const src = el.src || el.getAttribute('src') || el.getAttribute('data-src') || '';
    let shouldRefresh = matches(src);

    // handle <source> elements inside <picture> or <video>
    if (!shouldRefresh && el.tagName.toLowerCase() === 'source') {
      const s = el.getAttribute('src') || '';
      shouldRefresh = matches(s);
    }

    if (!shouldRefresh) return;

    const current = src;
    if (!current) return;
    const busted = addCacheBuster(current);

    try {
      if (el.tagName.toLowerCase() === 'source') {
        el.setAttribute('src', busted);
        const parent = el.parentElement;
        if (parent && typeof parent.load === 'function') parent.load();
      } else {
        // img, video, audio
        if (el.src) {
          el.src = busted;
        } else {
          el.setAttribute('src', busted);
        }
        if (el.tagName.toLowerCase() === 'video' || el.tagName.toLowerCase() === 'audio') {
          try { el.load(); } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Failed to refresh element', el, e);
    }
  });
}
