import { getDatabase } from '../../../../lib/mongodb.js';
import { getAdmin, hashPassword, readToken, sessionCookie, verifyPassword } from '../../../../lib/admin-auth.js';
import { checkOrigin, failure, json, readBody } from '../../../../lib/admin-http.js';
export const runtime = 'nodejs';
export async function POST(request) {
  if (!checkOrigin(request)) return json({ error: 'Nguồn gửi không hợp lệ.' }, 403);
  if (!readToken(request)) return json({ error: 'Bạn cần đăng nhập quản trị.' }, 401);
  try {
    const db = await getDatabase(); const admin = await getAdmin(db, request);
    if (!admin) return json({ error: 'Phiên đăng nhập đã hết hạn.' }, 401);
    const body = await readBody(request);
    if (typeof body?.currentPassword !== 'string' || body.currentPassword.length > 128 || typeof body?.newPassword !== 'string' || body.newPassword.length < 12 || body.newPassword.length > 128) return json({ error: 'Mật khẩu mới cần từ 12 đến 128 ký tự.' }, 400);
    const stored = await db.collection('admins').findOne({ _id: admin._id });
    if (!await verifyPassword(body.currentPassword, stored.passwordHash)) return json({ error: 'Mật khẩu hiện tại chưa đúng.' }, 400);
    await db.collection('admins').updateOne({ _id: admin._id }, { $set: { passwordHash: await hashPassword(body.newPassword), updatedAt: new Date() } });
    await db.collection('admin_sessions').deleteMany({ adminId: admin._id });
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', true) });
  } catch (error) { return failure(error); }
}
