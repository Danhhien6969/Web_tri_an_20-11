const palette = {
 '#000000':'rgb(0, 0, 0)', '#dc2626':'rgb(220, 38, 38)', '#1565c0':'rgb(21, 101, 192)', '#ca8a04':'rgb(202, 138, 4)'
};
export function normalizeForumColor(value) {
 const color=String(value||'').trim().toLowerCase();
 if(palette[color])return palette[color];
 const rgb=color.match(/^rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)(?:\s*[,/]\s*(?:1|1\.0+))?\s*\)$/);
 if(rgb){const canonical=`rgb(${Number(rgb[1])}, ${Number(rgb[2])}, ${Number(rgb[3])})`;if(Object.values(palette).includes(canonical))return canonical;}
 return palette['#000000'];
}
export function normalizeForumRuns(runs, content) {
 if(!Array.isArray(runs)||runs.length>20000||runs.some(r=>!r||typeof r.text!=='string'||typeof r.bold!=='boolean'))return null;
 const normalized=runs.map(({text,color,bold})=>({text,color:normalizeForumColor(color),bold}));
 if(normalized.map(r=>r.text).join('').trim().normalize('NFC')!==content)return null;
 return normalized;
}
