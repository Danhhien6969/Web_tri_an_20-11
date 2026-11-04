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
    const alignment = form.get('alignment') || 'left';
    const textColor = form.get('textColor') || '#60362c';
    if (!['left','center','right','justify'].includes(alignment) || !['#000000','#60362c','#dc2626','#1565c0','#ca8a04'].includes(textColor)) return json({ error: 'Định dạng văn bản không hợp lệ.' }, 400);
    data.alignment = alignment; data.textColor = textColor;
    if (form.get('contentRuns')) {
      let runs; try { runs = JSON.parse(form.get('contentRuns')); } catch { return json({ error: 'Định dạng không hợp lệ.' }, 400); }
      const colors = ['rgb(0, 0, 0)','rgb(220, 38, 38)','rgb(21, 101, 192)','rgb(202, 138, 4)'];
      if (!Array.isArray(runs) || runs.length > 20000 || runs.some(r => !r || typeof r.text !== 'string' || !colors.includes(r.color) || typeof r.bold !== 'boolean') || runs.map(r => r.text).join('').trim().normalize('NFC') !== data.content) return json({ error: 'Định dạng nội dung không hợp lệ.' }, 400);
      data.contentRuns = runs.map(({text,color,bold}) => ({text,color,bold}));
    }

    const image = form.get('image'); if (!image || !['image/jpeg','image/png','image/webp'].includes(image.type) || image.size > 3 * 1024 * 1024 || !image.size) return json({ error: 'Ảnh phải là JPG, PNG hoặc WebP, tối đa 3 MB.' }, 400);
    const articleImage = form.get('articleImage');
    if (articleImage?.size) {
      if (!['image/jpeg','image/png','image/webp'].includes(articleImage.type) || articleImage.size > 2 * 1024 * 1024 || articleImage.size + image.size > 3 * 1024 * 1024) return json({ error: 'Ảnh minh họa tối đa 2 MB; tổng hai ảnh tối đa 3 MB.' }, 400);
      const bytes = Buffer.from(await articleImage.arrayBuffer());
      const valid = articleImage.type === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : articleImage.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
      if (!valid) return json({ error: 'Ảnh minh họa không hợp lệ.' }, 400);
      data.articleImage = bytes; data.articleImageType = articleImage.type;
    }
    const db = await getDatabase();
    const bucket = Math.floor(Date.now() / 60000); const window = await db.collection('write_windows').findOneAndUpdate({ _id: `forum:${bucket}` }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * 60000) } }, { upsert: true, returnDocument: 'after' });
    if (window.count > 10) return json({ error: 'Vui lòng thử lại sau một phút.' }, 429);
    await db.collection('forum_entries').insertOne({ ...data, image: Buffer.from(await image.arrayBuffer()), imageType: image.type, status: 'pending', createdAt: new Date() });
    return json({ ok: true }, 201);
  } catch { return json({ error: 'Chưa gửi được bài viết. Vui lòng thử lại sau.' }, 503); }
}
