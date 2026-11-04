import { getDatabase } from '../../../../lib/mongodb.js';
import { getAdmin, readToken } from '../../../../lib/admin-auth.js';
import { json, failure } from '../../../../lib/admin-http.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request) {
 if(!readToken(request)) return json({error:'Bạn cần đăng nhập quản trị.'},401);
 try {
  const db=await getDatabase();
  if(!await getAdmin(db,request)) return json({error:'Phiên đăng nhập đã hết hạn.'},401);
  const summaries=await Promise.all(['tributes','forum_entries'].map(async name=>{
   const rows=await db.collection(name).aggregate([{$group:{_id:{$ifNull:['$status','published']},count:{$sum:1},latest:{$max:'$_id'},updated:{$max:'$updatedAt'}}},{$sort:{_id:1}}],{maxTimeMS:5000}).toArray();
   return {pending:rows.find(x=>x._id==='pending')?.count||0,version:JSON.stringify(rows)};
  }));
  return json({tributes:summaries[0],forum:summaries[1]});
 }catch(e){return failure(e);}
}
