import { getDatabase } from '../../../lib/mongodb.js';
import { validateTribute, parseQuery } from '../../../lib/validation.js';
import { listTributes, saveTribute } from '../../../lib/tributes.js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request) {
  const query = parseQuery(new URL(request.url).searchParams);
  if (query.error) return json({ error: query.error }, 400);
  try { return json(await listTributes(await getDatabase(), query)); }
  catch { return json({ error: 'Chưa tải được lời tri ân. Vui lòng thử lại sau.' }, 503); }
}
export async function POST(request) {
  const origin = request.headers.get('origin');
  // Standard same-origin forms only; API clients without Origin are also supported.
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Nguồn gửi không hợp lệ.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Yêu cầu phải dùng JSON.' }, 415);
  let body;
  try {
    // Bound streamed input as well as requests with Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Thiếu nội dung.' }, 400);
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 16384) { await reader.cancel(); return json({ error: 'Nội dung gửi quá lớn.' }, 413); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return json({ error: 'Dữ liệu JSON không hợp lệ.' }, 400); }
  const result = validateTribute(body);
  if (result.error) return json({ error: result.error }, 400);
  try {
    const db = await getDatabase();
    // Global cap avoids trusting spoofable IP headers. No IP or contact details are stored.
    const bucket = Math.floor(Date.now() / 60000);
    const window = await db.collection('write_windows').findOneAndUpdate(
      { _id: `minute:${bucket}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * 60000) } },
      { upsert: true, returnDocument: 'after' }
    );
    if (window.count > 60) return json({ error: 'Có nhiều lời nhắn đang được gửi. Vui lòng thử lại sau một phút.' }, 429);
    return json({ item: await saveTribute(db, result.data) }, 201);
  } catch { return json({ error: 'Chưa gửi được lời tri ân. Nội dung của bạn vẫn được giữ trong biểu mẫu.' }, 503); }
}
