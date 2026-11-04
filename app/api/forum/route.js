import { getDatabase } from '../../../lib/mongodb.js';
export const runtime = 'nodejs';
export async function POST(request) {
  const json = (data, status = 200) => Response.json(data, { status });
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Nguồn gửi không hợp lệ.' }, 403);
  try {
    const reader = request.body.getReader(); const chunks = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 3500000) { await reader.cancel(); return json({ error: 'Dữ liệu quá lớn. Ảnh tối đa 3 MB.' }, 413); } chunks.push(value); }
    const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
    const data = {};
    for (const [key, max] of [['name',100],['phone',100],['email',254],['title',100],['content',20000]]) { const value = form.get(key); if (typeof value !== 'string' || !value.trim() || value.trim().length > max) return json({ error: 'Vui lòng kiểm tra thông tin bài viết.' }, 400); data[key] = value.trim().normalize('NFC'); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.content.split(/\s+/u).length > 1500 || form.get('agreed') !== 'on') return json({ error: 'Kiểm tra email, giới hạn 1.500 từ và xác nhận đồng ý.' }, 400);
    const image = form.get('image'); if (!image || !['image/jpeg','image/png','image/webp'].includes(image.type) || image.size > 3 * 1024 * 1024 || !image.size) return json({ error: 'Ảnh phải là JPG, PNG hoặc WebP, tối đa 3 MB.' }, 400);
    const db = await getDatabase();
    const bucket = Math.floor(Date.now() / 60000); const window = await db.collection('write_windows').findOneAndUpdate({ _id: `forum:${bucket}` }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * 60000) } }, { upsert: true, returnDocument: 'after' });
    if (window.count > 10) return json({ error: 'Vui lòng thử lại sau một phút.' }, 429);
    await db.collection('forum_entries').insertOne({ ...data, image: Buffer.from(await image.arrayBuffer()), imageType: image.type, status: 'pending', createdAt: new Date() });
    return json({ ok: true }, 201);
  } catch { return json({ error: 'Chưa gửi được bài viết. Vui lòng thử lại sau.' }, 503); }
}
