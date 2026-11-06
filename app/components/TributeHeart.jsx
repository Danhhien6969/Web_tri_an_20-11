'use client';
import { useEffect,useRef,useState } from 'react';
export default function TributeHeart({item}) {
 const [count,setCount]=useState(item.hearts||0),[liked,setLiked]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const sending=useRef(false);
 useEffect(()=>{setCount(item.hearts||0);},[item.id,item.hearts]);
 useEffect(()=>{
  try{setLiked(!!JSON.parse(localStorage.getItem('tribute-liked')||'{}')[item.id]);}catch{}
  const update=event=>{if(event.detail.id===item.id){setCount(event.detail.hearts);setLiked(true);setError('');}};
  window.addEventListener('tribute-heart',update);return()=>window.removeEventListener('tribute-heart',update);
 },[item.id]);
 async function like(){
  if(liked||sending.current)return;sending.current=true;setBusy(true);setError('');
  try{
   let voter=localStorage.getItem('tribute-voter');
   if(!voter){voter=crypto.randomUUID();localStorage.setItem('tribute-voter',voter);}
   const response=await fetch(`/api/tributes/${item.id}/heart`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({voter})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Chưa gửi được lượt yêu thích.');
   setCount(data.hearts);setLiked(true);
   try{const stored=JSON.parse(localStorage.getItem('tribute-liked')||'{}');localStorage.setItem('tribute-liked',JSON.stringify({...stored,[item.id]:true}));}catch{}
   window.dispatchEvent(new CustomEvent('tribute-heart',{detail:{id:item.id,hearts:data.hearts}}));
  }catch(error){setError(error.message||'Chưa thả tim được. Vui lòng thử lại.');}finally{sending.current=false;setBusy(false);}
 }
 return <div className="tribute-heart-wrap"><button type="button" className={`tribute-heart ${liked?'is-liked':''}`} onClick={like} disabled={busy||liked} aria-pressed={liked} aria-label={`${liked?'Đã yêu thích':'Thả tim cho'} lời tri ân: ${count} lượt yêu thích`} title={liked?'Bạn đã thả tim bài viết này':'Thả tim cho lời tri ân'}><svg aria-hidden="true" viewBox="0 0 24 24" fill={liked?'currentColor':'none'} stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span aria-live="polite">{count}</span></button>{error&&<p role="alert" className="text-xs text-red-700">{error}</p>}</div>;
}
