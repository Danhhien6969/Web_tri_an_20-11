import { ObjectId } from 'mongodb';
import { getDatabase } from '../../../../lib/mongodb.js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request, context) {
  const { id } = await context.params;
  const respond = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!/^[a-f\d]{24}$/i.test(id)) return respond({ error: 'Không tìm thấy bài viết.' }, 404);
  try {
    const db = await getDatabase();
    const item = await db.collection('tributes').findOne({ _id: new ObjectId(id), $or: [{ status: 'published' }, { status: { $exists: false } }] }, { projection: { sender: 1, teacher: 1, message: 1, teacherDepartment: 1, senderDepartment: 1, image: 1, design: 1 }, maxTimeMS: 5000 });
    if (!item) return respond({ error: 'Không tìm thấy bài viết.' }, 404);
    const { _id, ...data } = item;
    return respond({ item: { ...data, id: _id.toString() } });
  } catch { return respond({ error: 'Chưa tải được bài viết.' }, 503); }
}
