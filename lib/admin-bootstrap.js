import { ensureAdminIndexes } from './admin-auth.js';
const provisioned = new WeakSet();
export async function provisionConfiguredAdmin(db) {
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME;
  const encoded = process.env.ADMIN_BOOTSTRAP_PASSWORD_HASH;
  if (!username || !encoded || provisioned.has(db)) return;
  if (!/^[a-z0-9_-]{3,50}$/.test(username)) throw new Error('INVALID_ADMIN_CONFIG');
  const passwordHash = Buffer.from(encoded, 'base64').toString('utf8');
  if (!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(passwordHash)) throw new Error('INVALID_ADMIN_CONFIG');
  await ensureAdminIndexes(db);
  // Bootstrap never changes an existing account or resets its password.
  await db.collection('admins').updateOne({ username }, { $setOnInsert: { username, passwordHash, role: 'admin', createdAt: new Date() } }, { upsert: true });
  provisioned.add(db);
}
