'use client';
import { useEffect,useId,useRef,useState } from 'react';
export default function ForumComments({entryId,focusOnOpen=false,onCreated}) {
 const [items,setItems]=useState([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[pages,setPages]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState(''),[sendError,setSendError]=useState(''),[notice,setNotice]=useState(''),[name,setName]=useState(''),[unit,setUnit]=useState(''),[message,setMessage]=useState(''),[sending,setSending]=useState(false),[revision,setRevision]=useState(0);
 const section=useRef(null),text=useRef(null),submission=useRef(null),inflight=useRef(false),visitor=useRef(null),nameId=useId(),unitId=useId(),messageId=useId();
 useEffect(()=>{try{setName(localStorage.getItem('forum-comment-name')||'');setUnit(localStorage.getItem('forum-comment-unit')||'');}catch{}if(focusOnOpen){section.current.scrollIntoView({block:'start',behavior:'smooth'});text.current.focus({preventScroll:true});}},[entryId]);
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError('');
  fetch(`/api/forum/${entryId}/comments?page=${page}`,{cache:'no-store',signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error);if(!controller.signal.aborted){setItems(data.items);setTotal(data.total);setPages(data.pages);}}).catch(error=>{if(!controller.signal.aborted)setError(error.message||'Chưa tải được bình luận.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[entryId,page,revision]);
 async function send(event){
  event.preventDefault();if(inflight.current)return;inflight.current=true;setSending(true);setSendError('');setNotice('');
  try{
   if(!visitor.current){try{visitor.current=localStorage.getItem('forum-comment-visitor');}catch{}visitor.current ||= crypto.randomUUID();try{localStorage.setItem('forum-comment-visitor',visitor.current);}catch{}}
   submission.current ||= crypto.randomUUID();
   const response=await fetch(`/api/forum/${entryId}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,unit,message,visitor:visitor.current,submission:submission.current})});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Chưa gửi được bình luận.');
   setMessage('');submission.current=null;setTotal(data.total);setPage(1);setRevision(value=>value+1);setNotice('Đã gửi bình luận. Cảm ơn bạn đã chia sẻ!');onCreated?.(data.total);
   try{localStorage.setItem('forum-comment-name',name.trim());localStorage.setItem('forum-comment-unit',unit.trim());}catch{}
  }catch(error){setSendError(error.message||'Chưa gửi được bình luận. Nội dung của bạn vẫn được giữ lại.');}finally{inflight.current=false;setSending(false);}
 }
 return <section ref={section} className="forum-comments" aria-label="Bình luận bài viết"><div className="forum-comments-heading"><h3>Bình luận</h3><span aria-live="polite">{total} bình luận</span></div><p className="forum-comments-intro">Cùng chia sẻ cảm xúc và những lời động viên dành cho câu chuyện này.</p>
  <form onSubmit={send} className="forum-comment-form"><label htmlFor={nameId}>Tên của bạn<input id={nameId} autoComplete="name" required maxLength={70} value={name} disabled={sending} onChange={event=>setName(event.target.value)} placeholder="Nhập họ và tên…"/></label><label htmlFor={unitId}>Tên đơn vị<input id={unitId} maxLength={120} value={unit} disabled={sending} onChange={event=>{setUnit(event.target.value);submission.current=null;}} placeholder="Nhập tên đơn vị…"/></label><label htmlFor={messageId}>Nội dung bình luận<textarea ref={text} id={messageId} required maxLength={2000} rows={3} value={message} disabled={sending} onChange={event=>{setMessage(event.target.value);submission.current=null;}} placeholder="Viết bình luận của bạn…"/></label><div className="forum-comment-form-bottom"><small>Tên, đơn vị và bình luận của bạn sẽ hiển thị công khai.</small><button type="submit" disabled={sending||!name.trim()||!message.trim()}>{sending?'Đang gửi…':'Gửi bình luận →'}</button></div>{sendError&&<p role="alert" className="text-sm text-red-700">{sendError}</p>}{notice&&<p role="status" className="text-sm text-green-800">{notice}</p>}</form>
  {loading?<p role="status" className="py-5 text-sm text-stone-500">Đang tải bình luận…</p>:error?<div role="alert" className="py-5 text-sm"><p>{error}</p><button type="button" className="mt-2 text-rose underline" onClick={()=>setRevision(value=>value+1)}>Thử lại</button></div>:items.length?<ol className="forum-comment-list">{items.map(item=><li key={item.id}><span className="forum-comment-avatar" aria-hidden="true">{item.name.charAt(0).toUpperCase()}</span><div><div className="forum-comment-meta"><strong>{item.name}</strong><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</time></div>{item.unit&&<div className="mt-1 text-xs text-stone-500">Đơn vị: {item.unit}</div>}<p>{item.message}</p></div></li>)}</ol>:<p className="forum-comments-empty">Chưa có bình luận. Hãy là người đầu tiên chia sẻ cảm xúc nhé.</p>}
  {!loading&&pages>1&&<nav aria-label="Trang bình luận" className="mt-5 flex justify-center gap-5 text-sm"><button type="button" disabled={page<=1} onClick={()=>setPage(value=>value-1)}>← Trước</button><span>Trang {page}/{pages}</span><button type="button" disabled={page>=pages} onClick={()=>setPage(value=>value+1)}>Sau →</button></nav>}
 </section>;
}
