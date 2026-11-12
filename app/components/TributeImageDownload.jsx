'use client';
import { useEffect, useRef, useState } from 'react';
import { renderTributeImage } from '../../lib/tribute-image.js';

export default function TributeImageDownload({ item, label, style }) {
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prepared, setPrepared] = useState(null);
  const preview = useRef(null);
  useEffect(() => { if (prepared) preview.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [prepared]);
  async function download() {
    if (creating) return;
    setCreating(true); setNotice('Đang tạo thiệp…');
    try {
      const canvas = await renderTributeImage(item);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('IMAGE_EXPORT_FAILED')), 'image/png'));
      const name = `${item.title ? "dau-an" : "loi-tri-an"}-${item.id}.png`;
      const mobile = navigator.maxTouchPoints > 0 || /Zalo|FBAN|FBAV|Instagram|iPhone|iPad|Android/i.test(navigator.userAgent);
      if (mobile) {
        // Show an actual image in the current page. Embedded browsers may try to
        // launch another app for blob: downloads and lose the generated file.
        const src = canvas.toDataURL('image/png');
        const file = new File([blob], name, { type: 'image/png' });
        let canShare = false;
        try { canShare = !!navigator.canShare?.({ files: [file] }); } catch {}
        setPrepared({ src, file, canShare });
        setNotice('Thiệp đã sẵn sàng bên dưới. Nhấn giữ ảnh để lưu vào điện thoại.');
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = objectUrl; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        setNotice('Đã tạo thiệp và bắt đầu tải ảnh.');
      }
    } catch { setNotice('Chưa tải được ảnh. Vui lòng thử lại.'); }
    finally { setCreating(false); }
  }
  async function savePrepared() {
    if (!prepared || saving) return;
    setSaving(true);
    try {
      // A separate tap preserves the user gesture required by mobile sharing.
      await navigator.share({ files: [prepared.file], title: 'Thiệp tri ân thầy cô' });
      setNotice('Bạn có thể chọn Lưu hình ảnh hoặc ứng dụng muốn chia sẻ.');
    } catch (error) {
      if (error.name !== 'AbortError') setNotice('Trình duyệt chưa hỗ trợ lưu qua nút này. Nhấn giữ ảnh bên dưới để lưu; nếu Zalo không cho lưu, mở liên kết bằng Safari hoặc Chrome rồi thử lại.');
    } finally { setSaving(false); }
  }
  return <>
    <button type="button" className={style} disabled={creating} onClick={download}>{creating ? 'Đang tạo thiệp…' : label}</button>
    {notice && <p role="status" className="basis-full break-words text-xs leading-6">{notice}</p>}
    {prepared && <div ref={preview} className="mt-5 rounded-xl border border-[#efd6b2] bg-white p-3"><p className="mb-3 text-sm font-semibold">Thiệp của bạn</p><p className="mb-3 text-xs leading-6">Nhấn giữ ảnh bên dưới rồi chọn lưu ảnh. Nếu không thấy tùy chọn này trong Zalo, hãy mở liên kết bằng Safari hoặc Chrome.</p>{prepared.canShare && <button type="button" className={`${style} mb-3`} disabled={saving} onClick={savePrepared}>{saving ? 'Đang mở…' : 'Lưu / Chia sẻ ảnh'}</button>}<img src={prepared.src} alt="Thiệp tri ân. Nhấn giữ để lưu ảnh." className="h-auto w-full rounded-lg" style={{ WebkitTouchCallout: 'default', userSelect: 'auto' }} /><button type="button" className={`${style} mt-3`} onClick={() => setPrepared(null)}>Đóng ảnh xem trước</button></div>}
  </>;
}
