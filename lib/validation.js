import { DESIGNS, wordCount } from './tribute-design.js';
export function validateTribute(body) {
  const fields = { sender: [1, 70, 'Tên người gửi'], teacher: [1, 100, 'Tên thầy cô'], message: [10, 2000, 'Lời tri ân'] };
  const data = {};
  for (const [key, [min, max, label]] of Object.entries(fields)) {
    if (typeof body?.[key] !== 'string') return { error: `${label} cần là văn bản.` };
    data[key] = body[key].trim().normalize('NFC');
    if (data[key].length < min || data[key].length > max) return { error: `${label} cần từ ${min} đến ${max} ký tự.` };
  }
  if (wordCount(data.message) > 100) return { error: 'Lời tri ân tối đa 100 từ.' };
  for (const key of ['teacherDepartment', 'senderDepartment']) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== 'string' || body[key].trim().length > 120) return { error: 'Khoa / Viện cần là văn bản, tối đa 120 ký tự.' };
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
