import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getDatabase } from '../lib/mongodb.js';
import { POST } from '../app/api/tributes/[id]/heart/route.js';
import { GET as list } from '../app/api/tributes/route.js';
import { GET as detail } from '../app/api/tributes/[id]/route.js';
test('tribute hearts persist, reject hidden posts and deduplicate concurrent likes',async()=>{
 const mongo=await MongoMemoryServer.create();process.env.MONGODB_URI=mongo.getUri();process.env.MONGODB_DB='hearts_test';
 let db;
 try{
  db=await getDatabase();
  const {insertedId}=await db.collection('tributes').insertOne({sender:'An',teacher:'Cô Lan',message:'Cảm ơn cô rất nhiều.',status:'published',createdAt:new Date()});
  const id=insertedId.toString(),context={params:Promise.resolve({id})};
  const voter='12345678-1234-4123-8123-123456789abc';
  const send=(v=voter,origin='http://localhost')=>POST(new Request('http://localhost/api/tributes/'+id+'/heart',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({voter:v})}),context);
  assert.equal((await send(voter,'https://evil.example')).status,403);
  assert.equal((await send('bad')).status,400);
  const results=await Promise.all(Array.from({length:4},()=>send()));
  assert.ok(results.every(r=>r.status===200));
  assert.equal(await db.collection('tribute_hearts').countDocuments(),1);
  assert.equal((await (await send()).json()).hearts,1);
  assert.equal((await (await send('22345678-1234-4123-8123-123456789abc')).json()).hearts,2);
  assert.equal((await (await list(new Request('http://localhost/api/tributes'))).json()).items[0].hearts,2);
  assert.equal((await (await detail(new Request('http://localhost/api/tributes/'+id),context)).json()).item.hearts,2);
  for(const status of ['pending','hidden']){
   await db.collection('tributes').updateOne({_id:insertedId},{$set:{status}});
   assert.equal((await send('32345678-1234-4123-8123-123456789abc')).status,404);
  }
  assert.equal(await db.collection('tribute_hearts').countDocuments(),2);
 }finally{if(db)await db.client.close();globalThis.__tributeMongo.promise=null;await mongo.stop();}
});
