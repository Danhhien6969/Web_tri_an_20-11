// Deterministic placement keeps the server and browser markup identical.
export default function TributeConfetti({ leavesOnly = false }) {
  return <div className={leavesOnly ? "tribute-confetti reader-leaves" : "tribute-confetti"} aria-hidden="true">
    {leavesOnly && Array.from({ length: 14 }, (_, i) => <span key={`leaf-${i}`} className="falling-flamboyant" style={{
      '--x': `${(i * 43 + 7) % 100}%`, '--size': `${32 + (i * 7) % 23}px`,
      '--duration': `${18 + (i * 3) % 13}s`, '--delay': `${-((i * 11 + 3) % 31)}s`,
      '--drift': `${(i % 2 ? -1 : 1) * (45 + i * 5)}px`, '--turn': `${i % 2 ? -50 : 50}deg`,
      '--tint': ['#719650', '#a2a952', '#c2a35b'][i % 3]
    }}><svg viewBox="0 0 60 96" fill="currentColor"><path d="M30 4Q24 47 32 92" fill="none" stroke="currentColor" strokeWidth="1.5" />{Array.from({ length: 8 }, (_, n) => <g key={n} transform={`translate(${28 + (n > 4 ? 1 : 0)} ${12 + n * 9})`}><ellipse cx="-10" cy="0" rx="10" ry="3.5" transform="rotate(25)" /><ellipse cx="10" cy="0" rx="10" ry="3.5" transform="rotate(-25)" /></g>)}</svg></span>)}
    {!leavesOnly && Array.from({ length: 16 }, (_, i) => <span key={`heart-${i}`} className="falling-heart" style={{
      '--x': `${(i * 37 + 3) % 100}%`, '--size': `${12 + (i * 7) % 14}px`,
      '--duration': `${14 + (i * 3) % 11}s`, '--delay': `${-((i * 7 + 2) % 25)}s`,
      '--drift': `${(i % 2 ? -1 : 1) * (20 + i * 4)}px`, '--turn': `${i % 2 ? -35 : 35}deg`,
      '--tint': i % 3 === 0 ? '#ff9fb8' : i % 3 === 1 ? '#f34f77' : '#ed3053'
    }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12Z" /></svg></span>)}
    {!leavesOnly && Array.from({ length: 22 }, (_, i) => <span key={`glitter-${i}`} className="falling-glitter" style={{
      '--x': `${(i * 31 + 11) % 100}%`, '--size': `${3 + (i % 4)}px`,
      '--duration': `${11 + (i * 5) % 12}s`, '--delay': `${-((i * 3 + 5) % 23)}s`,
      '--drift': `${(i % 2 ? -1 : 1) * (15 + i * 2)}px`,
      '--tint': i % 3 === 0 ? '#f9a4bd' : '#e9b946'
    }}><span /></span>)}
  </div>;
}
