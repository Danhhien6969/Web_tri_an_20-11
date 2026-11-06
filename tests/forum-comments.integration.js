import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getDatabase } from '../lib/mongodb.js';
import { GET,POST } from '../app/api/forum/[id]/comments/route.js';
import { GET as forumList } from '../app/api/forum/route.js';
test('forum comments persist, paginate, count, deduplicate and protect unpublished posts',async()=>{
 const mongo=await MongoMemoryServer.create();process.env.MONGODB_URI=mongo.getUri();process.env.MONGODB_DB='comments_test';let db;
 try{
  db=await getDatabase();const {insertedId}=await db.collection('forum_entries').insertOne({title:'Bài thử',name:'Tác giả',content:'Cảm ơn thầy cô.',status:'published',createdAt:new Date()});
  const id=insertedId.toString(),context={params:Promise.resolve({id})};
  const body={name:'Bạn đọc',unit:'Khoa Công nghệ Thông tin',message:'Câu chuyện rất ý nghĩa. 🌷',visitor:randomUUID(),submission:randomUUID()};
  const send=(data=body,origin='http://localhost')=>POST(new Request(`http://localhost/api/forum/${id}/comments`,{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)}),context);
  const read=(page=1)=>GET(new Request(`http://localhost/api/forum/${id}/comments?page=${page}`),context);
  assert.equal((await send(body,'https://evil.example')).status,403);
  assert.equal((await send({...body,name:' '})).status,400);
  assert.equal((await send({...body,unit:'x'.repeat(121)})).status,400);
  assert.equal((await send({...body,unit:{bad:true}})).status,400);
  assert.equal((await send({...body,message:'x'.repeat(2001)})).status,400);
  assert.equal((await read(0)).status,400);
  const created=await send();assert.equal(created.status,201);assert.equal((await created.json()).item.message,body.message);
  assert.equal((await send()).status,201);assert.equal(await db.collection('forum_comments').countDocuments(),1);
  for(let i=0;i<20;i++)assert.equal((await send({...body,visitor:randomUUID(),submission:randomUUID(),name:'Bạn '+i})).status,201);
  const first=await (await read()).json(),second=await (await read(2)).json();
  assert.equal(first.items[0].unit,body.unit);
  assert.equal(first.total,21);assert.equal(first.items.length,20);assert.equal(first.pages,2);assert.equal(second.items.length,1);
  assert.ok(first.items.every(item=>!('visitor' in item)&&!('entryId' in item)&&!('submission' in item)));
  assert.equal((await (await forumList(new Request('http://localhost/api/forum'))).json()).items[0].comments,21);
  const visitor= randomUUID();for(let i=0;i<5;i++)assert.equal((await send({...body,visitor,submission:randomUUID()})).status,201);
  assert.equal((await send({...body,visitor,submission:randomUUID()})).status,429);
  for(const status of ['hidden','pending']){await db.collection('forum_entries').updateOne({_id:insertedId},{$set:{status}});assert.equal((await read()).status,404);assert.equal((await send({...body,submission:randomUUID()})).status,404);}
 }finally{if(db)await db.client.close();globalThis.__tributeMongo.promise=null;await mongo.stop();}
});
