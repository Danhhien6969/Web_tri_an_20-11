import { forumVoteCounts } from '../../../../lib/forum-votes.js';
import { getDatabase } from '../../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return Response.json({ error:'Bài viết không hợp lệ.' }, { status:400 });
  try {
    const db = await getDatabase();
    const item = await db.collection('forum_entries').findOne({ _id:new ObjectId(id), status:'published' }, { projection:{ title:1,name:1,content:1,contentRuns:1,alignment:1,textColor:1,createdAt:1,articleImageType:1 } });
    if (!item) return Response.json({ error:'Không tìm thấy bài viết.' }, { status:404 });
    const { _id,articleImageType,...data } = item;
    const counts=await forumVoteCounts(db,[_id]);
    return Response.json({ item:{ id:_id.toString(),...data,votes:counts[id]||0,hasArticleImage:!!articleImageType } }, { headers:{'Cache-Control':'no-store'} });
  } catch { return Response.json({ error:'Chưa tải được bài viết.' }, { status:503 }); }
}
