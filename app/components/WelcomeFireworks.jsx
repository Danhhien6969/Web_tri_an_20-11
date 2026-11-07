'use client';
import { useEffect, useRef } from 'react';
export default function WelcomeFireworks({ onDone }) {
 const canvasRef = useRef(null);
 useEffect(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onDone(); return; }
  const canvas = canvasRef.current, ctx = canvas.getContext('2d');
  if (!ctx) { onDone(); return; }
  let width, height, frame, start = null, previous = 0, exploded = false;
  const sparks = [], colors = ['#e92e52', '#ff7c9d', '#df9d25', '#f5bc42'];
  function resize() {
   width = window.innerWidth; height = window.innerHeight;
   const ratio = Math.min(window.devicePixelRatio || 1, 2);
   canvas.width = width * ratio; canvas.height = height * ratio;
   ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  resize(); window.addEventListener('resize', resize);
  function point(side, t) {
   const eased = 1 - Math.pow(1 - t, 2);
   return { x: width * (side === 0 ? .3 + .07 * eased : .7 - .07 * eased), y: height * (1.04 - .72 * eased) };
  }
  function burst() {
   // One synchronized bloom from the two incoming comets, without repeat launches.
   const count = width < 600 ? 80 : 130;
   for (let side = 0; side < 2; side++) {
    const center = point(side, 1);
    for (let i = 0; i < count; i++) {
     const angle = i / count * Math.PI * 2, ring = i % 3;
     const speed = Math.min(width, height) * (.23 + ring * .13 + Math.random() * .06);
     sparks.push({ x: center.x, y: center.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0, life: 2 + Math.random() * .9, size: 1.8 + Math.random() * 1.8, color: colors[(i + side) % colors.length], star: i % 9 === 0, trail: [] });
    }
   }
  }
  function star(x, y, size) {
   ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size); ctx.stroke();
  }
  function draw(now) {
   if (start === null) { start = now; previous = now; }
   const elapsed = (now - start) / 1000, dt = Math.min((now - previous) / 1000, .04); previous = now;
   ctx.clearRect(0, 0, width, height); ctx.lineCap = 'round';
   if (elapsed < .85) {
    const t = elapsed / .85;
    for (let side = 0; side < 2; side++) {
     for (let j = 20; j >= 0; j--) {
      const p = point(side, Math.max(0, t - j * .011));
      ctx.globalAlpha = (1 - j / 21) * .8; ctx.fillStyle = j < 4 ? '#fff2b2' : '#d79924';
      ctx.beginPath(); ctx.arc(p.x, p.y, (1 - j / 24) * 3.5, 0, Math.PI * 2); ctx.fill();
     }
     const p = point(side, t); ctx.globalAlpha = 1; ctx.strokeStyle = '#e3a229'; ctx.lineWidth = 1.5; star(p.x, p.y, 7);
    }
   } else if (!exploded) { burst(); exploded = true; }
   for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i]; p.age += dt;
    if (p.age > p.life) { sparks.splice(i, 1); continue; }
    p.trail.unshift({ x: p.x, y: p.y }); if (p.trail.length > 5) p.trail.pop();
    const drag = Math.pow(.35, dt); p.vx *= drag; p.vy = p.vy * drag + height * .1 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    const fade = Math.pow(1 - p.age / p.life, .7);
    ctx.strokeStyle = p.color; ctx.lineWidth = p.size;
    if (p.trail.length) { ctx.globalAlpha = fade * .35; ctx.beginPath(); ctx.moveTo(p.trail[p.trail.length - 1].x, p.trail[p.trail.length - 1].y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    ctx.globalAlpha = fade; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    if (p.star) { ctx.lineWidth = 1; ctx.globalAlpha = fade * (.6 + .4 * Math.sin(p.age * 12) ** 2); star(p.x, p.y, p.size * 2.6); }
   }
   ctx.globalAlpha = 1;
   if (elapsed < 4.1) frame = requestAnimationFrame(draw); else onDone();
  }
  frame = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
 }, [onDone]);
 return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh', pointerEvents: 'none', zIndex: 1000 }} />;
}
