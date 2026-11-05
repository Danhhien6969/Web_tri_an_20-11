'use client';
import { useEffect, useId, useRef, useState } from 'react';
export default function AdminExpandableContent({children}) {
 const content=useRef(null),id=useId();
 const [expanded,setExpanded]=useState(false),[overflow,setOverflow]=useState(false);
 useEffect(()=>{
  const element=content.current;
  const measure=()=>setOverflow(element.scrollHeight>113);
  measure();const observer=new ResizeObserver(measure);observer.observe(element);
  return()=>observer.disconnect();
 },[children]);
 return <div><div id={id} ref={content} style={expanded?undefined:{maxHeight:112,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:4,WebkitBoxOrient:'vertical'}}>{children}</div>{overflow&&<button type="button" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(value=>!value)} className="mt-2 text-sm font-semibold text-rose underline underline-offset-4">{expanded?'Thu gọn ↑':'Xem thêm ↓'}</button>}</div>;
}
