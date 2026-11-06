import { tributeHeartCounts } from '../../../../lib/tribute-hearts.js';
import { getDatabase } from '../../../../lib/mongodb.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request){
 const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
 try{
  const db=await getDatabase();const collection=db.collection('tributes');
  const visible={$or:[{status:'published'},{status:{$exists:false}}]};
  const total=await collection.countDocuments(visible,{maxTimeMS:5000});
  if(new URL(request.url).searchParams.get('random')!=='1')return json({total});
  const [item]=await collection.aggregate([{$match:visible},{$sample:{size:1}},{$project:{sender:1,teacher:1,message:1,teacherDepartment:1,senderDepartment:1,image:1,design:1}}],{maxTimeMS:5000}).toArray();
  if(!item)return json({error:'Cây đang chờ lời tri ân đầu tiên.'},404);
  const {_id,...data}=item;const hearts=await tributeHeartCounts(db,[_id]);return json({total,item:{id:_id.toString(),...data,hearts:hearts[_id.toString()]||0}});
 }catch{return json({error:'Chưa kết nối được Cây Tri Ân. Vui lòng thử lại.'},503);}
}
