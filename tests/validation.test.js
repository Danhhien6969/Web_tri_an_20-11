import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTribute, parseQuery, escapeRegex } from '../lib/validation.js';
import { wordCount } from '../lib/tribute-design.js';

test('form supports private email fields, design selection and a 100-word limit', () => {
  const base = { sender: 'An', teacher: 'Cô Lan', message: 'Cảm ơn cô vì những bài học quý báu.' };
  const result = validateTribute({ ...base, senderEmail: ' an@example.com ', recipientEmail: '', design: 'blush' });
  assert.equal(result.data.senderEmail, 'an@example.com'); assert.equal(result.data.design, 'blush');
  assert.ok(validateTribute({ ...base, senderEmail: { $ne: null } }).error);
  assert.ok(validateTribute({ ...base, recipientEmail: 'invalid@email' }).error);
  assert.ok(validateTribute({ ...base, design: '<script>' }).error);
  assert.equal(wordCount('  Cảm ơn\n cô\t rất nhiều  '), 5);
  assert.equal(wordCount('  '), 0);
  assert.ok(validateTribute({ ...base, message: Array(101).fill('cảm').join(' ') }).error);
  assert.ok(validateTribute({ ...base, message: Array(100).fill('cảm').join(' ') }).data);
});
test('faculty/institute is optional, trimmed and restricted to plain text', () => {
  const base = { sender: 'An', teacher: 'Cô Lan', message: 'Cảm ơn cô vì những bài học quý báu.' };
  assert.equal(validateTribute({ ...base, teacherDepartment: '  Viện Công nghệ  ' }).data.teacherDepartment, 'Viện Công nghệ');
  assert.equal(validateTribute(base).data.teacherDepartment, undefined);
  assert.equal(validateTribute({ ...base, teacherDepartment: '' }).data.teacherDepartment, '');
  assert.ok(validateTribute({ ...base, teacherDepartment: { $ne: null } }).error);
  assert.ok(validateTribute({ ...base, teacherDepartment: 'a'.repeat(121) }).error);
});

test('accepts trimmed Vietnamese data and excludes untrusted fields', () => {
  assert.deepEqual(validateTribute({ sender: '  Học trò ', teacher: ' Cô Lan ', message: ' Cảm ơn cô rất nhiều! ', role: 'admin' }).data,
    { sender: 'Học trò', teacher: 'Cô Lan', message: 'Cảm ơn cô rất nhiều!' });
});
test('rejects query objects, empty fields and oversized content', () => {
  for (const body of [null, { sender: { $ne: null } }, { sender: ' ', teacher: 'Cô', message: 'Lời cảm ơn cô' }, { sender: 'An', teacher: 'Cô', message: 'a'.repeat(2001) }]) assert.ok(validateTribute(body).error);
});
test('validates pagination and treats regex metacharacters as literal text', () => {
  for (const q of ['page=-1', 'page=1.5', 'page=Infinity', 'q=' + 'x'.repeat(101)]) assert.ok(parseQuery(new URLSearchParams(q)).error);
  const literal = 'Thầy (Toán) .* [A]';
  const regex = new RegExp(escapeRegex(literal));
  assert.ok(regex.test(literal)); assert.equal(regex.test('Thầy Toán bất kỳ A'), false);
});
