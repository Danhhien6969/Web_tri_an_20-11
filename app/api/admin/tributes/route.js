import { getDatabase } from '../../../../lib/mongodb.js';
import { getAdmin, readToken } from '../../../../lib/admin-auth.js';
import { checkOrigin, failure, json, readBody } from '../../../../lib/admin-http.js';
import { escapeRegex, parseQuery, validateTribute } from '../../../../lib/validation.js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  if (!readToken(request)) return json({ error: 'Bạn cần đăng nhập quản trị.' }, 401);
  try {
    const db = await getDatabase();
    if (!await getAdmin(db, request)) return json({ error: 'Phiên đăng nhập đã hết hạn.' }, 401);
    const params = new URL(request.url).searchParams;
    const query = parseQuery(params); if (query.error) return json({ error: query.error }, 400);
    const status = params.get('status') || 'all';
    if (!['all', 'published', 'pending', 'hidden'].includes(status)) return json({ error: 'Trạng thái không hợp lệ.' }, 400);
    const conditions = [];
    if (status === 'published') conditions.push({ $or: [{ status: 'published' }, { status: { $exists: false } }] });
    else if (status !== 'all') conditions.push({ status });
    if (query.q) conditions.push({ $or: ['sender', 'teacher', 'message'].map(key => ({ [key]: { $regex: escapeRegex(query.q), $options: 'i' } })) });
    const filter = conditions.length ? { $and: conditions } : {};
    const collection = db.collection('tributes');
    const [items, total, counts] = await Promise.all([
      collection.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * 12).limit(12).maxTimeMS(5000).toArray(),
      collection.countDocuments(filter, { maxTimeMS: 5000 }),
      collection.aggregate([{ $group: { _id: { $ifNull: ['$status', 'published'] }, count: { $sum: 1 } } }], { maxTimeMS: 5000 }).toArray()
    ]);
    return json({ items: items.map(({ _id, ...x }) => ({ ...x, id: _id.toString(), status: x.status || 'published' })), total, pages: Math.ceil(total / 12), counts: Object.fromEntries(counts.map(x => [x._id, x.count])) });
  } catch (error) { return failure(error); }
}
export async function POST(request) {
  if (!checkOrigin(request)) return json({ error: 'Nguồn gửi không hợp lệ.' }, 403);
  if (!readToken(request)) return json({ error: 'Bạn cần đăng nhập quản trị.' }, 401);
  try {
    const db = await getDatabase(); const admin = await getAdmin(db, request);
    if (!admin) return json({ error: 'Phiên đăng nhập đã hết hạn.' }, 401);
    const body = await readBody(request); const result = validateTribute(body);
    if (result.error) return json({ error: result.error }, 400);
    if (!['published', 'pending', 'hidden'].includes(body.status)) return json({ error: 'Trạng thái không hợp lệ.' }, 400);
    const item = { ...result.data, status: body.status, createdAt: new Date(), updatedBy: admin.username };
    const { insertedId } = await db.collection('tributes').insertOne(item);
    return json({ item: { ...item, id: insertedId.toString() } }, 201);
  } catch (error) { return failure(error); }
}
