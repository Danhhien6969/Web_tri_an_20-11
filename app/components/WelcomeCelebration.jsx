'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import WelcomeFireworks from './WelcomeFireworks';
const key = 'welcome-teachers-day-2026';
export default function WelcomeCelebration() {
 const dialog = useRef(null);
 const [fireworks,setFireworks]=useState(false);
 const finishFireworks=useCallback(()=>setFireworks(false),[]);
 useEffect(() => {
  // Shared article links should open directly without an introduction.
  if (location.hash || location.search) return;
  try { if (sessionStorage.getItem(key)) return; } catch {}
  const element = dialog.current;
  const previous = document.activeElement;
  element.showModal();
  const overflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => { element.close(); document.body.style.overflow = overflow; previous?.focus?.({preventScroll:true}); };
 }, []);
 function close() {
  try { sessionStorage.setItem(key, '1'); } catch {}
  dialog.current.close();
  document.body.style.overflow = '';
 }
 return <>{fireworks && <WelcomeFireworks onDone={finishFireworks}/>}<dialog ref={dialog} className="welcome-celebration" aria-labelledby="welcome-title" onCancel={event => {event.preventDefault();close();}}>
  <div className="welcome-particles" aria-hidden="true">{Array.from({length:18},(_,i)=><span key={i} style={{'--x':`${(i*37)%100}%`,'--delay':`${-(i%7)}s`,'--duration':`${6+i%5}s`}}>{i%3===0?'✿':'♥'}</span>)}</div>
  <button type="button" className="welcome-close" onClick={close} aria-label="Đóng lời chào mừng">×</button>
  <div className="welcome-content">
   <div className="welcome-logos"><img src="/logo-doan.png" alt="Đoàn Thanh niên"/><img src="/logo-hutech.png" alt="HUTECH University"/><img src="/logo-hoi.png" alt="Hội Sinh viên Việt Nam"/></div>
   <p className="welcome-eyebrow">THÁNG 11 · MÙA TRI ÂN</p>
   <h2 id="welcome-title">Chào mừng<br/>Ngày Nhà giáo Việt Nam</h2>
   <p className="welcome-date">20<span> / </span>11</p>
   <p className="welcome-script">Từ trái tim người học trò</p>
   <p className="welcome-message">Xin gửi đến Thầy, Cô những lời cảm ơn và yêu thương chân thành nhất.</p>
   <button type="button" className="welcome-enter" onClick={()=>{close();setFireworks(true);}} autoFocus>Khám phá ngay <span aria-hidden="true">→</span></button>
  </div>
 </dialog></>;
}
