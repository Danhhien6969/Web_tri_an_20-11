import test from 'node:test';
import assert from 'node:assert/strict';
import { listKey, loadTributes, readListCache, writeListCache } from '../lib/tribute-loader.js';

const data = { items: [{ id: '1', sender: 'An', teacher: 'Cô Lan', message: 'Cảm ơn cô rất nhiều.' }], total: 1, page: 1, pages: 1, pageSize: 12 };
test('a transient 503 recovers on the second read', async () => {
  let calls = 0;
  const result = await loadTributes('', 1, { retryDelayMs: 0, fetchImpl: async () => ++calls === 1 ? Response.json({ error: 'Database unavailable' }, { status: 503 }) : Response.json(data) });
  assert.equal(calls, 2); assert.deepEqual(result, data);
});
test('permanent failures are not retried and repeated network failures stop', async () => {
  let calls = 0;
  await assert.rejects(loadTributes('', 1, { retryDelayMs: 0, fetchImpl: async () => { calls++; return Response.json({ error: 'Invalid query' }, { status: 400 }); } }), /Invalid query/);
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(loadTributes('', 1, { retryDelayMs: 0, fetchImpl: async () => { calls++; throw new TypeError('Failed to fetch'); } }), /Failed to fetch/);
  assert.equal(calls, 2);
});
test('query changes abort in-flight loading without a retry', async () => {
  const controller = new AbortController(); let calls = 0;
  const result = loadTributes('old', 1, { signal: controller.signal, fetchImpl: async (_url, { signal }) => {
    calls++; return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } });
  controller.abort(); await assert.rejects(result, { name: 'AbortError' }); assert.equal(calls, 1);
});
test('cached lists survive reloads, stay separated by query/page and expire', () => {
  const memory = new Map(); const storage = { getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value) };
  const key = listKey('', 1);
  writeListCache(storage, key, data, 1000);
  assert.deepEqual(readListCache(storage, key, 2000), data);
  assert.equal(readListCache(storage, listKey('other', 1), 2000), null);
  assert.equal(readListCache(storage, listKey('', 2), 2000), null);
  assert.equal(readListCache(storage, key, 302000), null);
});
test('storage failures and corrupt snapshots do not prevent API loading', async () => {
  const storage = { getItem() { throw new Error('Storage disabled'); }, setItem() { throw new Error('Storage disabled'); } };
  assert.equal(readListCache(storage, 'key'), null);
  assert.doesNotThrow(() => writeListCache(storage, 'key', data));
  assert.deepEqual(await loadTributes('', 1, { fetchImpl: async () => Response.json(data) }), data);
});

test('accepts the full thirty-card page from the API and cache', async () => {
  const page = { ...data, items: Array.from({length:30}, (_,i)=>({...data.items[0],id:String(i)})), total:45, pageSize:30, pages:2 };
  assert.deepEqual(await loadTributes('',1,{fetchImpl:async()=>Response.json(page)}),page);
  const memory=new Map();const storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
  writeListCache(storage,listKey('',1),page,1000);
  assert.deepEqual(readListCache(storage,listKey('',1),2000),page);
  await assert.rejects(loadTributes('',1,{fetchImpl:async()=>Response.json({...page,items:[...page.items,data.items[0]]})}),/Dữ liệu trả về chưa hợp lệ/);
});
