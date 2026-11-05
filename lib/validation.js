import { DESIGNS, wordCount } from './tribute-design.js';
export function validateTribute(body) {
  const fields = { sender: [1, 70, 'Tên người gửi'], teacher: [1, 100, 'Tên thầy cô'], message: [10, 2000, 'Lời tri ân'] };
  const data = {};
  for (const [key, [min, max, label]] of Object.entries(fields)) {
    if (typeof body?.[key] !== 'string') return { error: `${label} cần là văn bản.` };
    data[key] = body[key].trim().normalize('NFC');
    if (data[key].length < min || data[key].length > max) return { error: `${label} cần từ ${min} đến ${max} ký tự.` };
  }
  if (wordCount(data.message) > 200) return { error: 'Lời tri ân tối đa 200 từ.' };
  for (const key of ['teacherDepartment', 'senderDepartment']) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== 'string' || body[key].trim().length > 120) return { error: 'Đơn vị: cần là văn bản, tối đa 120 ký tự.' };
    data[key] = body[key].trim().normalize('NFC');
  }
  for (const key of ['senderEmail', 'recipientEmail']) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== 'string') return { error: 'Email cần là văn bản.' };
    const email = body[key].trim();
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { error: 'Địa chỉ email chưa hợp lệ.' };
    data[key] = email;
  }
  if (body.design !== undefined) {
    if (!DESIGNS.includes(body.design)) return { error: 'Mẫu thiệp không hợp lệ.' };
    data.design = body.design;
  }
  if (body.image !== undefined && body.image !== '') {
    if (typeof body.image !== 'string' || body.image.length > 1400000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(body.image)) return { error: 'Ảnh chưa hợp lệ hoặc vượt quá 1 MB.' };
    const bytes = Buffer.from(body.image.split(',')[1], 'base64');
    const mime = body.image.slice(5, body.image.indexOf(';'));
    const valid = mime === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
    if (!valid || bytes.length > 1048576) return { error: 'Chọn ảnh JPG, PNG hoặc WebP tối đa 1 MB.' };
    data.image = body.image;
  } else if (body.image === '') data.image = '';
  return { data };
}
export function parseQuery(params) {
  const page = Number(params.get('page') || 1);
  const q = (params.get('q') || '').trim().normalize('NFC');
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return { error: 'Trang không hợp lệ.' };
  if (q.length > 100) return { error: 'Từ khóa tối đa 100 ký tự.' };
  return { page, q };
}
export function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
