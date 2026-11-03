import { randomBytes } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import { getDatabase } from '../lib/mongodb.js';
import { ensureAdminIndexes, hashPassword } from '../lib/admin-auth.js';
let db;
try {
  const env = await readFile('.env.local', 'utf8');
  if (!process.env.ADMIN_BOOTSTRAP_USERNAME && !/^ADMIN_BOOTSTRAP_USERNAME=/m.test(env)) {
    const password = randomBytes(18).toString('base64url');
    const hash = await hashPassword(password);
    await appendFile('.env.local', `\n# Server-only admin bootstrap; password is hashed, never public.\nADMIN_BOOTSTRAP_USERNAME=admin\nADMIN_BOOTSTRAP_PASSWORD_HASH=${Buffer.from(hash).toString('base64')}\n`);
    process.env.ADMIN_BOOTSTRAP_USERNAME = 'admin';
    process.env.ADMIN_BOOTSTRAP_PASSWORD_HASH = Buffer.from(hash).toString('base64');
    console.log(JSON.stringify({ username: 'admin', password, url: 'http://localhost:3000/admin' }));
  }
  db = await getDatabase(); await ensureAdminIndexes(db);
  const username = 'admin';
  if (await db.collection('admins').findOne({ username })) {
    console.log('ADMIN_READY: Tai khoan admin da san sang. Mat khau hien tai khong bi thay doi.');
  } else {
    const password = randomBytes(18).toString('base64url');
    await db.collection('admins').insertOne({ username, passwordHash: await hashPassword(password), role: 'admin', createdAt: new Date() });
    console.log(JSON.stringify({ username, password, url: 'http://localhost:3000/admin' }));
  }
} catch (error) {
  console.error('CREATE_ADMIN_FAILED:', error.name, /^[A-Z0-9_]+$/.test(String(error.code)) || typeof error.code === 'number' ? error.code : 'unknown');
  process.exitCode = 1;
} finally { if (db) await db.client.close(); }
