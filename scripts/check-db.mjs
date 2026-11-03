import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
if (!/^mongodb(?:\+srv)?:\/\//.test(uri) || /<[^>]+>/.test(uri)) {
  console.log('CONFIG_ERROR: MONGODB_URI chua dung hoac con placeholder.');
  process.exit(1);
}
console.log('CONFIG_OK');
console.log('NODE:', process.version);
let client;
try {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'tri_an_20_11');
  await db.command({ ping: 1 });
  console.log('CONNECTED');
  await db.collection('tributes').createIndex({ createdAt: -1, _id: -1 });
  await db.collection('write_windows').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  console.log('APP_INDEXES_OK');
} catch (error) {
  // Never print driver messages/stacks: they can contain connection details.
  const code = error.code || error.cause?.code;
  console.log('ERROR_TYPE:', /^[A-Za-z]+$/.test(error.name) ? error.name : 'Unknown');
  console.log('ERROR_CODE:', typeof code === 'number' || /^[A-Z0-9_]+$/.test(String(code)) ? code : 'unknown');
  if (code === 18) console.log('AUTH_FAILED: Kiem tra database user va mat khau.');
  else if (String(code).includes('SSL') || String(code).includes('TLS')) console.log('TLS_FAILED: Ket noi dung o buoc TLS. Can kiem tra duong mang, VPN/proxy va Atlas IP Access List.');
  else if (code === 13) console.log('PERMISSION_FAILED: Tai khoan chua co quyen tao index ung dung.');
  process.exitCode = 1;
} finally {
  await client?.close();
}
