import { ObjectId } from 'mongodb';
import { createHash } from 'node:crypto';
import { getDatabase } from '../../../../../lib/mongodb.js';
import { checkOrigin,json,readBody,failure } from '../../../../../lib/admin-http.js';
export const runtime='nodejs';
const uuid=/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const validId=id=>/^[a-f\d]{24}$/i.test(id);
const publicComment=item=>({id:item._id,name:item.name,message:item.message,createdAt:item.createdAt});
async function published(db,id){return db.collection('forum_entries').findOne({_id:new ObjectId(id),status:'published'},{projection:{_id:1},maxTimeMS:5000});}
export async function GET(request,{params}) {
 const {id}=await params;const page=Number(new URL(request.url).searchParams.get('page')||1);
 if(!validId(id))return json({error:'Bài viết không hợp lệ.'},400);
 if(!Number.isSafeInteger(page)||page<1||page>10000)return json({error:'Trang bình luận không hợp lệ.'},400);
 try{
  const db=await getDatabase();if(!await published(db,id))return json({error:'Bài viết chưa được duyệt hoặc đã ẩn.'},404);
  const filter={entryId:new ObjectId(id),status:'published'},pageSize=20;
  const [rows,total]=await Promise.all([db.collection('forum_comments').find(filter,{projection:{name:1,message:1,createdAt:1},maxTimeMS:5000}).sort({createdAt:-1,_id:-1}).skip((page-1)*pageSize).limit(pageSize).toArray(),db.collection('forum_comments').countDocuments(filter,{maxTimeMS:5000})]);
  return json({items:rows.map(publicComment),total,page,pages:Math.ceil(total/pageSize)});
 }catch(error){return failure(error);}
}
export async function POST(request,{params}) {
 if(!checkOrigin(request))return json({error:'Nguồn gửi không hợp lệ.'},403);
 const {id}=await params;if(!validId(id))return json({error:'Bài viết không hợp lệ.'},400);
 try{
  const body=await readBody(request);
  if(typeof body?.name!=='string'||typeof body?.message!=='string'||typeof body?.visitor!=='string'||typeof body?.submission!=='string'||!uuid.test(body.visitor)||!uuid.test(body.submission))return json({error:'Vui lòng nhập tên và nội dung bình luận.'},400);
  const name=body.name.trim().normalize('NFC'),message=body.message.trim().normalize('NFC');
  if(!name||name.length>70||!message||message.length>2000)return json({error:'Tên tối đa 70 ký tự, bình luận từ 1 đến 2.000 ký tự.'},400);
  const db=await getDatabase();if(!await published(db,id))return json({error:'Bài viết chưa được duyệt hoặc đã ẩn.'},404);
  const entryId=new ObjectId(id),key=createHash('sha256').update(id.toLowerCase()+':'+body.submission.toLowerCase()).digest('hex');
  const comments=db.collection('forum_comments');let item=await comments.findOne({_id:key});
  if(!item){
   const bucket=Math.floor(Date.now()/60000),visitor=createHash('sha256').update(body.visitor.toLowerCase()).digest('hex');
   for(const [windowKey,limit] of [[`comments:${visitor}:${bucket}`,5],[`comments:all:${bucket}`,60]]){
    const window=await db.collection('write_windows').findOneAndUpdate({_id:windowKey},{$inc:{count:1},$setOnInsert:{expiresAt:new Date((bucket+2)*60000)}},{upsert:true,returnDocument:'after'});
    if(window.count>limit)return json({error:'Bạn gửi bình luận quá nhanh. Vui lòng đợi một phút rồi thử lại.'},429);
   }
   item={_id:key,entryId,name,message,status:'published',createdAt:new Date()};
   try{await comments.insertOne(item);}catch(error){if(error.code!==11000)throw error;item=await comments.findOne({_id:key});}
  }
  const total=await comments.countDocuments({entryId,status:'published'},{maxTimeMS:5000});
  return json({item:publicComment(item),total},201);
 }catch(error){return failure(error);}
}
