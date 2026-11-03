import { DESIGNS } from '../../lib/tribute-design.js';
export default function TributeCard({ item, preview = false }) {
  const design = DESIGNS.includes(item.design) ? item.design : 'garden';
  return <div className={`tribute-card-frame ${preview ? 'tribute-card-preview' : ''}`} data-design={design}>
    <svg className="tribute-card-flower" viewBox="0 0 100 140" aria-hidden="true"><path d="M14 140Q65 70 27 5" fill="none" stroke="#66a38b" strokeWidth="3" /><g fill="#89b79b"><ellipse cx="25" cy="30" rx="10" ry="23" transform="rotate(-40 25 30)" /><ellipse cx="48" cy="53" rx="9" ry="21" transform="rotate(35 48 53)" /><ellipse cx="26" cy="73" rx="8" ry="22" transform="rotate(-45 26 73)" /></g><g transform="translate(35 105)" fill="#ffb461"><ellipse ry="20" rx="9" /><ellipse ry="20" rx="9" transform="rotate(60)" /><ellipse ry="20" rx="9" transform="rotate(120)" /><circle r="7" fill="#f08868" /></g></svg>
    <div className="tribute-card-brand">Từ trái tim</div>
    <div className="tribute-card-paper">
      <p className={`tribute-card-message ${preview ? '' : 'line-clamp-5'}`}>{item.message || 'Lời tri ân của bạn…'}</p>
      <div className="tribute-card-recipient">Gửi đến: <strong>{item.teacher || ''}</strong>{item.teacherDepartment && <span className="mt-1 block text-xs leading-5 text-stone-500">Khoa / Viện: {item.teacherDepartment}</span>}</div>
      <div className="tribute-card-sender"><span className="tribute-card-avatar">{item.sender?.charAt(0).toUpperCase() || ''}</span><span>{item.sender || ''}</span></div>
    </div>
  </div>;
}
