export async function renderTributeImage(item) {
  await document.fonts.ready;
  const load = src => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
  const [background, ...assets] = await Promise.all(['/tribute-reader-background.png', '/logo-doan.png', '/logo-hutech.png', '/logo-hoi.png', ...(item.image ? [item.image] : [])].map(load));
  const canvas = document.createElement('canvas'); canvas.width = 1200;
  const ctx = canvas.getContext('2d');
  const fonts = getComputedStyle(document.documentElement);
  const serif = fonts.getPropertyValue('--font-display').trim() || 'Georgia';
  const script = fonts.getPropertyValue('--font-handwriting').trim() || 'cursive';
  const wrap = (text, font, width) => {
    ctx.font = font; const result = [];
    for (const paragraph of String(text || '').split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (line && ctx.measureText(line + ' ' + word).width > width) { result.push(line); line = ''; }
        for (const char of (line ? ' ' : '') + word) {
          if (ctx.measureText(line + char).width > width) { result.push(line); line = ''; }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  };
  const message = wrap(item.message, `32px ${serif}`, 1000);
  const teacher = wrap(item.teacher, `bold 52px ${serif}`, 1000);
  const sender = wrap(`Người viết: ${item.sender}`, `bold 28px ${serif}`, 960);
  const unit = item.senderDepartment ? wrap(`Đơn vị: ${item.senderDepartment}`, `26px ${serif}`, 960) : [];
  const photo = item.image ? assets[3] : null;
  const photoHeight = photo ? Math.min(580, 960 * photo.height / photo.width) : 0;
  canvas.height = Math.max(1100, 600 + photoHeight + (photo ? 40 : 0) + teacher.length * 66 + message.length * 49 + (sender.length + unit.length) * 40);
  const h = canvas.height;
  ctx.drawImage(background, 0, 0, 1200, h);
  // Quiet writing surface leaves the red and gold frame visible.
  ctx.fillStyle = '#fffaf3dd'; ctx.fillRect(65, 180, 1070, h - 340);
  let x = 405;
  for (const logo of assets.slice(0, 3)) { const scale = Math.min(105 / logo.width, 115 / logo.height); const w = logo.width * scale; const lh = logo.height * scale; ctx.drawImage(logo, x + (110-w)/2, 65 + (115-lh)/2, w, lh); x += 140; }
  ctx.textAlign = 'center'; ctx.fillStyle = '#b00016'; ctx.font = `64px ${script}`;
  ctx.fillText('Từ trái tim người học trò', 600, 270, 1020);
  ctx.fillStyle = '#b77714'; ctx.font = `bold 30px ${serif}`; ctx.fillText('—  LỜI TRI ÂN · 20/11  —', 600, 330);
  let y = 370;
  if (photo) {
    const scale = Math.min(960 / photo.width, photoHeight / photo.height); const w = photo.width * scale; const ph = photo.height * scale;
    ctx.fillStyle = '#d99724'; ctx.fillRect((1200-w)/2-5, y-5, w+10, ph+10);
    ctx.drawImage(photo, (1200-w)/2, y, w, ph); y += ph + 50;
  }
  ctx.fillStyle = '#91500b'; ctx.font = `bold 28px ${serif}`; ctx.fillText('KÍNH GỬI THẦY/CÔ', 600, y + 30); y += 95;
  ctx.fillStyle = '#af0019'; ctx.font = `bold 52px ${serif}`;
  for (const line of teacher) { ctx.fillText(line, 600, y); y += 66; }
  y += 22; ctx.textAlign = 'left'; ctx.fillStyle = '#512a20'; ctx.font = `32px ${serif}`;
  for (const line of message) { ctx.fillText(line, 100, y); y += 49; }
  y += 40; ctx.strokeStyle = '#d9b77e'; ctx.beginPath(); ctx.moveTo(100,y); ctx.lineTo(1100,y); ctx.stroke(); y += 48;
  ctx.textAlign = 'right'; ctx.font = `bold 28px ${serif}`;
  for (const line of sender) { ctx.fillText(line, 1100, y); y += 40; }
  ctx.font = `26px ${serif}`;
  for (const line of unit) { ctx.fillText(line, 1100, y); y += 40; }
  return canvas;
}
