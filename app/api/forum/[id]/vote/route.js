import { getDatabase } from '../../../../../lib/mongodb.js';
import { castForumVote } from '../../../../../lib/forum-votes.js';
import { checkOrigin, json, readBody, failure } from '../../../../../lib/admin-http.js';
export const runtime='nodejs';
export async function POST(request,{params}) {
 if(!checkOrigin(request))return json({error:'Nguồn gửi không hợp lệ.'},403);
 const {id}=await params;
 if(!/^[a-f\d]{24}$/i.test(id))return json({error:'Bài viết không hợp lệ.'},400);
 try {
  const body=await readBody(request);
  if(typeof body?.voter!=='string'|| !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(body.voter))return json({error:'Thông tin bình chọn không hợp lệ.'},400);
  const result=await castForumVote(await getDatabase(),id,body.voter);
  return result ? json(result) : json({error:'Bài chưa được duyệt hoặc đã ẩn.'},404);
 }catch(e){return failure(e);}
}
