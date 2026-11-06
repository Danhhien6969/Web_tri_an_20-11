import { TRIBUTE_PAGE_SIZE } from './tribute-pagination.js';
import { escapeRegex } from './validation.js';
export async function listTributes(db, { page, q }) {
  const collection = db.collection('tributes');
  const visible = { $or: [{ status: 'published' }, { status: { $exists: false } }] };
  const filter = q ? { $and: [visible, { $or: ['sender', 'teacher', 'message'].map(key => ({ [key]: { $regex: escapeRegex(q), $options: 'i' } })) }] } : visible;
  const pageSize = TRIBUTE_PAGE_SIZE;
  const [items, total] = await Promise.all([
    collection.aggregate([{ $match: filter }, { $sort: { createdAt: -1, _id: -1 } }, { $skip: (page - 1) * pageSize }, { $limit: pageSize }, { $project: { sender: 1, teacher: 1, message: 1, createdAt: 1, design: 1, teacherDepartment: 1, senderDepartment: 1, hasImage: { $regexMatch: { input: { $cond: [{ $eq: [{ $type: '$image' }, 'string'] }, '$image', ''] }, regex: /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/ } } } }], { maxTimeMS: 5000 }).toArray(),
    collection.countDocuments(filter, { maxTimeMS: 5000 })
  ]);
  return { items: items.map(({ _id, hasImage, ...x }) => ({ id: _id.toString(), ...x, ...(hasImage ? {image:`/api/tributes/${_id}/image`} : {}) })), total, page, pageSize, pages: Math.ceil(total / pageSize) };
}
export async function saveTribute(db, data) {
  const item = { ...data, status: 'pending', createdAt: new Date() };
  const { insertedId } = await db.collection('tributes').insertOne(item);
  return { id: insertedId.toString(), ...item };
}
