'use client';
import { useEffect, useRef, useState } from 'react';
import { normalizeForumColor } from '../../lib/forum-format.js';
const colors = [['#dc2626','Đỏ'],['#1565c0','Xanh nước biển'],['#ca8a04','Vàng'],['#000000','Đen']];
export default function ForumEditor({ value, onChange, disabled }) {
  const editor = useRef(null); const selection = useRef(null);
  const [runs, setRuns] = useState([]); const [notice, setNotice] = useState('');
  const [alignment, setAlignment] = useState('left');
  const [bold, setBold] = useState(false);
  useEffect(() => { document.addEventListener('selectionchange', remember); return () => document.removeEventListener('selectionchange', remember); }, []);
  function remember() { const s=window.getSelection(); if(s?.rangeCount && editor.current.contains(s.anchorNode) && editor.current.contains(s.focusNode)) { selection.current=s.getRangeAt(0).cloneRange(); setBold(document.queryCommandState('bold')); } }
  useEffect(() => {
    const form=editor.current.closest('form');
    const serialize=event=>{const result=sync();event.formData.set('content',result.map(r=>r.text).join(''));event.formData.set('contentRuns',JSON.stringify(result));};
    form.addEventListener('formdata',serialize);
    return ()=>form.removeEventListener('formdata',serialize);
  }, []);
  function sync() {
    const result=[];
    function walk(node) {
      if(node.nodeType===3) { const style=getComputedStyle(node.parentElement); result.push({ text:node.textContent, color:normalizeForumColor(style.color), bold:Number(style.fontWeight)>=600 }); return; }
      if(node.nodeName==='BR') { result.push({text:'\n',color:'rgb(0, 0, 0)',bold:false}); return; }
      if(['DIV','P'].includes(node.nodeName) && result.length && !result.at(-1).text.endsWith('\n')) result.push({text:'\n',color:'rgb(0, 0, 0)',bold:false});
      node.childNodes.forEach(walk);
    }
    editor.current.childNodes.forEach(walk); setRuns(result); onChange(result.map(r=>r.text).join('')); remember(); return result;
  }
  function format(command, color) {
    const range=selection.current?.cloneRange();
    if(!range || (range.collapsed && command !== 'bold') || !editor.current.contains(range.commonAncestorContainer)) { setNotice('Hãy bôi đen phần chữ cần định dạng trước.'); return; }
    editor.current.focus(); const s=window.getSelection(); s.removeAllRanges(); s.addRange(range);
    document.execCommand(command,false,color); setBold(document.queryCommandState('bold')); setNotice(''); sync();
  }
  return <div className="text-sm"><label id="forum-content-label" className="font-semibold">Nội dung <span className="text-rose">*</span></label><div role="toolbar" aria-label="Định dạng nội dung" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#ecd9c5] bg-[#fff9ee] p-3"><span className="text-xs">Căn lề:</span><button type="button" disabled={disabled} aria-pressed={alignment === 'justify'} onMouseDown={e=>e.preventDefault()} onClick={()=>setAlignment(x=>x === 'justify' ? 'left' : 'justify')} className={`rounded-lg border px-3 py-2 text-xs ${alignment === 'justify' ? 'border-rose bg-rose text-white' : 'border-[#ecd9c5] bg-white'}`}>Đều hai bên</button><button type="button" disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>format('bold')} aria-pressed={bold} className={`rounded-lg border px-3 py-2 font-bold ${bold ? 'border-rose bg-rose text-white' : 'border-[#ecd9c5] bg-white'}`} aria-label="Bật hoặc tắt in đậm">B</button><span className="text-xs">Màu chữ:</span>{colors.map(([color,label])=><button key={color} type="button" disabled={disabled} title={label} aria-label={`Màu ${label} cho phần đã chọn`} onMouseDown={e=>e.preventDefault()} onClick={()=>format('foreColor',color)} className="h-7 w-7 rounded-full border-2 border-white shadow-sm" style={{background:color}} />)}</div><p className="mt-2 text-xs text-stone-500">Bôi đen chữ để chọn màu hoặc in đậm.</p>{notice && <p role="status" className="mt-2 text-xs text-rose">{notice}</p>}<div ref={editor} contentEditable={!disabled} suppressContentEditableWarning role="textbox" aria-multiline="true" aria-labelledby="forum-content-label" data-placeholder="Chia sẻ câu chuyện về người Thầy/Cô của bạn…" onInput={sync} onMouseUp={remember} onKeyUp={remember} onPaste={e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));sync();}} className="forum-rich-editor mt-3 min-h-[320px] rounded-xl border border-[#ecd9c5] bg-white p-4 font-normal outline-none focus:border-rose" style={{textAlign:alignment,color:'#000',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}} /><input type="hidden" name="content" value={value} /><input type="hidden" name="contentRuns" value={JSON.stringify(runs)} /><input type="hidden" name="alignment" value={alignment} /><input type="hidden" name="textColor" value="#000000" /><p className="mt-1 text-right text-xs text-stone-500">{value.trim() ? value.trim().split(/\s+/u).length : 0} từ</p></div>;
}
