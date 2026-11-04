import { createHash, randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
async function ipVoteKey(db,id,ip) {
 const config=await db.collection('private_settings').findOneAndUpdate({_id:'vote-ip-salt'},{$setOnInsert:{salt:randomBytes(32).toString('hex')}},{upsert:true,returnDocument:'after'});
 return createHash('sha256').update(config.salt+':'+id.toLowerCase()+':'+ip).digest('hex');
}
export async function readIPVote(db,id,ip) {
 const entryId=new ObjectId(id);const key=await ipVoteKey(db,id,ip);
 const [vote,votes]=await Promise.all([db.collection('forum_votes').findOne({_id:key},{projection:{_id:1}}),db.collection('forum_votes').countDocuments({entryId},{maxTimeMS:5000})]);
 return {voted:!!vote,votes};
}
export async function castForumVote(db, id, voter) {
 const entryId=new ObjectId(id);
 if(!await db.collection('forum_entries').findOne({_id:entryId,status:'published'},{projection:{_id:1}})) return null;
 const key=await ipVoteKey(db,id,voter);
 try { await db.collection('forum_votes').updateOne({_id:key},{$setOnInsert:{entryId,createdAt:new Date()}},{upsert:true}); }
 catch(e){if(e.code!==11000)throw e;}
 return {votes:await db.collection('forum_votes').countDocuments({entryId},{maxTimeMS:5000}),voted:true};
}
export async function forumVoteCounts(db, ids) {
 if(!ids.length)return {};
 const rows=await db.collection('forum_votes').aggregate([{$match:{entryId:{$in:ids}}},{$group:{_id:'$entryId',votes:{$sum:1}}}],{maxTimeMS:5000}).toArray();
 return Object.fromEntries(rows.map(r=>[r._id.toString(),r.votes]));
}
