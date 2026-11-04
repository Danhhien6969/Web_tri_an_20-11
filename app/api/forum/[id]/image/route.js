import { getDatabase } from '../../../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';
export const runtime = 'nodejs';
export async function GET(request, { params }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return new Response(null,{status:404});
  const field = new URL(request.url).searchParams.get('kind') === 'article' ? 'articleImage' : 'image';
  try {
    const item = await (await getDatabase()).collection('forum_entries').findOne({_id:new ObjectId(id),status:'published'}, {projection:{[field]:1,[field+'Type']:1}});
    const mime=item?.[field+'Type'];
    if(!item?.[field] || !['image/jpeg','image/png','image/webp'].includes(mime)) return new Response(null,{status:404});
    return new Response(new Uint8Array(item[field].buffer),{headers:{'Content-Type':mime,'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
  } catch { return new Response(null,{status:503}); }
}
