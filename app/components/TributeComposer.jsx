'use client';
import { useState } from 'react';
import TributeCard from './TributeCard';
import { DESIGNS, wordCount } from '../../lib/tribute-design.js';
const empty = { teacher: '', teacherDepartment: '', recipientEmail: '', message: '', sender: '', senderDepartment: '', senderEmail: '' };
export default function TributeComposer({ dialogRef, formRef, sending, error, onSubmit }) {
  const [draft, setDraft] = useState(empty);
  const [design, setDesign] = useState(0);
  const count = wordCount(draft.message);
  const change = e => setDraft(old => ({ ...old, [e.target.name]: e.target.value }));
  return <dialog ref={dialogRef} onCancel={e => { if (sending) e.preventDefault(); }} aria-labelledby="compose-title" className="tribute-compose">
    <button type="button" className="compose-close" disabled={sending} aria-label="Đóng" onClick={() => dialogRef.current.close()}>×</button>
    <div className="compose-columns">
      <section className="compose-preview" aria-label="Xem trước thiệp tri ân">
        <h2 id="compose-title" className="compose-title">Gửi lời tri ân <span aria-hidden="true">✒</span></h2>
        <div className="compose-preview-wrap">
          <TributeCard item={{ ...draft, design: DESIGNS[design] }} preview />
          <button type="button" disabled={sending} className="compose-arrow compose-arrow-left" aria-label="Mẫu thiệp trước" onClick={() => setDesign(x => (x + DESIGNS.length - 1) % DESIGNS.length)}>‹</button>
          <button type="button" disabled={sending} className="compose-arrow compose-arrow-right" aria-label="Mẫu thiệp tiếp theo" onClick={() => setDesign(x => (x + 1) % DESIGNS.length)}>›</button>
        </div>
        <div className="compose-template-select" aria-label="Chọn mẫu thiệp">{DESIGNS.map((name, index) => <button key={name} type="button" disabled={sending} aria-label={`Mẫu thiệp ${index + 1}`} aria-pressed={index === design} onClick={() => setDesign(index)} className={`compose-template-dot ${index === design ? 'is-active' : ''}`} data-design={name} />)}<span>Mẫu {design + 1} / {DESIGNS.length}</span></div>
      </section>
      <form ref={formRef} className="compose-form" onSubmit={onSubmit} onReset={() => { setDraft(empty); setDesign(0); }}>
        <input type="hidden" name="design" value={DESIGNS[design]} />
        <fieldset disabled={sending}>
          <div className="compose-field-group"><label htmlFor="compose-teacher">Gửi đến</label><input id="compose-teacher" name="teacher" value={draft.teacher} onChange={change} maxLength={100} required placeholder="Tên thầy cô" autoComplete="off" /><label className="sr-only" htmlFor="compose-teacher-department">Khoa / Viện</label><input id="compose-teacher-department" name="teacherDepartment" value={draft.teacherDepartment} onChange={change} maxLength={120} placeholder="Khoa / Viện" autoComplete="off" /><label className="sr-only" htmlFor="compose-recipient-email">Email người nhận (không bắt buộc)</label><input id="compose-recipient-email" type="email" name="recipientEmail" value={draft.recipientEmail} onChange={change} maxLength={254} placeholder="Email người nhận (không bắt buộc)" autoComplete="off" /></div>
          <div className="compose-field-group"><label htmlFor="compose-message">Lời tri ân</label><textarea id="compose-message" name="message" value={draft.message} onChange={change} minLength={10} maxLength={2000} required rows={5} placeholder="Chia sẻ lời tri ân của bạn…" aria-describedby="compose-word-count" /><p id="compose-word-count" className={count > 100 ? 'compose-word-count over-limit' : 'compose-word-count'}>{count}/100 từ</p></div>
          <div className="compose-field-group"><label htmlFor="compose-sender">Người gửi</label><input id="compose-sender" name="sender" value={draft.sender} onChange={change} maxLength={70} required placeholder="Tên người gửi" autoComplete="name" /><label className="sr-only" htmlFor="compose-sender-department">Khoa / Viện người gửi</label><input id="compose-sender-department" name="senderDepartment" value={draft.senderDepartment} onChange={change} maxLength={120} placeholder="Khoa / Viện" autoComplete="off" /><label className="sr-only" htmlFor="compose-sender-email">Email người gửi (không bắt buộc)</label><input id="compose-sender-email" type="email" name="senderEmail" value={draft.senderEmail} onChange={change} maxLength={254} placeholder="Email người gửi (không bắt buộc)" autoComplete="email" /></div>
        </fieldset>
        <p className="compose-note">Bài sẽ hiển thị sau khi được duyệt. Email không hiển thị công khai.</p>
        {count > 100 && <p role="alert" className="compose-error">Bạn vui lòng rút gọn lời tri ân còn tối đa 100 từ.</p>}
        {error && <p role="alert" className="compose-error">{error}</p>}
        <button className="compose-submit" disabled={sending || count > 100}>{sending ? 'ĐANG GỬI…' : 'GỬI LỜI TRI ÂN'}<span aria-hidden="true">→</span></button>
      </form>
    </div>
  </dialog>;
}
