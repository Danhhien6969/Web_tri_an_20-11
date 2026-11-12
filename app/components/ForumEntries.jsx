'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import ForumComments from './ForumComments';
import TributeImageDownload from './TributeImageDownload';
export default function ForumEntries() {
  const [items,setItems]=useState([]), [page,setPage]=useState(1), [pages,setPages]=useState(0), [error,setError]=useState(''), [loading,setLoading]=useState(true), [selected,setSelected]=useState(null), [detailError,setDetailError]=useState(''), [retry,setRetry]=useState(0);
  const [shareStatus,setShareStatus]=useState(''), [showLink,setShowLink]=useState(false);
  const [focusComments,setFocusComments]=useState(false);
  const [voted,setVoted]=useState({}),[voting,setVoting]=useState(''),[voteError,setVoteError]=useState('');
  useEffect(()=>{try{setVoted(JSON.parse(localStorage.getItem('forum-voted')||'{}'));}catch{}},[]);
  const dialog=useRef(null); const requestId=useRef(0);
  useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');fetch('/api/forum?page='+page,{signal:controller.signal,cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error);setItems(data.items);setPages(data.pages);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[page,retry]);
  const open=useCallback(async (id,comments=false)=>{setShareStatus('');setShowLink(false);setVoteError('');setFocusComments(comments);const current=++requestId.current;setSelected(null);setDetailError('');if(!dialog.current.open)dialog.current.showModal();try{const r=await fetch('/api/forum/'+id,{cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error);if(current===requestId.current)setSelected(data.item);}catch(e){if(current===requestId.current)setDetailError(e.message||'Chưa tải được bài viết.');}},[]);
  useEffect(()=>{
    const id=new URLSearchParams(window.location.search).get('dau-an');
    if(id && /^[a-f\d]{24}$/i.test(id))open(id.toLowerCase());
    return()=>{requestId.current++;};
  },[open]);
  function closeStory(){
    requestId.current++;
    const url=new URL(window.location.href);
    if(url.searchParams.has('dau-an')){
      url.searchParams.delete('dau-an');
      window.history.replaceState(window.history.state,'',url);
    }
  }
  function storyLink(id){
    const url=new URL('/',window.location.origin);
    url.searchParams.set('dau-an',id);
    return url.href;
  }
  async function shareStory(item,copy=false){
    const url=storyLink(item.id);
    setShareStatus('');
    try{
      if(!copy && navigator.share){
        await navigator.share({title:item.title,url});
      }else{
        await navigator.clipboard.writeText(url);
        setShareStatus('Đã sao chép liên kết bài viết.');
      }
    }catch(error){
      if(error.name!=='AbortError'){
        setShowLink(true);
        setShareStatus('Hãy sao chép liên kết bên dưới để chia sẻ.');
      }
    }
  }
  async function vote(id){
    if(voting||voted[id])return;setVoting(id);setVoteError('');
    try{let voter=localStorage.getItem('forum-voter');if(!voter){voter=crypto.randomUUID();localStorage.setItem('forum-voter',voter);}
      const response=await fetch('/api/forum/'+id+'/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({voter})});const data=await response.json();if(!response.ok)throw Error(data.error);
      setItems(old=>old.map(x=>x.id===id?{...x,votes:data.votes}:x));setSelected(old=>old?.id===id?{...old,votes:data.votes}:old);
      setVoted(old=>{const next={...old,[id]:true};try{localStorage.setItem('forum-voted',JSON.stringify(next));}catch{}return next;});
    }catch(e){setVoteError(e.message||'Chưa gửi được bình chọn.');}finally{setVoting('');}
  }
  function voteButton(item){return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ecd9c5] p-4"><button type="button" disabled={!!voting||!!voted[item.id]} onClick={()=>vote(item.id)} className="rounded-lg bg-rose px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{voting===item.id?'Đang gửi…':voted[item.id]?'♥ Đã bình chọn':'♡ Bình chọn'}</button><span aria-live="polite" className="text-sm text-stone-600">{item.votes||0} lượt bình chọn</span></div>;}
  return <section id="danh-sach-dau-an" className="mx-5 mb-12 border-t border-[#edddc2] py-10 md:mx-7"><div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs tracking-widest text-[#be7660]">NGƯỜI THẦY/CÔ TRONG TÔI</p><h2 className="mt-3 font-display text-3xl">Danh sách những dấu ấn cùng Thầy/Cô</h2></div><a href="/nhung-dau-an-thay-co/dang-ky" className="rounded-lg bg-rose px-5 py-3 text-sm font-semibold text-white">Viết câu chuyện của bạn →</a></div>{loading ? <p role="status">Đang tải những câu chuyện…</p> : error ? <div role="alert"><p>{error}</p><button className="mt-2 text-rose underline" onClick={()=>setRetry(x=>x+1)}>Thử lại</button></div> : items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(item=><article key={item.id} className="overflow-hidden rounded-xl border border-[#ecd9c5] bg-white text-left shadow-sm transition hover:shadow-md"><button onClick={()=>open(item.id)} className="block w-full text-left"><img src={'/api/forum/'+item.id+'/image'} alt={'Ảnh đại diện bài '+item.title} loading="lazy" className="aspect-[3/2] w-full object-cover"/><div className="p-5"><h3 className="line-clamp-2 font-display text-xl">{item.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{item.excerpt}</p><p className="mt-4 text-xs text-stone-500">{item.name} · {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p><span className="mt-3 block text-xs font-semibold text-rose">Đọc câu chuyện →</span></div></button>{voteButton(item)}<button type="button" className="forum-comment-link" onClick={()=>open(item.id,true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-3 2 2-6a8.5 8.5 0 1 1 18-4.5Z"/></svg>Bình luận <span>({item.comments||0})</span></button></article>)}</div> : <p className="rounded-xl border border-dashed border-[#e6c89d] p-8 text-center text-sm">Chưa có câu chuyện được đăng. Hãy chia sẻ dấu ấn của Thầy/Cô trong bạn.</p>}{voteError && <p role="alert" className="my-3 text-sm text-red-700">{voteError}</p>}{!loading && pages>1 && <nav aria-label="Trang câu chuyện" className="mt-6 flex justify-center gap-5 text-sm"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Trước</button><span>{page}/{pages}</span><button disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Sau →</button></nav>}<dialog ref={dialog} onClose={closeStory} className="forum-story-reader text-ink"><button onClick={()=>dialog.current.close()} aria-label="Đóng câu chuyện" className="forum-story-close">×</button>{detailError ? <p role="alert">{detailError}</p> : !selected ? <p role="status">Đang mở câu chuyện…</p> : <article className="forum-story-paper"><h2 className="pr-8 font-display text-3xl">{selected.title}</h2><p className="my-4 text-sm text-stone-500">Tác giả: {selected.name}{selected.unit && <span className="mt-1 block">Thuộc đơn vị: {selected.unit}</span>}</p><div className="mb-5 rounded-xl border border-[#ecd9c5] bg-white/80">
      <div className="flex flex-wrap gap-2 p-4 text-sm font-semibold text-rose">
        <button type="button" className="rounded-lg border border-[#ecd9c5] px-3 py-2" onClick={()=>shareStory(selected)}>Chia sẻ bài viết</button>
        <button type="button" className="rounded-lg border border-[#ecd9c5] px-3 py-2" onClick={()=>shareStory(selected,true)}>Sao chép liên kết</button>
        <TributeImageDownload
          key={selected.id}
          item={{
            id:selected.id, title:selected.title, message:selected.content, sender:selected.name, senderDepartment:selected.unit,
            image:'/api/forum/'+selected.id+'/image',
          }}
          label="↓ Tải thiệp PNG"
          style="rounded-lg border border-[#ecd9c5] px-3 py-2"
        />
      </div>
      {shareStatus && <p role="status" className="px-4 pb-3 text-sm">{shareStatus}</p>}
      {showLink && <div className="px-4 pb-3"><input aria-label="Liên kết bài viết" className="w-full rounded border p-2 text-sm" readOnly value={storyLink(selected.id)} onFocus={event=>event.target.select()}/></div>}
      {voteButton(selected)}
      {voteError && <p role="alert" className="px-4 pb-3 text-sm text-red-700">{voteError}</p>}
    </div><img src={'/api/forum/'+selected.id+'/image'} alt="Ảnh đại diện bài viết" className="mb-6 max-h-96 w-full rounded-xl object-contain"/><div className="whitespace-pre-wrap break-words text-base leading-8" style={{textAlign:selected.alignment || 'left',color:selected.textColor || '#000'}}>{selected.contentRuns?.length ? selected.contentRuns.map((run,i)=><span key={i} style={{color:run.color,fontWeight:run.bold ? 700 : 400}}>{run.text}</span>) : selected.content}</div>{selected.hasArticleImage && <img src={'/api/forum/'+selected.id+'/image?kind=article'} alt="Ảnh minh họa câu chuyện" className="mt-6 max-h-[600px] w-full rounded-xl object-contain"/>}<ForumComments key={selected.id} entryId={selected.id} focusOnOpen={focusComments} onCreated={total=>setItems(current=>current.map(item=>item.id===selected.id?{...item,comments:total}:item))}/></article>}</dialog></section>;
}
