'use client';
import { useRef, useState } from 'react';
const colors = [['#dc2626','Đỏ'],['#1565c0','Xanh nước biển'],['#ca8a04','Vàng'],['#000000','Đen']];
export default function ForumEditor({ value, onChange, disabled }) {
  const editor = useRef(null); const selection = useRef(null);
  const [runs, setRuns] = useState([]); const [notice, setNotice] = useState('');
  function remember() { const s=window.getSelection(); if(s?.rangeCount && editor.current.contains(s.anchorNode) && editor.current.contains(s.focusNode)) selection.current=s.getRangeAt(0).cloneRange(); }
  function sync() {
    const result=[];
    function walk(node) {
      if(node.nodeType===3) { const style=getComputedStyle(node.parentElement); result.push({ text:node.textContent, color:style.color, bold:Number(style.fontWeight)>=600 }); return; }
      if(node.nodeName==='BR') { result.push({text:'\n',color:'rgb(0, 0, 0)',bold:false}); return; }
      if(['DIV','P'].includes(node.nodeName) && result.length && !result.at(-1).text.endsWith('\n')) result.push({text:'\n',color:'rgb(0, 0, 0)',bold:false});
      node.childNodes.forEach(walk);
    }
    editor.current.childNodes.forEach(walk); setRuns(result); onChange(result.map(r=>r.text).join('')); remember();
  }
  function format(command, color) {
    const range=selection.current;
    if(!range || range.collapsed || !editor.current.contains(range.commonAncestorContainer)) { setNotice('Hãy bôi đen phần chữ cần định dạng trước.'); return; }
    editor.current.focus(); const s=window.getSelection(); s.removeAllRanges(); s.addRange(range);
    document.execCommand(command,false,color); setNotice(''); sync();
  }
  return <div className="text-sm"><label id="forum-content-label" className="font-semibold">Nội dung <span className="text-rose">*</span></label><div role="toolbar" aria-label="Định dạng nội dung" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#ecd9c5] bg-[#fff9ee] p-3"><span className="text-xs">Căn lề: <b>Đều hai bên</b></span><button type="button" disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>format('bold')} className="rounded-lg border border-[#ecd9c5] bg-white px-3 py-2 font-bold" aria-label="In đậm phần đã chọn">B</button><span className="text-xs">Màu chữ:</span>{colors.map(([color,label])=><button key={color} type="button" disabled={disabled} title={label} aria-label={`Màu ${label} cho phần đã chọn`} onMouseDown={e=>e.preventDefault()} onClick={()=>format('foreColor',color)} className="h-7 w-7 rounded-full border-2 border-white shadow-sm" style={{background:color}} />)}</div><p className="mt-2 text-xs text-stone-500">Bôi đen chữ để chọn màu hoặc in đậm.</p>{notice && <p role="status" className="mt-2 text-xs text-rose">{notice}</p>}<div ref={editor} contentEditable={!disabled} suppressContentEditableWarning role="textbox" aria-multiline="true" aria-labelledby="forum-content-label" data-placeholder="Chia sẻ câu chuyện về người Thầy/Cô của bạn…" onInput={sync} onMouseUp={remember} onKeyUp={remember} onPaste={e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));sync();}} className="forum-rich-editor mt-3 min-h-[320px] rounded-xl border border-[#ecd9c5] bg-white p-4 font-normal outline-none focus:border-rose" style={{textAlign:'justify',color:'#000',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}} /><input type="hidden" name="content" value={value} /><input type="hidden" name="contentRuns" value={JSON.stringify(runs)} /><input type="hidden" name="alignment" value="justify" /><input type="hidden" name="textColor" value="#000000" /><p className="mt-1 text-right text-xs text-stone-500">{value.trim() ? value.trim().split(/\s+/u).length : 0}/1500 từ</p></div>;
}
