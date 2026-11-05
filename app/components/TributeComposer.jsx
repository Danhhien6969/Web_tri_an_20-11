'use client';
import { useState } from 'react';
import TributeCard from './TributeCard';
import { DESIGNS, wordCount } from '../../lib/tribute-design.js';
const empty = { teacher: '', teacherDepartment: '', message: '', sender: '', senderDepartment: '', image: '' };
export default function TributeComposer({ dialogRef, formRef, sending, error, onSubmit }) {
  const [draft, setDraft] = useState(empty);
  const [design, setDesign] = useState(0);
  const [imageError, setImageError] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  async function chooseImage(event) {
    const file = event.target.files[0]; setImageError('');
    if (!file) { setDraft(old => ({ ...old, image: '' })); return; }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { event.target.value = ''; setImageError('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.'); return; }
    setProcessingImage(true);
    try {
      const bitmap = await createImageBitmap(file);
      try {
        let image = '';
        for (const maxSide of [1800, 1400, 1100, 850]) {
          const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          for (const quality of [0.88, 0.72, 0.56]) {
            image = canvas.toDataURL('image/webp', quality);
            if (image.startsWith('data:image/webp;') && image.length <= 1400000) break;
          }
          if (image.startsWith('data:image/webp;') && image.length <= 1400000) break;
        }
        if (!image.startsWith('data:image/webp;') || image.length > 1400000) throw new Error('optimize');
        setDraft(old => ({ ...old, image }));
      } finally { bitmap.close(); }
    } catch {
      event.target.value = '';
      setImageError('Chưa xử lý được ảnh này. Vui lòng chọn ảnh khác.');
    } finally { setProcessingImage(false); }
  }
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
        <input type="hidden" name="image" value={draft.image} />
        <input type="hidden" name="design" value={DESIGNS[design]} />
        <fieldset disabled={sending}>
          <div className="compose-field-group"><label htmlFor="compose-teacher">Gửi đến Thầy/Cô:</label><input id="compose-teacher" name="teacher" value={draft.teacher} onChange={change} maxLength={100} required placeholder="Tên thầy cô" autoComplete="off" /><label className="sr-only" htmlFor="compose-teacher-department">Đơn vị:</label><input id="compose-teacher-department" name="teacherDepartment" value={draft.teacherDepartment} onChange={change} maxLength={120} placeholder="Đơn vị:" autoComplete="off" /></div>
          <div className="compose-field-group"><label htmlFor="compose-message">Lời tri ân</label><textarea id="compose-message" name="message" value={draft.message} onChange={change} minLength={10} maxLength={2000} required rows={5} placeholder="Chia sẻ lời tri ân của bạn…" aria-describedby="compose-word-count" /><p id="compose-word-count" className={count > 200 ? 'compose-word-count over-limit' : 'compose-word-count'}>{count}/200 từ</p></div>
          <div className="compose-field-group"><label htmlFor="compose-sender">Người gửi</label><input id="compose-sender" name="sender" value={draft.sender} onChange={change} maxLength={70} required placeholder="Tên người gửi" autoComplete="name" /><label className="sr-only" htmlFor="compose-sender-department">Đơn vị người gửi</label><input id="compose-sender-department" name="senderDepartment" value={draft.senderDepartment} onChange={change} maxLength={120} placeholder="Đơn vị:" autoComplete="off" /></div>
          <div className="compose-field-group"><label htmlFor="compose-image">Ảnh kỷ niệm (không bắt buộc)</label><input id="compose-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /><p className="compose-note">JPG, PNG hoặc WebP · Ảnh gốc tối đa 5 MB, tự tối ưu khi gửi</p>{processingImage && <p role="status" className="compose-note">Đang xử lý ảnh…</p>}{draft.image && <button type="button" className="text-sm text-rose underline" onClick={() => { setDraft(old => ({ ...old, image: '' })); document.getElementById('compose-image').value = ''; }}>Xóa ảnh</button>}{imageError && <p role="alert" className="compose-error">{imageError}</p>}</div>
        </fieldset>
        <p className="compose-note">Bài sẽ hiển thị sau khi được duyệt.</p>
        {count > 200 && <p role="alert" className="compose-error">Bạn vui lòng rút gọn lời tri ân còn tối đa 200 từ.</p>}
        {error && <p role="alert" className="compose-error">{error}</p>}
        <button className="compose-submit" disabled={sending || processingImage || count > 200}>{sending ? 'ĐANG GỬI…' : processingImage ? 'ĐANG XỬ LÝ ẢNH…' : 'GỬI LỜI TRI ÂN'}<span aria-hidden="true">→</span></button>
      </form>
    </div>
  </dialog>;
}
