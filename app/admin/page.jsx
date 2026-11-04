'use client';
import { useEffect, useRef, useState } from 'react';
const primary = 'rounded-lg bg-rose px-5 py-3 text-sm font-semibold text-white disabled:opacity-50';
const input = 'mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-sm text-ink';
const secondary = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50';
const labels = { published: 'Đã đăng', pending: 'Chờ duyệt', hidden: 'Đã ẩn' };
export default function Admin() {
  const [user, setUser] = useState(null); const [checking, setChecking] = useState(true);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]); const [counts, setCounts] = useState({});
  const [q, setQ] = useState(''); const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1); const [pages, setPages] = useState(0);
  const [revision, setRevision] = useState(0); const [edit, setEdit] = useState(null);
  const [editorError, setEditorError] = useState('');
  const editor = useRef(null); const passwordDialog = useRef(null);
  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...options.headers } });
    const data = await response.json();
    if (response.status === 401) { setUser(null); setItems([]); setEdit(null); editor.current?.close(); passwordDialog.current?.close(); }
    if (!response.ok) throw new Error(data.error || 'Yêu cầu chưa thành công.');
    return data;
  }
  useEffect(() => { let active = true; fetch('/api/admin/session', { cache: 'no-store' }).then(async response => {
    const data = await response.json();
    if (active && response.ok) setUser(data.username);
    else if (active && response.status !== 401) setError(data.error || 'Chưa kiểm tra được phiên đăng nhập.');
  }).catch(() => { if (active) setError('Chưa kết nối được máy chủ.'); }).finally(() => { if (active) setChecking(false); }); return () => { active = false; }; }, []);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController(); setLoading(true); setError('');
    const timer = setTimeout(async () => {
      try {
        const data = await api(`/api/admin/tributes?q=${encodeURIComponent(q)}&status=${status}&page=${page}`, { signal: controller.signal });
        if (!controller.signal.aborted) { setItems(data.items); setCounts(data.counts); setPages(data.pages); }
      } catch (e) { if (!controller.signal.aborted) setError(e.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [user, q, status, page, revision]);
  async function login(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { const data = await api('/api/admin/session', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) }); setUser(data.username); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    try { await api('/api/admin/session', { method: 'DELETE' }); setUser(null); setItems([]); setNotice(''); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function openEditor(item = null) { setEdit(item); setEditorError(''); editor.current.showModal(); }
  async function save(e) {
    e.preventDefault(); setBusy(true); setEditorError('');
    try {
      await api(edit ? `/api/admin/tributes/${edit.id}` : '/api/admin/tributes', { method: edit ? 'PATCH' : 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
      editor.current.close(); setRevision(x => x + 1); setNotice(edit ? 'Đã cập nhật bài viết.' : 'Đã tạo bài viết.');
    } catch (e) { setEditorError(e.message); } finally { setBusy(false); }
  }
  async function changeStatus(item, next) {
    setBusy(true); setError('');
    try { await api(`/api/admin/tributes/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) }); setRevision(x => x + 1); setNotice(`Đã chuyển bài sang “${labels[next]}”.`); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function changePassword(e) {
    e.preventDefault(); setBusy(true); setEditorError('');
    try { await api('/api/admin/password', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) }); passwordDialog.current.close(); setUser(null); setItems([]); setNotice('Đã đổi mật khẩu. Vui lòng đăng nhập lại.'); }
    catch (e) { setEditorError(e.message); } finally { setBusy(false); }
  }
  if (checking) return <main className="p-12 text-center">Đang kiểm tra phiên đăng nhập…</main>;
  return <main className="mx-auto min-h-screen max-w-6xl px-5 py-8">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-amber-200 pb-6"><div><a href="/" className="font-script text-3xl text-rose">Từ trái tim</a><p className="mt-2 text-xs tracking-widest text-stone-500">QUẢN TRỊ BÀI VIẾT</p></div><div className="flex flex-wrap items-center gap-3 text-xs"><a href="/" className={secondary}>Xem website ↗</a>{user && <><span>{user}</span><button className={secondary} disabled={busy} onClick={() => { setEditorError(''); passwordDialog.current.showModal(); }}>Đổi mật khẩu</button><button className={secondary} disabled={busy} onClick={logout}>Đăng xuất</button></>}</div></header>
    {notice && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">{notice}</p>}
    {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">{error} {user && <button className="ml-3 underline" onClick={() => setRevision(x => x + 1)}>Thử lại</button>}</p>}
    {!user ? <form onSubmit={login} className="mx-auto mt-16 max-w-md rounded-2xl border border-amber-200 bg-white p-8 shadow-sm"><h1 className="font-display text-3xl">Đăng nhập Admin</h1><p className="my-4 text-sm text-stone-500">Quản lý những lời tri ân gửi đến thầy cô.</p><label className="mt-5 block text-sm">Tên đăng nhập<input className={input} name="username" autoComplete="username" required maxLength={50} /></label><label className="mt-5 block text-sm">Mật khẩu<input className={input} name="password" type="password" autoComplete="current-password" required maxLength={128} /></label><button className={`${primary} mt-6 w-full`} disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button></form> : <>
      <div className="mb-7 grid grid-cols-3 gap-3">{Object.entries(labels).map(([key, label]) => <button onClick={() => { setStatus(key); setPage(1); }} key={key} className="rounded-xl border border-amber-200 bg-white p-5 text-left"><span className="block text-xs text-stone-500">{label}</span><b className="mt-2 block text-3xl text-rose">{counts[key] || 0}</b></button>)}</div>
      <div className="mb-5 flex flex-wrap items-center gap-3"><input className={`${input} mt-0 flex-1 min-w-48`} aria-label="Tìm bài viết" placeholder="Tìm người gửi, thầy cô, nội dung…" value={q} maxLength={100} onChange={e => { setQ(e.target.value); setPage(1); }} /><select aria-label="Lọc trạng thái" className={`${input} mt-0 w-auto`} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="all">Tất cả bài viết</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button className={primary} onClick={() => openEditor()}>+ Đăng bài mới</button></div>
      {loading ? <p className="py-12 text-center" role="status">Đang tải bài viết…</p> : <div className="space-y-4">{items.map(item => <article key={item.id} className="rounded-xl border border-amber-200 bg-white p-5 md:p-6"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Gửi đến Thầy/Cô: {item.teacher}</h2>{item.teacherDepartment && <p className="mt-1 text-xs text-stone-500">Đơn vị: {item.teacherDepartment}</p>}<p className="mt-1 text-xs text-stone-500">{item.sender}{item.senderDepartment && <> ({item.senderDepartment})</>} · {new Date(item.createdAt).toLocaleString('vi-VN')}</p></div><span className={`rounded-full px-3 py-1 text-xs ${item.status === 'published' ? 'bg-green-100 text-green-800' : item.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>{labels[item.status]}</span></div><p className="whitespace-pre-wrap break-words text-sm leading-7">{item.message}</p>{(item.senderEmail || item.recipientEmail) && <p className="mt-4 text-xs leading-6 text-stone-500">{item.senderEmail && <>Email người gửi: {item.senderEmail}<br /></>}{item.recipientEmail && <>Email người nhận: {item.recipientEmail}</>}</p>}<div className="mt-5 flex flex-wrap gap-2"><button className={secondary} disabled={busy} onClick={() => openEditor(item)}>Sửa bài</button>{item.status !== 'published' && <button className={secondary} disabled={busy} onClick={() => changeStatus(item, 'published')}>Duyệt / Hiển thị</button>}{item.status !== 'hidden' && <button className={secondary} disabled={busy} onClick={() => changeStatus(item, 'hidden')}>Ẩn bài</button>}</div></article>)}{!items.length && !error && <p className="py-12 text-center text-stone-500">Chưa có bài viết ở mục này.</p>}</div>}
      {pages > 1 && <nav className="my-8 flex items-center justify-center gap-5 text-sm"><button className={secondary} disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>← Trước</button><span>{page} / {pages}</span><button className={secondary} disabled={page >= pages || loading} onClick={() => setPage(p => p + 1)}>Sau →</button></nav>}
    </>}
    <dialog ref={editor} onCancel={e => { if (busy) e.preventDefault(); }} className="fixed inset-0 m-auto max-h-[90vh] w-[94vw] max-w-xl overflow-y-auto rounded-xl border border-amber-200 bg-cream p-7 text-ink"><form key={edit?.id || 'new'} onSubmit={save}><h2 className="font-display text-2xl">{edit ? 'Sửa bài viết' : 'Đăng bài mới'}</h2><fieldset disabled={busy}><label className="mt-4 block text-sm">Người gửi<input name="sender" className={input} defaultValue={edit?.sender || ''} required maxLength={70} /></label><label className="mt-4 block text-sm">Đơn vị người gửi<input name="senderDepartment" className={input} defaultValue={edit?.senderDepartment || ''} maxLength={120} /></label><label className="mt-4 block text-sm">Gửi đến Thầy/Cô:<input name="teacher" className={input} defaultValue={edit?.teacher || ''} required maxLength={100} /></label><label className="mt-4 block text-sm">Đơn vị:<input name="teacherDepartment" className={input} defaultValue={edit?.teacherDepartment || ''} maxLength={120} /></label><label className="mt-4 block text-sm">Nội dung<textarea name="message" className={input} defaultValue={edit?.message || ''} required minLength={10} maxLength={2000} rows={6} /></label><label className="mt-4 block text-sm">Trạng thái<select name="status" className={input} defaultValue={edit?.status || 'published'}>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></fieldset>{editorError && <p role="alert" className="my-4 text-sm text-red-700">{editorError}</p>}<div className="mt-6 flex gap-3"><button className={primary} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu bài viết'}</button><button type="button" className={secondary} disabled={busy} onClick={() => editor.current.close()}>Hủy</button></div></form></dialog>
    <dialog ref={passwordDialog} onCancel={e => { if (busy) e.preventDefault(); }} className="fixed inset-0 m-auto w-[94vw] max-w-md rounded-xl border border-amber-200 bg-cream p-7 text-ink"><form onSubmit={changePassword}><h2 className="font-display text-2xl">Đổi mật khẩu</h2><label className="mt-5 block text-sm">Mật khẩu hiện tại<input name="currentPassword" type="password" autoComplete="current-password" className={input} required maxLength={128} /></label><label className="mt-5 block text-sm">Mật khẩu mới (ít nhất 12 ký tự)<input name="newPassword" type="password" autoComplete="new-password" className={input} required minLength={12} maxLength={128} /></label>{editorError && <p role="alert" className="my-4 text-sm text-red-700">{editorError}</p>}<div className="mt-5 flex gap-3"><button className={primary} disabled={busy}>Đổi mật khẩu</button><button type="button" className={secondary} disabled={busy} onClick={() => passwordDialog.current.close()}>Hủy</button></div></form></dialog>
  </main>;
}
