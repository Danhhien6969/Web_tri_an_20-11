'use client';
import { useEffect, useState } from 'react';
export function useBulkApproval({items,scope,api,basePath,busy,setBusy,onComplete,onNotice,onError}) {
 const [selected,setSelected]=useState([]);
 useEffect(()=>setSelected([]),[scope]);
 useEffect(()=>setSelected(ids=>ids.filter(id=>items.some(item=>item.id===id&&item.status!=='published'))),[items]);
 const eligible=items.filter(item=>item.status!=='published');
 const ids=selected.filter(id=>eligible.some(item=>item.id===id));
 function toggle(id){setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}
 async function approve(){
  if(busy||!ids.length)return;
  setBusy(true);onError('');onNotice('');const failed=[];let approved=0;
  try {
   for(const id of ids){try{await api(`${basePath}/${id}`,{method:'PATCH',body:JSON.stringify({status:'published'})});approved++;}catch{failed.push(id);}}
   setSelected(failed);onNotice(`Đã duyệt ${approved}/${ids.length} bài đã chọn.`);
   if(failed.length)onError(`${failed.length} bài chưa duyệt được. Các bài này vẫn được chọn để thử lại.`);
   onComplete();
  } finally {setBusy(false);}
 }
 const checkbox=item=>item.status!=='published'&&<label className="mb-4 inline-flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={ids.includes(item.id)} onChange={()=>toggle(item.id)} className="h-4 w-4 accent-rose"/>Chọn bài này</label>;
 const toolbar=<div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-amber-200 bg-white p-4"><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-rose" disabled={busy||!eligible.length} checked={eligible.length>0&&ids.length===eligible.length} onChange={e=>setSelected(e.target.checked?eligible.map(item=>item.id):[])}/>Chọn tất cả bài chưa đăng trên trang này</label><span className="text-xs text-stone-500">Đã chọn {ids.length} bài</span><button type="button" disabled={busy||!ids.length} onClick={approve} className="rounded-lg bg-rose px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Đang xử lý…':`Duyệt các bài đã chọn (${ids.length})`}</button></div>;
 return {checkbox,toolbar};
}
