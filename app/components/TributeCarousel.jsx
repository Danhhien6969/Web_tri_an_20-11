'use client';
import { useEffect, useRef } from 'react';
import TributeCard from './TributeCard';
export default function TributeCarousel({ items, onOpen, onNextPage }) {
  const rail = useRef(null);
  function move(direction) {
    const el = rail.current;
    if (!el) return;
    const end = el.scrollHeight - el.clientHeight;
    if (direction > 0 && el.scrollTop >= end - 4) {
      if (onNextPage) onNextPage();
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else el.scrollBy({ top: direction * (el.firstElementChild?.getBoundingClientRect().height + 16 || el.clientHeight), behavior: 'smooth' });
  }
  useEffect(() => {
    rail.current?.scrollTo({ top: 0 });
  }, [items]);
  return <section aria-label="Các lời tri ân">
    <div ref={rail} className="tribute-carousel">{items.map(item => <button key={item.id} onClick={() => onOpen(item)} className="tribute-carousel-item text-left"><TributeCard item={item} /></button>)}</div>
    <div className="mt-5 flex justify-center gap-3 text-xs"><button type="button" className="rounded-lg border border-amber-200 px-4 py-2" onClick={() => move(-1)} aria-label="Cuộn lên">↑</button><button type="button" className="rounded-lg border border-amber-200 px-4 py-2" onClick={() => move(1)} aria-label="Cuộn xuống">↓</button></div>
  </section>;
}
