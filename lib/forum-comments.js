export async function forumCommentCounts(db,ids) {
 if(!ids.length)return {};
 const rows=await db.collection('forum_comments').aggregate([{$match:{entryId:{$in:ids},status:'published'}},{$group:{_id:'$entryId',count:{$sum:1}}}],{maxTimeMS:5000}).toArray();
 return Object.fromEntries(rows.map(row=>[row._id.toString(),row.count]));
}
