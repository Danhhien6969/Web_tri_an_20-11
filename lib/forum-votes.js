import { createHash } from 'node:crypto';
import { ObjectId } from 'mongodb';
export async function castForumVote(db, id, voter) {
 const entryId=new ObjectId(id);
 if(!await db.collection('forum_entries').findOne({_id:entryId,status:'published'},{projection:{_id:1}})) return null;
 const key=createHash('sha256').update(id.toLowerCase()+':'+voter).digest('hex');
 try { await db.collection('forum_votes').updateOne({_id:key},{$setOnInsert:{entryId,createdAt:new Date()}},{upsert:true}); }
 catch(e){if(e.code!==11000)throw e;}
 return {votes:await db.collection('forum_votes').countDocuments({entryId},{maxTimeMS:5000}),voted:true};
}
export async function forumVoteCounts(db, ids) {
 if(!ids.length)return {};
 const rows=await db.collection('forum_votes').aggregate([{$match:{entryId:{$in:ids}}},{$group:{_id:'$entryId',votes:{$sum:1}}}],{maxTimeMS:5000}).toArray();
 return Object.fromEntries(rows.map(r=>[r._id.toString(),r.votes]));
}
