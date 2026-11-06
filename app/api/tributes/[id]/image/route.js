import { ObjectId } from 'mongodb';
import { getDatabase } from '../../../../../lib/mongodb.js';
export const runtime='nodejs';
export async function GET(request,{params}) {
 const {id}=await params;
 const empty=status=>new Response(null,{status,headers:{'Cache-Control':'no-store'}});
 if(!/^[a-f\d]{24}$/i.test(id))return empty(404);
 try {
  const db=await getDatabase();
  const item=await db.collection('tributes').findOne({_id:new ObjectId(id),$or:[{status:'published'},{status:{$exists:false}}]},{projection:{image:1},maxTimeMS:5000});
  const image=typeof item?.image==='string'&&item.image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if(!image)return empty(404);
  return new Response(Buffer.from(image[2],'base64'),{headers:{'Content-Type':image[1],'Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'}});
 } catch {return empty(503);}
}
