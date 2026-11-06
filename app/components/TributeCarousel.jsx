'use client';
import { useEffect, useRef } from 'react';
import TributeCard from './TributeCard';
import TributeHeart from './TributeHeart';
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
  }, [items.map(item=>item.id).join(',')]);
  return <section aria-label="Các lời tri ân">
    <div ref={rail} className="tribute-carousel">{items.map(item => <div key={item.id} className="tribute-carousel-item text-left"><button type="button" onClick={() => onOpen(item)} className="tribute-card-open text-left"><TributeCard item={item} /></button><TributeHeart item={item} /></div>)}</div>
    <div className="mt-5 flex justify-center gap-3 text-xs"><button type="button" className="rounded-lg border border-amber-200 px-4 py-2" onClick={() => move(-1)} aria-label="Cuộn lên">↑</button><button type="button" className="rounded-lg border border-amber-200 px-4 py-2" onClick={() => move(1)} aria-label="Cuộn xuống">↓</button></div>
  </section>;
}
