import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getDatabase } from '../lib/mongodb.js';
import { POST } from '../app/api/forum/route.js';
import { detectImageType,uploadedImageType } from '../lib/image-type.js';
test('JPG/JPEG upload accepts alternate or missing MIME labels and stores canonical JPEG',async()=>{
 const mongo=await MongoMemoryServer.create();process.env.MONGODB_URI=mongo.getUri();process.env.MONGODB_DB='forum_images_test';let db;
 try{
  const bytes=Uint8Array.from([255,216,255,224,0,16,74,70,73,70,0,1]);
  const send=(type,article=bytes)=>{const form=new FormData();for(const [key,value] of Object.entries({name:'Tác giả',phone:'0901234567',email:'test@example.com',title:'Kỷ niệm cùng thầy cô',content:'Một lời cảm ơn thầy cô.',agreed:'on'}))form.set(key,value);form.set('image',new File([bytes],'portrait.JPG',{type}));form.set('articleImage',new File([article],'memory.jpg',{type}));return POST(new Request('http://localhost/api/forum',{method:'POST',headers:{origin:'http://localhost'},body:form}));};
  for(const type of ['image/jpeg','image/jpg','image/pjpeg','application/octet-stream','']){
   assert.equal(await uploadedImageType(new File([bytes],'memory.JPG',{type})),'image/jpeg');
   const response=await send(type);assert.equal(response.status,201,await response.clone().text());
  }
  db=await getDatabase();const rows=await db.collection('forum_entries').find({}).toArray();assert.equal(rows.length,5);
  assert.ok(rows.every(row=>row.imageType==='image/jpeg'&&row.articleImageType==='image/jpeg'));
  assert.equal((await send('image/jpeg',new TextEncoder().encode('Not an image, even when renamed .jpg'))).status,400);
  const tooBig=new Uint8Array(2*1024*1024+1);tooBig.set(bytes);
  const oversized=await send('image/jpeg',tooBig);assert.equal(oversized.status,400);assert.match((await oversized.json()).error,/2 MB/);
  assert.equal(detectImageType(new Uint8Array([1,2])),null);
 }finally{if(!db)db=await globalThis.__tributeMongo?.promise;if(db)await db.client.close();if(globalThis.__tributeMongo)globalThis.__tributeMongo.promise=null;await mongo.stop();}
});
