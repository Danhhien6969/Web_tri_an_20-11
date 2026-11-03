import { getDatabase } from '../../../../lib/mongodb.js';
import { createSession, ensureAdminIndexes, getAdmin, readToken, sessionCookie, tokenHash, verifyPassword } from '../../../../lib/admin-auth.js';
import { checkOrigin, failure, json, readBody } from '../../../../lib/admin-http.js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  if (!readToken(request)) return json({ error: 'Bạn cần đăng nhập quản trị.' }, 401);
  try {
    const admin = await getAdmin(await getDatabase(), request);
    return admin ? json({ username: admin.username }) : json({ error: 'Phiên đăng nhập đã hết hạn.' }, 401);
  } catch (error) { return failure(error); }
}
export async function POST(request) {
  if (!checkOrigin(request)) return json({ error: 'Nguồn gửi không hợp lệ.' }, 403);
  try {
    const body = await readBody(request);
    if (typeof body?.username !== 'string' || typeof body?.password !== 'string' || body.password.length > 128 || !/^[a-zA-Z0-9_-]{3,50}$/.test(body.username)) return json({ error: 'Thông tin đăng nhập không hợp lệ.' }, 400);
    const db = await getDatabase(); await ensureAdminIndexes(db);
    const username = body.username.toLowerCase();
    const bucket = Math.floor(Date.now() / (15 * 60000));
    const key = `${tokenHash(username)}:${bucket}`;
    const attempts = await db.collection('admin_login_attempts').findOneAndUpdate({ _id: key }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * 15 * 60000) } }, { upsert: true, returnDocument: 'after' });
    if (attempts.count > 10) return json({ error: 'Đã thử đăng nhập nhiều lần. Vui lòng thử lại sau 15 phút.' }, 429);
    const admin = await db.collection('admins').findOne({ username, role: 'admin' });
    // Run the same password derivation even when the username does not exist.
    const dummy = 'scrypt$00000000000000000000000000000000$' + '0'.repeat(128);
    const valid = await verifyPassword(body.password, admin?.passwordHash || dummy);
    if (!admin || !valid) return json({ error: 'Tên đăng nhập hoặc mật khẩu chưa đúng.' }, 401);
    const token = await createSession(db, admin._id);
    await db.collection('admin_login_attempts').deleteOne({ _id: key });
    return json({ username: admin.username }, 200, { 'Set-Cookie': sessionCookie(token) });
  } catch (error) { return failure(error); }
}
export async function DELETE(request) {
  if (!checkOrigin(request)) return json({ error: 'Nguồn gửi không hợp lệ.' }, 403);
  try {
    const token = readToken(request);
    if (token) await (await getDatabase()).collection('admin_sessions').deleteOne({ _id: tokenHash(token) });
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', true) });
  } catch (error) { return failure(error); }
}
