'use client';
import GratitudeTree from './components/GratitudeTree';
import ForumEntries from './components/ForumEntries';
import HomeBackdrop from './components/HomeBackdrop';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import TributeConfetti from './components/TributeConfetti';
import TributeComposer from './components/TributeComposer';
import TributeCard from './components/TributeCard';
import TributeCarousel from './components/TributeCarousel';
import TributeShare from './components/TributeShare';
import { listKey, loadTributes, readListCache, writeListCache } from '../lib/tribute-loader.js';

const button = 'rounded-lg bg-rose px-5 py-3 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50';
const eyebrow = 'text-[10px] font-bold tracking-[.2em] text-[#be7660]';
function Brand() { return <a href="#" className="flex flex-col leading-tight text-rose"><span className="font-script text-3xl">Từ trái tim</span><small className="mt-1 text-[9px] tracking-[.3em]">NGƯỜI HỌC TRÒ</small></a>; }

export default function Home() {
  useLayoutEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation?.type !== 'reload') return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
    const top = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    top();
    const frame = requestAnimationFrame(top);
    window.addEventListener('load', top, { once: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('load', top); history.scrollRestoration = previous; };
  }, []);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState(null);
  const [revision, setRevision] = useState(0);
  const [toast, setToast] = useState('');
  const formDialog = useRef(null);
  const readDialog = useRef(null);
  const form = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const key = listKey(query, page);
    let cached = null;
    try { cached = readListCache(sessionStorage, key); } catch {}
    setItems(cached?.items || []); setTotal(cached?.total || 0); setPages(cached?.pages || 0);
    setStale(!!cached);
    setLoading(true); setError('');
    const timer = setTimeout(async () => {
      try {
        const data = await loadTributes(query, page, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setItems(data.items); setTotal(data.total); setPages(data.pages); setStale(false);
        try { writeListCache(sessionStorage, key, data); } catch {}
      } catch (e) { if (!controller.signal.aborted) setError(e.message || 'Chưa tải được lời tri ân.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, page, revision]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); } }, [toast]);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('tribute');
    if (!id) return;
    const controller = new AbortController();
    fetch('/api/tributes/' + encodeURIComponent(id), { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json(); setSelected(data.item); readDialog.current.showModal();
    }).catch(error => { if (error.name !== 'AbortError') setToast('Bài viết chưa được duyệt hoặc không còn hiển thị.'); });
    return () => controller.abort();
  }, []);

  function openForm() { setFormError(''); formDialog.current.showModal(); }
  async function sendTribute(e) {
    e.preventDefault(); if (sending) return;
    setSending(true); setFormError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const response = await fetch('/api/tributes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      form.current.reset(); formDialog.current.close();
      setQuery(''); setPage(1); setRevision(x => x + 1);
      setToast('Đã gửi lời tri ân ♡ Bài sẽ hiển thị sau khi quản trị viên duyệt.');
      document.querySelector('#loi-tri-an').scrollIntoView();
    } catch (e) { setFormError(e.message || 'Chưa gửi được lời nhắn. Vui lòng thử lại.'); }
    finally { setSending(false); }
  }

  return <>
    <TributeConfetti />
    <HomeBackdrop />
    <div className="bg-gold/70 px-3 py-2 text-center text-[9px] tracking-widest">CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM <b className="ml-4 text-rose">20 / 11</b></div>
    <header className="home-menu sticky top-0 z-20 mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 border-b border-[#eeddc7] bg-cream px-5 py-4 md:px-7">
      <Brand /><nav aria-label="Điều hướng chính" className="flex flex-wrap items-center gap-3 text-xs font-semibold md:gap-7"><a className="text-rose" href="/nhung-dau-an-thay-co">Những dấu ấn cùng Thầy, Cô</a><a className="hidden md:block" href="#loi-tri-an">Lời tri ân</a><button className={button} onClick={openForm}>✎ &nbsp; Gửi lời tri ân</button></nav>
    </header>
    <main className="mx-auto max-w-[1240px]">
      <section className="mx-auto w-full max-w-[960px] overflow-hidden md:rounded-b-xl" aria-label="Từ trái tim người học trò gửi đến thầy cô">
        <img src="/banner.png" width="6773" height="3716" alt="Từ trái tim người học trò gửi đến thầy cô! Happy Teachers’ Day 20.11" className="h-auto w-full" fetchPriority="high" />
        <a href="#loi-tri-an" className="flex items-center justify-between bg-gold/70 px-6 py-3 text-[10px] tracking-wide">Khám phá những lời yêu thương <span className="text-2xl text-rose">↓</span></a>
      </section>
      <section id="ky-uc" className="gratitude-intro relative overflow-hidden px-6 py-10 text-center md:py-14">
        <div className="gratitude-illustration"><img src="/teachers-gratitude.png" width="800" height="1100" alt="Thầy cô cùng hoa và sách trong ngày tri ân" loading="lazy" /></div>
        <div className="gratitude-intro-copy">
        <span className={eyebrow}>THÁNG 11 • MÙA TRI ÂN</span>
        <h1 className="my-5 font-display text-4xl leading-snug md:text-5xl">Có những lời cảm ơn,<br /><em className="text-rose">mãi còn trong tim.</em></h1>
        <p className="text-sm leading-7 text-[#90766a]">Một bài giảng, một lời động viên, một ánh mắt tin tưởng.<br className="hidden md:block" /> Có những điều nhỏ bé thầy cô trao, theo chúng ta suốt cuộc đời.</p>
        <button onClick={openForm} className="mt-6 text-xs font-semibold text-rose">Viết lời cảm ơn của bạn &nbsp; ↗</button>
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute -right-5 bottom-5 text-[90px] text-amber-300/40 md:right-5">✿</span>
      </section>
      <GratitudeTree revision={revision} onOpen={item => { setSelected(item); readDialog.current.showModal(); }} />
      <section id="loi-tri-an" className="border-t border-[#edddc2] bg-linear-to-b from-[#fff9e4] to-cream px-5 py-12 md:px-7">
        <div className="flex items-center justify-between gap-5"><div><span className={eyebrow}>TỪ TRÁI TIM NGƯỜI HỌC TRÒ</span><h2 className="my-3 font-display text-3xl">Danh sách lời tri ân</h2><p className="text-xs text-[#917867]">Mỗi lời nhắn là một đóa hoa dành tặng thầy cô.</p></div><button className={`${button} hidden md:block`} onClick={openForm}>✎ &nbsp; Gửi lời tri ân</button></div>
        <div className="mt-7 mb-6 flex items-center justify-between gap-4"><label className="flex w-full max-w-sm items-center gap-3 rounded-lg border border-[#ead9bc] bg-white/70 px-4 py-3"><span aria-hidden="true">⌕</span><input type="search" maxLength={100} aria-label="Tìm lời tri ân" placeholder="Tìm tên thầy cô, người gửi…" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label><span aria-live="polite" className="shrink-0 text-xs text-[#9c7a65]">{loading ? (items.length ? 'Đang cập nhật…' : 'Đang tải…') : error && !items.length ? '' : `${total} lời nhắn`}</span></div>
        {stale && items.length > 0 && <p role="status" className="mb-4 text-xs leading-6 text-amber-800">Đang hiển thị bản đã tải gần đây. {loading ? 'Đang kết nối để lấy dữ liệu mới nhất…' : 'Chưa cập nhật được dữ liệu mới nhất.'}</p>}
        {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-5 text-sm"><p>{error}</p><button className="mt-3 font-semibold text-rose underline" onClick={() => setRevision(x => x + 1)}>Thử lại</button></div>}
        {loading && !items.length && <p role="status" className="py-12 text-center text-sm text-[#917867]">Đang mở những lời yêu thương…</p>}
        {!loading && !error && items.length === 0 && <div className="rounded-xl border border-dashed border-[#e6c89d] p-12 text-center"><span className="text-4xl text-rose">♡</span><p className="mt-4 text-sm">{query ? 'Chưa tìm thấy lời tri ân phù hợp.' : 'Hãy là người đầu tiên gửi lời cảm ơn đến thầy cô.'}</p><button className={`${button} mt-5`} onClick={openForm}>Gửi lời tri ân đầu tiên</button></div>}
        {items.length > 0 && <TributeCarousel items={items} onOpen={item => { setSelected(item); readDialog.current.showModal(); }} onNextPage={pages > 1 ? () => setPage(p => p >= pages ? 1 : p + 1) : undefined} />}
        {!loading && !error && pages > 1 && <nav aria-label="Phân trang" className="mt-8 flex items-center justify-center gap-5 text-xs"><button className={button} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button><span>Trang {page} / {pages}</span><button className={button} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Sau →</button></nav>}
      </section>
      <section className="mx-5 mb-6 rounded-xl bg-gold/70 px-5 py-6 text-center md:mx-7"><span className="text-xl text-rose" aria-hidden="true">♡</span><p className="my-3 font-display text-2xl leading-snug">Dù đi muôn phương,<br /><em className="text-rose">vẫn nhớ một mái trường.</em></p><button className={button} onClick={openForm}>Gửi đến thầy cô một lời cảm ơn ↗</button></section>
      <div className="mx-5 mb-8 overflow-hidden rounded-xl md:mx-7"><img src="/home-forum-poster.png" width="2169" height="725" alt="Từ trái tim người học trò gửi đến thầy cô — nhận bài từ 05/11 đến 20/11, bài viết tối đa 1.500 từ" loading="lazy" className="h-auto w-full" /></div>
      <ForumEntries />
    </main>
    <footer className="mx-auto flex max-w-[1184px] flex-wrap items-center justify-between gap-6 border-t border-[#edddc2] px-5 py-9 text-xs"><Brand /><p className="leading-6">GỬI ĐẾN THẦY CÔ!<br /><span className="text-[#aa8970]">Chào mừng ngày Nhà giáo Việt Nam 20/11</span></p><a href="#">Về đầu trang ↑</a></footer>
    <TributeComposer dialogRef={formDialog} formRef={form} sending={sending} error={formError} onSubmit={sendTribute} />
    <dialog ref={readDialog} className="tribute-reader" aria-label="Lời tri ân và chia sẻ">
      <button className="reader-close" aria-label="Đóng" onClick={() => readDialog.current.close()}>×</button>
      {selected && <div className="reader-columns">
        <div className="reader-card"><TributeCard item={selected} expanded /></div>
        <div className="reader-actions"><button className="reader-compose" onClick={() => { readDialog.current.close(); openForm(); }}>✎ GỬI LỜI TRI ÂN CỦA TÔI</button><TributeShare key={selected.id} item={selected} /></div>
      </div>}
    </dialog>
    {toast && <div role="status" className="fixed bottom-6 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 rounded-xl bg-ink px-6 py-4 text-center text-xs leading-6 text-white shadow-lg">{toast}</div>}
  </>;
}
