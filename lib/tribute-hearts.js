import { createHash } from 'node:crypto';
import { ObjectId } from 'mongodb';
export async function tributeHeartCounts(db,ids) {
 if(!ids.length)return {};
 const rows=await db.collection('tribute_hearts').aggregate([{$match:{entryId:{$in:ids}}},{$group:{_id:'$entryId',count:{$sum:1}}}],{maxTimeMS:5000}).toArray();
 return Object.fromEntries(rows.map(row=>[row._id.toString(),row.count]));
}
export async function addTributeHeart(db,id,voter) {
 const entryId=new ObjectId(id);
 if(!await db.collection('tributes').findOne({_id:entryId,$or:[{status:'published'},{status:{$exists:false}}]},{projection:{_id:1},maxTimeMS:5000}))return null;
 const key=createHash('sha256').update(id.toLowerCase()+':'+voter.toLowerCase()).digest('hex');
 try {await db.collection('tribute_hearts').updateOne({_id:key},{$setOnInsert:{entryId,createdAt:new Date()}},{upsert:true});}catch(error){if(error.code!==11000)throw error;}
 return {hearts:await db.collection('tribute_hearts').countDocuments({entryId},{maxTimeMS:5000}),liked:true};
}
