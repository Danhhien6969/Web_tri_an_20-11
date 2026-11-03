import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const COOKIE = 'tribute_admin_session';
export const SESSION_SECONDS = 8 * 60 * 60;
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const [scheme, salt, hex] = String(encoded || '').split('$');
  if (scheme !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hex || '')) return false;
  const actual = await scrypt(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hex, 'hex'));
}
export async function ensureAdminIndexes(db) {
  await Promise.all([
    db.collection('admins').createIndex({ username: 1 }, { unique: true }),
    db.collection('admin_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('admin_login_attempts').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  ]);
}
export function readToken(request) {
  const value = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(value || '') ? value : null;
}
export async function getAdmin(db, request) {
  const token = readToken(request);
  if (!token) return null;
  const session = await db.collection('admin_sessions').findOne({ _id: tokenHash(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return db.collection('admins').findOne({ _id: session.adminId, role: 'admin' }, { projection: { username: 1, role: 1 } });
}
export async function createSession(db, adminId) {
  const token = randomBytes(32).toString('hex');
  await db.collection('admin_sessions').insertOne({ _id: tokenHash(token), adminId, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000) });
  return token;
}
export function sessionCookie(token, clear = false) {
  return `${COOKIE}=${clear ? '' : token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : SESSION_SECONDS}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
