export const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
export function checkOrigin(request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
export async function readBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('INVALID_JSON');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('INVALID_JSON');
  const chunks = []; let bytes = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    bytes += value.byteLength;
    if (bytes > 16384) { await reader.cancel(); throw new Error('INVALID_JSON'); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('INVALID_JSON'); }
}
export function failure(error) {
  return error.message === 'INVALID_JSON' ? json({ error: 'Dữ liệu không hợp lệ hoặc quá lớn.' }, 400) : json({ error: 'Chưa kết nối được dữ liệu. Vui lòng thử lại.' }, 503);
}
