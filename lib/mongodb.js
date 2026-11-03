import { MongoClient } from 'mongodb';
import { provisionConfiguredAdmin } from './admin-bootstrap.js';

// Reuse the pool across requests and development hot reloads.
const cache = globalThis.__tributeMongo || (globalThis.__tributeMongo = { promise: null });
export async function getDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_NOT_CONFIGURED');
  if (!cache.promise) {
    cache.promise = (async () => {
      const client = new MongoClient(process.env.MONGODB_URI, {
        // A small shared pool avoids opening parallel TLS sockets on this deployment.
        maxPoolSize: 1, maxConnecting: 1, serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000, socketTimeoutMS: 8000,
        waitQueueTimeoutMS: 10000, maxIdleTimeMS: 0
      });
      try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || 'tri_an_20_11');
        await db.collection('tributes').createIndex({ createdAt: -1, _id: -1 });
        // MongoDB enforces a global write window even with multiple Next.js instances.
        await db.collection('write_windows').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        return db;
      } catch (error) { await client.close(); throw error; }
    })().catch(error => { cache.promise = null; throw error; });
  }
  const current = cache.promise;
  const db = await current;
  try {
    await provisionConfiguredAdmin(db);
    return db;
  } catch (error) {
    if (cache.promise === current) { cache.promise = null; await db.client.close(); }
    throw error;
  }
}
