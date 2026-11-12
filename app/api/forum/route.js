import { detectImageType } from '../../../lib/image-type.js';
import { forumCommentCounts } from '../../../lib/forum-comments.js';
import { normalizeForumRuns, normalizeForumText } from '../../../lib/forum-format.js';
import { forumVoteCounts } from '../../../lib/forum-votes.js';
import { getDatabase } from '../../../lib/mongodb.js';
export const runtime = 'nodejs';
export async function POST(request) {
  const json = (data, status = 200) => Response.json(data, { status });
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Nguồn gửi không hợp lệ.' }, 403);
  try {
    const reader = request.body.getReader(); const chunks = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 6 * 1024 * 1024) { await reader.cancel(); return json({ error: 'Dữ liệu quá lớn. Tổng hai ảnh tối đa 5 MB.' }, 413); } chunks.push(value); }
    const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
    const data = {};
    for (const [key, max] of [['name',100],['phone',100],['email',254],['title',Infinity],['content',Infinity]]) { const value = form.get(key); if (typeof value !== 'string' || !value.trim() || value.trim().length > max) return json({ error: 'Vui lòng kiểm tra thông tin bài viết.' }, 400); data[key] = normalizeForumText(value.trim()); }
    const unit = form.get('unit');
    if (unit !== null) {
      if (typeof unit !== 'string' || unit.trim().length > 100 || /[\r\n]/.test(unit)) return json({ error: 'Tên đơn vị tối đa 100 ký tự và phải nằm trên một dòng.' }, 400);
      if (unit.trim()) data.unit = normalizeForumText(unit.trim());
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || form.get('agreed') !== 'on') return json({ error: 'Kiểm tra email và xác nhận đồng ý.' }, 400);
    const alignment = form.get('alignment') || 'left';
    const textColor = form.get('textColor') || '#60362c';
    if (!['left','center','right','justify'].includes(alignment) || !['#000000','#60362c','#dc2626','#1565c0','#ca8a04'].includes(textColor)) return json({ error: 'Định dạng văn bản không hợp lệ.' }, 400);
    data.alignment = alignment; data.textColor = textColor;
    if (form.get('contentRuns')) {
      let runs; try { runs = JSON.parse(form.get('contentRuns')); } catch { return json({ error: 'Định dạng không hợp lệ.' }, 400); }
      const normalized = normalizeForumRuns(runs, data.content);
      // Keep the submitted text even if an older browser sends stale formatting.
      data.contentRuns = normalized || [{text:data.content,color:'rgb(0, 0, 0)',bold:false}];
    }

    const image = form.get('image'); if (!image || typeof image.arrayBuffer!=='function' || image.size > 3 * 1024 * 1024 || !image.size) return json({ error: 'Ảnh phải là JPG, PNG hoặc WebP, tối đa 3 MB.' }, 400);
    const avatarBytes = Buffer.from(await image.arrayBuffer());
    const avatarType=detectImageType(avatarBytes);
    if (!avatarType) return json({ error: 'Ảnh đại diện phải là JPG/JPEG, PNG hoặc WebP hợp lệ.' }, 400);
    const articleImage = form.get('articleImage');
    if (articleImage?.size) {
      if (typeof articleImage.arrayBuffer!=='function' || articleImage.size > 2 * 1024 * 1024 || articleImage.size + image.size > 5 * 1024 * 1024) return json({ error: 'Ảnh minh họa tối đa 2 MB; tổng hai ảnh tối đa 5 MB.' }, 400);
      const bytes = Buffer.from(await articleImage.arrayBuffer());
      const articleType=detectImageType(bytes);
      if (!articleType) return json({ error: 'Ảnh minh họa phải là JPG/JPEG, PNG hoặc WebP hợp lệ.' }, 400);
      data.articleImage = bytes; data.articleImageType = articleType;
    }
    const db = await getDatabase();
    const bucket = Math.floor(Date.now() / 60000); const window = await db.collection('write_windows').findOneAndUpdate({ _id: `forum:${bucket}` }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * 60000) } }, { upsert: true, returnDocument: 'after' });
    if (window.count > 10) return json({ error: 'Vui lòng thử lại sau một phút.' }, 429);
    await db.collection('forum_entries').insertOne({ ...data, image: avatarBytes, imageType: avatarType, status: 'pending', createdAt: new Date() });
    return json({ ok: true }, 201);
  } catch { return json({ error: 'Chưa gửi được bài viết. Vui lòng thử lại sau.' }, 503); }
}

export async function GET(request) {
  const page = Number(new URL(request.url).searchParams.get('page') || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return Response.json({error:'Trang không hợp lệ.'},{status:400});
  try {
    const db=await getDatabase(); const collection=db.collection('forum_entries'); const filter={status:'published'};
    const [rows,total]=await Promise.all([collection.aggregate([{$match:filter},{$sort:{createdAt:-1,_id:-1}},{$skip:(page-1)*9},{$limit:9},{$project:{title:1,name:1,createdAt:1,excerpt:{$substrCP:['$content',0,220]}}}],{maxTimeMS:5000}).toArray(),collection.countDocuments(filter,{maxTimeMS:5000})]);
    const [voteCounts,commentCounts]=await Promise.all([forumVoteCounts(db,rows.map(r=>r._id)),forumCommentCounts(db,rows.map(r=>r._id))]);
    return Response.json({items:rows.map(({_id,...item})=>({id:_id.toString(),...item,votes:voteCounts[_id.toString()]||0,comments:commentCounts[_id.toString()]||0})),pages:Math.ceil(total/9)}, {headers:{'Cache-Control':'no-store'}});
  } catch { return Response.json({error:'Chưa tải được danh sách câu chuyện. Vui lòng thử lại.'},{status:503}); }
}
