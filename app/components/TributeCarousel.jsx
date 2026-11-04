'use client';
import { useEffect, useRef, useState } from 'react';
import TributeCard from './TributeCard';
export default function TributeCarousel({ items, onOpen, onNextPage }) {
  const rail = useRef(null);
  const paused = useRef(false);
  const [auto, setAuto] = useState(true);
  function move(direction) {
    const el = rail.current;
    if (!el) return;
    const end = el.scrollWidth - el.clientWidth;
    if (direction > 0 && el.scrollLeft >= end - 4) {
      if (onNextPage) onNextPage();
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else el.scrollBy({ left: direction * (el.firstElementChild?.getBoundingClientRect().width + 16 || el.clientWidth), behavior: 'smooth' });
  }
  useEffect(() => {
    rail.current?.scrollTo({ left: 0 });
  }, [items]);
  useEffect(() => {
    if (!auto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      if (!paused.current && !document.hidden && !document.querySelector('dialog[open]')) move(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [auto, items, onNextPage]);
  return <section aria-label="Các lời tri ân" onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }} onFocusCapture={() => { paused.current = true; }} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) paused.current = false; }}>
    <div ref={rail} className="tribute-carousel">{items.map(item => <button key={item.id} onClick={() => onOpen(item)} className="tribute-carousel-item text-left"><TributeCard item={item} /></button>)}</div>
    <div className="mt-5 flex justify-center gap-3 text-xs"><button type="button" className="rounded-lg border border-amber-200 px-4 py-2" onClick={() => move(-1)} aria-label="Bài trước">←</button><button type="button" className="rounded-lg border border-amber-200 px-4 py-2" onClick={() => setAuto(x => !x)}>{auto ? 'Tạm dừng' : 'Tự động chuyển'}</button><button type="button" className="rounded-lg border border-amber-200 px-4 py-2" onClick={() => move(1)} aria-label="Bài tiếp theo">→</button></div>
  </section>;
}
