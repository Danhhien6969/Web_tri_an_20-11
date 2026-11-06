import { ObjectId } from 'mongodb';
import { getDatabase } from '../../../../../lib/mongodb.js';
import { getAdmin, readToken } from '../../../../../lib/admin-auth.js';
import { checkOrigin, failure, json, readBody } from '../../../../../lib/admin-http.js';
import { validateTribute } from '../../../../../lib/validation.js';
export const runtime = 'nodejs';
export async function PATCH(request, context) {
  if (!checkOrigin(request)) return json({ error: 'Nguồn gửi không hợp lệ.' }, 403);
  if (!readToken(request)) return json({ error: 'Bạn cần đăng nhập quản trị.' }, 401);
  try {
    const db = await getDatabase(); const admin = await getAdmin(db, request);
    if (!admin) return json({ error: 'Phiên đăng nhập đã hết hạn.' }, 401);
    const { id } = await context.params;
    if (!/^[a-f\d]{24}$/i.test(id)) return json({ error: 'Bài viết không hợp lệ.' }, 400);
    const body = await readBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Dữ liệu không hợp lệ.' }, 400);
    const fields = { updatedAt: new Date(), updatedBy: admin.username };
    if ('status' in body) {
      if (!['published', 'pending', 'hidden'].includes(body.status)) return json({ error: 'Trạng thái không hợp lệ.' }, 400);
      fields.status = body.status;
    }
    if (['sender', 'teacher', 'message'].some(key => key in body)) {
      const result = validateTribute(body); if (result.error) return json({ error: result.error }, 400);
      Object.assign(fields, result.data);
    }
    if (Object.keys(fields).length === 2) return json({ error: 'Không có nội dung cần cập nhật.' }, 400);
    const item = await db.collection('tributes').findOneAndUpdate({ _id: new ObjectId(id) }, { $set: fields }, { returnDocument: 'after' });
    if (!item) return json({ error: 'Không tìm thấy bài viết.' }, 404);
    const { _id, ...data } = item;
    return json({ item: { ...data, id: _id.toString(), status: data.status || 'published' } });
  } catch (error) { return failure(error); }
}

export async function DELETE(request, context) {
  if (!checkOrigin(request)) return json({ error: 'Nguồn gửi không hợp lệ.' }, 403);
  if (!readToken(request)) return json({ error: 'Bạn cần đăng nhập quản trị.' }, 401);
  try {
    const db = await getDatabase();
    if (!await getAdmin(db, request)) return json({ error: 'Phiên đăng nhập đã hết hạn.' }, 401);
    const { id } = await context.params;
    if (!/^[a-f\d]{24}$/i.test(id)) return json({ error: 'Bài viết không hợp lệ.' }, 400);
    const entryId = new ObjectId(id);
    const result = await db.collection('tributes').deleteOne({ _id: entryId });
    if (!result.deletedCount) return json({ error: 'Không tìm thấy bài viết.' }, 404);
    await Promise.all([db.collection('tribute_hearts').deleteMany({ entryId })]);
    return json({ deleted: true });
  } catch (error) { return failure(error); }
}
