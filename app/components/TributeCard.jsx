'use client';
import { useState } from 'react';
import Image from 'next/image';
import TributeHeart from './TributeHeart';
import { DESIGNS } from '../../lib/tribute-design.js';
export default function TributeCard({ item, preview = false, expanded = false, onOpen }) {
  const [failedImage,setFailedImage] = useState(null);
  const hasImage = !!item.image && failedImage !== item.image;
  const design = DESIGNS.includes(item.design) ? item.design : 'garden';
  return <div className={`tribute-card-frame ${preview ? 'tribute-card-preview' : expanded ? '' : 'tribute-card-compact'}`} style={expanded ? { borderRadius: 28, overflow: 'hidden' } : undefined} data-design={design}>
    <svg className="tribute-card-flower" viewBox="0 0 100 140" aria-hidden="true"><path d="M14 140Q65 70 27 5" fill="none" stroke="#66a38b" strokeWidth="3" /><g fill="#89b79b"><ellipse cx="25" cy="30" rx="10" ry="23" transform="rotate(-40 25 30)" /><ellipse cx="48" cy="53" rx="9" ry="21" transform="rotate(35 48 53)" /><ellipse cx="26" cy="73" rx="8" ry="22" transform="rotate(-45 26 73)" /></g><g transform="translate(35 105)" fill="#ffb461"><ellipse ry="20" rx="9" /><ellipse ry="20" rx="9" transform="rotate(60)" /><ellipse ry="20" rx="9" transform="rotate(120)" /><circle r="7" fill="#f08868" /></g></svg>
    <div className="tribute-card-brand"><div className="tribute-card-logo-group"><img src="/logo-doan.png" width="527" height="558" alt="Đoàn Thanh niên" /><img src="/logo-hutech.png" width="515" height="595" alt="HUTECH University" /><img src="/logo-hoi.png" width="554" height="554" alt="Hội Sinh viên Việt Nam" /></div></div>
    <div className="tribute-card-paper" style={expanded ? { borderRadius: 22, overflow: 'hidden' } : undefined}>
      {!preview && !expanded && <Image width={400} height={225} sizes="(max-width:480px) 85vw, (max-width:700px) 42vw, (max-width:1100px) 28vw, 220px" style={{height:'auto'}} src={hasImage ? item.image : '/school-default-optimized.webp'} unoptimized={!hasImage} onError={() => { if (hasImage) setFailedImage(item.image); }} alt={hasImage ? 'Ảnh kỷ niệm của bài viết' : 'Khuôn viên trường HUTECH'} loading="lazy" className="tribute-card-thumbnail" />}
      <p className={`tribute-card-message ${preview || expanded ? '' : 'line-clamp-3'}`}>{item.message || 'Lời tri ân của bạn…'}</p>
      {item.image && (preview || expanded) && <img src={item.image} alt="Ảnh kỷ niệm kèm lời tri ân" className="mb-5 max-h-64 w-full rounded-lg object-contain" />}
      {!preview && !expanded && <span className="mb-4 text-xs font-semibold text-rose">Xem chi tiết{hasImage ? ' · Có ảnh kỷ niệm' : ''} →</span>}
      <div className="tribute-card-recipient">Gửi đến Thầy/Cô: <strong>{item.teacher || ''}</strong>{item.teacherDepartment && <span className="mt-1 block text-xs leading-5 text-stone-500">Đơn vị: {item.teacherDepartment}</span>}</div>
      <div className="tribute-card-sender"><span className="tribute-card-avatar">{item.sender?.charAt(0).toUpperCase() || ''}</span><span>{item.sender || ''}{item.senderDepartment && <span className="mt-1 block text-xs leading-5 text-stone-500">Đơn vị: {item.senderDepartment}</span>}</span>{!preview && <TributeHeart item={item} />}</div>
    </div>
    {onOpen && <button type="button" className="tribute-card-open-overlay" onClick={onOpen} aria-label={`Đọc lời tri ân của ${item.sender} gửi đến ${item.teacher}`} />}
  </div>;
}
