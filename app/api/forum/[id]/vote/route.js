import { requestVoteIP } from '../../../../../lib/vote-ip.js';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../../../../../lib/mongodb.js';
import { castForumVote, readIPVote } from '../../../../../lib/forum-votes.js';
import { checkOrigin, json, failure } from '../../../../../lib/admin-http.js';
export const runtime='nodejs';
export async function POST(request,{params}) {
 if(!checkOrigin(request))return json({error:'Nguồn gửi không hợp lệ.'},403);
 const {id}=await params;
 if(!/^[a-f\d]{24}$/i.test(id))return json({error:'Bài viết không hợp lệ.'},400);
 try {
  const ip=requestVoteIP(request);
  if(!ip)return json({error:'Chưa xác định được IP để bình chọn. Vui lòng thử lại.'},503);
  const result=await castForumVote(await getDatabase(),id,ip);
  return result ? json(result) : json({error:'Bài chưa được duyệt hoặc đã ẩn.'},404);
 }catch(e){return failure(e);}
}

export async function GET(request,{params}) {
 const {id}=await params;
 if(!/^[a-f\d]{24}$/i.test(id))return json({error:'Bài viết không hợp lệ.'},400);
 const ip=requestVoteIP(request);if(!ip)return json({error:'Chưa xác định được IP.'},503);
 try {const db=await getDatabase();if(!await db.collection('forum_entries').findOne({_id:new ObjectId(id),status:'published'},{projection:{_id:1}}))return json({error:'Không tìm thấy bài viết.'},404);return json(await readIPVote(db,id,ip));}catch(e){return failure(e);}
}
