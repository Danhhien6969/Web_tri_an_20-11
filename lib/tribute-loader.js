import { TRIBUTE_PAGE_SIZE } from './tribute-pagination.js';
const CACHE_KEY = 'tribute-list-cache-v3';
const MAX_AGE = 5 * 60 * 1000;
export const listKey = (query, page) => JSON.stringify([query, page]);
function validList(data) {
  return data && Array.isArray(data.items) && data.items.length <= TRIBUTE_PAGE_SIZE &&
    data.items.every(x => x && ['id', 'sender', 'teacher', 'message'].every(k => typeof x[k] === 'string')) &&
    ['total', 'page', 'pages', 'pageSize'].every(k => Number.isSafeInteger(data[k]) && data[k] >= 0);
}
export function readListCache(storage, key, now = Date.now()) {
  try {
    const entry = JSON.parse(storage.getItem(CACHE_KEY) || '{}')[key];
    return entry && now >= entry.at && now - entry.at <= MAX_AGE && validList(entry.data) ? entry.data : null;
  } catch { return null; }
}
export function writeListCache(storage, key, data, now = Date.now()) {
  if (!validList(data)) return;
  try {
    const entries = JSON.parse(storage.getItem(CACHE_KEY) || '{}');
    entries[key] = { at: now, data };
    const recent = Object.entries(entries).filter(([, x]) => now - x.at <= MAX_AGE).sort((a, b) => b[1].at - a[1].at).slice(0, 10);
    storage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(recent)));
  } catch { /* Storage can be unavailable; loading from MongoDB still works. */ }
}
function pause(ms, signal) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
// Retry reads only. Retrying a POST could create duplicate tributes.
export async function loadTributes(query, page, { signal, fetchImpl = fetch, timeoutMs = 10000, retryDelayMs = 400 } = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    signal?.throwIfAborted();
    try {
      const timeout = AbortSignal.timeout(timeoutMs);
      const response = await fetchImpl(`/api/tributes?q=${encodeURIComponent(query)}&page=${page}`, {
        cache: 'no-store', signal: signal ? AbortSignal.any([signal, timeout]) : timeout
      });
      let data;
      try { data = await response.json(); } catch { throw Object.assign(new Error('Máy chủ chưa trả về dữ liệu hợp lệ. Vui lòng thử lại.'), { retryable: response.status >= 500 }); }
      if (!response.ok) throw Object.assign(new Error(data.error || 'Chưa tải được lời tri ân.'), { retryable: [502, 503, 504].includes(response.status) });
      if (!validList(data)) throw Object.assign(new Error('Dữ liệu trả về chưa hợp lệ. Vui lòng thử lại.'), { retryable: false });
      signal?.throwIfAborted();
      return data;
    } catch (error) {
      signal?.throwIfAborted();
      if (error.name === 'TimeoutError') error = new Error('Kết nối mất quá nhiều thời gian. Vui lòng thử lại.');
      if (attempt === 1 || error.retryable === false) throw error;
      await pause(retryDelayMs, signal);
    }
  }
}
