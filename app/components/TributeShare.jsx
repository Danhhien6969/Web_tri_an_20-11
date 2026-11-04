'use client';
import { useState } from 'react';
export default function TributeShare({ item }) {
  const [notice, setNotice] = useState('');
  const url = () => `${window.location.origin}/?tribute=${encodeURIComponent(item.id)}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url()); setNotice('Đã copy link bài viết.'); }
    catch { setNotice('Chưa copy được. Bạn có thể sao chép link: ' + url()); }
  }
  async function share(service) {
    const link = url();
    if (service === 'Facebook') { window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link), '_blank', 'noopener,noreferrer'); return; }
    try {
      if (navigator.share) await navigator.share({ title: `Lời tri ân gửi đến ${item.teacher}`, text: `Từ ${item.sender}`, url: link });
      else { await navigator.clipboard.writeText(link); setNotice(`Đã copy link. Mở ${service} và dán vào cuộc trò chuyện để chia sẻ.`); }
    } catch (error) { if (error.name !== 'AbortError') setNotice('Bạn hãy dùng Copy link rồi dán vào ' + service + '.'); }
  }
  async function download() {
    try {
      await document.fonts.ready;
      const canvas = document.createElement('canvas'); canvas.width = 1200;
      const ctx = canvas.getContext('2d'); ctx.font = '28px Arial';
      const lines = [];
      function wrap(text) {
        for (const paragraph of String(text || '').split('\n')) {
          let line = '';
          for (const char of paragraph) {
            if (ctx.measureText(line + char).width > 1000) { lines.push(line); line = ''; }
            line += char;
          }
          lines.push(line);
        }
      }
      wrap(item.message); const messageLines = [...lines]; lines.length = 0;
      wrap(`Gửi đến: ${item.teacher}`); if (item.teacherDepartment) wrap(`Khoa / Viện: ${item.teacherDepartment}`);
      wrap(`Người gửi: ${item.sender}`); if (item.senderDepartment) wrap(`Khoa / Viện: ${item.senderDepartment}`);
      canvas.height = 360 + (messageLines.length + lines.length) * 44;
      const gradient = ctx.createLinearGradient(0, 0, 1200, canvas.height); gradient.addColorStop(0, '#fffdf2'); gradient.addColorStop(1, '#ffe69b'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1200, canvas.height);
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(55, 150, 1090, canvas.height - 205);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff123d'; ctx.font = 'italic 52px Georgia'; ctx.fillText('Từ trái tim người học trò', 600, 100);
      ctx.textAlign = 'left'; ctx.fillStyle = '#60362c'; ctx.font = '28px Arial'; let y = 215;
      for (const line of messageLines) { ctx.fillText(line, 100, y); y += 44; }
      y += 50; ctx.fillStyle = '#a76855';
      for (const line of lines) { ctx.fillText(line, 100, y); y += 44; }
      canvas.toBlob(blob => { if (!blob) { setNotice('Chưa tạo được ảnh.'); return; } const objectUrl = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = objectUrl; a.download = `loi-tri-an-${item.id}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 30000); }, 'image/png');
    } catch { setNotice('Chưa tải được ảnh. Vui lòng thử lại.'); }
  }
  const style = 'rounded-lg border border-[#efd6b2] bg-white px-3 py-2 text-xs hover:bg-amber-50';
  return <section className="mt-7 border-t border-[#efd6b2] pt-5" aria-label="Chia sẻ bài viết"><h3 className="mb-3 text-sm font-semibold">Chia sẻ đến bạn bè</h3><div className="flex flex-wrap gap-2"><button className={style} onClick={copy}>Copy link</button><button className={style} onClick={download}>↓ Tải ảnh</button>{['Facebook', 'Zalo', 'Messenger'].map(service => <button className={style} key={service} onClick={() => share(service)}>{service}</button>)}</div>{notice && <p role="status" className="mt-3 break-words text-xs leading-6">{notice}</p>}</section>;
}
