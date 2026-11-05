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
  const message = String(item.message || '').replace(/\r\n?/g, '\n').split(/\n\s*\n/).flatMap((paragraph, paragraphIndex) => {
    // A single pasted line break is a soft wrap; blank lines separate paragraphs.
    const lines = wrap(paragraph.replace(/\s*\n\s*/g, ' '), `32px ${serif}`, 1000);
    return [...(paragraphIndex ? [{ text: '', justify: false }] : []), ...lines.map((text, index) => ({ text, justify: index < lines.length - 1 }))];
  });
  const teacher = wrap(item.teacher, `bold 40px ${serif}`, 1000);
  const sender = wrap(`Người viết: ${item.sender}`, `bold 28px ${serif}`, 960);
  const unit = item.senderDepartment ? wrap(`Đơn vị: ${item.senderDepartment}`, `26px ${serif}`, 960) : [];
  const photo = item.image ? assets[3] : null;
  const photoHeight = photo ? Math.min(580, 960 * photo.height / photo.width) : 0;
  canvas.height = Math.max(1200, 750 + photoHeight + (photo ? 40 : 0) + teacher.length * 66 + message.length * 49 + (sender.length + unit.length) * 40);
  const h = canvas.height;
  const tint = ctx.createLinearGradient(0, 0, 1200, h);
  tint.addColorStop(0, '#fff8ef'); tint.addColorStop(1, '#fff0df');
  ctx.fillStyle = tint; ctx.fillRect(0, 0, 1200, h);
  // Keep the artwork's proportions: top and bottom borders frame a calm centre.
  const bandHeight = 1200 * background.height / background.width / 2;
  ctx.drawImage(background, 0, 0, background.width, background.height / 2, 0, 0, 1200, bandHeight);
  ctx.drawImage(background, 0, background.height / 2, background.width, background.height / 2, 0, h-bandHeight, 1200, bandHeight);
  ctx.shadowColor = '#75442218'; ctx.shadowBlur = 24;
  ctx.fillStyle = '#fffaf5'; ctx.beginPath(); ctx.roundRect(65, 190, 1070, h - 310, 24); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#e5c99b'; ctx.lineWidth = 1; ctx.stroke();
  let x = 405;
  for (const logo of assets.slice(0, 3)) { const scale = Math.min(105 / logo.width, 115 / logo.height); const w = logo.width * scale; const lh = logo.height * scale; ctx.drawImage(logo, x + (110-w)/2, 65 + (115-lh)/2, w, lh); x += 140; }
  ctx.textAlign = 'center'; ctx.fillStyle = '#b77714'; ctx.font = `bold 30px ${serif}`;
  ctx.fillText('—  LỜI TRI ÂN · 20/11  —', 600, 250);
  ctx.fillStyle = '#b00016'; ctx.font = `64px ${script}`;
  ctx.fillText('Từ trái tim người học trò', 600, 325, 1020);
  let y = 370;
  if (photo) {
    const scale = Math.min(960 / photo.width, photoHeight / photo.height); const w = photo.width * scale; const ph = photo.height * scale;
    ctx.fillStyle = '#d99724'; ctx.fillRect((1200-w)/2-5, y-5, w+10, ph+10);
    ctx.drawImage(photo, (1200-w)/2, y, w, ph); y += ph + 50;
  }
  ctx.fillStyle = '#91500b'; ctx.font = `italic 28px ${serif}`; ctx.fillText('Kính gửi Thầy/Cô', 600, y + 30); y += 90;
  ctx.fillStyle = '#af0019'; ctx.font = `bold 40px ${serif}`;
  for (const line of teacher) { ctx.fillText(line, 600, y); y += 66; }
  y += 22; ctx.textAlign = 'left'; ctx.fillStyle = '#512a20'; ctx.font = `32px ${serif}`;
  for (const line of message) {
    const words = line.text.trim().split(/\s+/).filter(Boolean);
    if (line.justify && words.length > 1) {
      const widths = words.map(word => ctx.measureText(word).width);
      const gap = (1000 - widths.reduce((sum, width) => sum + width, 0)) / (words.length - 1);
      let x = 100;
      words.forEach((word, index) => { ctx.fillText(word, x, y); x += widths[index] + gap; });
    } else ctx.fillText(line.text, 100, y);
    y += 49;
  }
  y += 40; ctx.strokeStyle = '#d9b77e'; ctx.beginPath(); ctx.moveTo(100,y); ctx.lineTo(1100,y); ctx.stroke(); y += 48;
  ctx.textAlign = 'right'; ctx.fillStyle = '#b00026'; ctx.font = `bold 28px ${serif}`;
  for (const line of sender) { ctx.fillText(line, 1100, y); y += 40; }
  ctx.fillStyle = '#95683e'; ctx.font = `26px ${serif}`;
  for (const line of unit) { ctx.fillText(line, 1100, y); y += 40; }
  return canvas;
}
