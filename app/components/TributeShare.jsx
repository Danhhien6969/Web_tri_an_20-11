'use client';
import { useState } from 'react';
import TributeImageDownload from './TributeImageDownload';
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
  const style = 'rounded-lg border border-[#efd6b2] bg-white px-3 py-2 text-xs hover:bg-amber-50';
  return <section className="mt-7 border-t border-[#efd6b2] pt-5" aria-label="Chia sẻ bài viết"><h3 className="mb-3 text-sm font-semibold">Chia sẻ đến bạn bè</h3><div className="flex flex-wrap gap-2"><button className={style} onClick={copy}>Copy link</button><TributeImageDownload key={item.id} item={item} label="↓ Tải ảnh" style={style}/>{['Facebook', 'Zalo', 'Messenger'].map(service => <button className={style} key={service} onClick={() => share(service)}>{service}</button>)}</div>{notice && <p role="status" className="mt-3 break-words text-xs leading-6">{notice}</p>}</section>;
}
