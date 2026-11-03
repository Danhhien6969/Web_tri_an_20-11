import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { GET, POST } from '../app/api/tributes/route.js';

test('MongoDB + API: validation, persistence, pagination, literal search and rate limit', { timeout: 180000 }, async () => {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri(); process.env.MONGODB_DB = 'tribute_test';
  const client = new MongoClient(mongo.getUri());
  try {
    const post = (body, headers = {}) => POST(new Request('http://localhost:3000/api/tributes', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }));
    assert.equal((await post({ sender: { $ne: '' } })).status, 400);
    const sample = { sender: 'An', teacher: 'Cô Lan (Toán)', message: 'Cảm ơn cô đã giúp em trưởng thành.', senderEmail: 'an@example.com', recipientEmail: 'teacher@example.com', design: 'blush' };
    assert.equal((await post(sample, { origin: 'https://another.example' })).status, 403);
    const sent = await post(sample); assert.equal(sent.status, 201);
    const created = (await sent.json()).item;
    await client.connect();
    const db = client.db('tribute_test');
    const stored = await db.collection('tributes').findOne({ sender: 'An' });
    assert.equal(stored._id.toString(), created.id);
    assert.equal(stored.message, sample.message);
    assert.equal(stored.senderEmail, sample.senderEmail);
    assert.equal(stored.recipientEmail, sample.recipientEmail);
    assert.equal(stored.design, 'blush');
    assert.equal(stored.status, 'pending');
    const beforeApproval = await (await GET(new Request('http://localhost/api/tributes'))).json();
    assert.equal(beforeApproval.total, 0);
    await db.collection('tributes').updateOne({ _id: stored._id }, { $set: { status: 'published' } });
    await db.collection('tributes').insertMany(Array.from({ length: 12 }, (_, i) => ({ sender: `Bạn ${i}`, teacher: 'Thầy Minh', message: 'Một lời cảm ơn từ học trò.', createdAt: new Date(Date.now() - i - 1000) })));
    const list = await (await GET(new Request('http://localhost/api/tributes'))).json();
    assert.equal(list.total, 13); assert.equal(list.items.length, 12); assert.equal(list.items[0].id, created.id);
    assert.equal(list.items[0].design, 'blush');
    assert.equal('senderEmail' in list.items[0], false);
    assert.equal('recipientEmail' in list.items[0], false);
    const page2 = await (await GET(new Request('http://localhost/api/tributes?page=2'))).json();
    assert.equal(page2.items.length, 1);
    const match = await (await GET(new Request('http://localhost/api/tributes?q=' + encodeURIComponent('(Toán)')))).json();
    assert.equal(match.total, 1);
    const literal = await (await GET(new Request('http://localhost/api/tributes?q=.*'))).json(); assert.equal(literal.total, 0);
    await db.collection('write_windows').updateOne({ _id: `minute:${Math.floor(Date.now() / 60000)}` }, { $set: { count: 60, expiresAt: new Date(Date.now() + 120000) } }, { upsert: true });
    assert.equal((await post(sample)).status, 429);
  } finally {
    const db = await globalThis.__tributeMongo?.promise;
    if (db) await db.client.close();
    globalThis.__tributeMongo.promise = null;
    await client.close(); await mongo.stop();
  }
});
