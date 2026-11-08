import { useEffect, useRef, useState } from 'react';
import { LEVELS } from './store.js';
import Icon from './Icon.jsx';

// none → severe, bottom to top, like the brightness slider in Control Centre
export const SCALE = [...LEVELS].reverse();
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export function colorAt(v) {
  const x = Math.max(0, Math.min(1, v)) * (SCALE.length - 1);
  const i = Math.min(SCALE.length - 2, Math.floor(x));
  const f = x - i;
  const a = hex(SCALE[i].color), b = hex(SCALE[i + 1].color);
  return `rgb(${a.map((c, k) => Math.round(c + (b[k] - c) * f)).join(',')})`;
}
export const levelAt = (v) => SCALE[Math.round(Math.max(0, Math.min(1, v)) * (SCALE.length - 1))];
export const valueOf = (id) => SCALE.findIndex((l) => l.id === id) / (SCALE.length - 1);

const H = 300;
const MESSAGE = {
  none: 'Good to hear. Notice what’s helping today.',
  mild: 'A little uneasy is normal. Name it, then let it pass.',
  moderate: 'Try writing down what’s on your mind.',
  high: 'Let’s slow things down. A minute of breathing can help.',
  severe: 'That sounds really hard. Breathe with me, and reach out to someone you trust.',
};

export default function QuickAnxiety({ start, onSave, onClose, onMore, onBreathe }) {
  const [v, setV] = useState(start ?? 0.25);
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);
  const from = useRef(null);
  const level = levelAt(v);

  useEffect(() => { ref.current?.focus(); }, []);

  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); from.current = { y: e.clientY, v }; setDrag(true); };
  const move = (e) => {
    if (!from.current) return;
    const scale = ref.current.getBoundingClientRect().height / H; // stage is scaled to fit the window
    setV(Math.max(0, Math.min(1, from.current.v + (from.current.y - e.clientY) / scale / H)));
  };
  const up = () => { if (!from.current) return; from.current = null; setDrag(false); setV((x) => Math.round(x * 4) / 4); };
  const key = (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); setV((x) => Math.min(1, Math.round(x * 4 + 1) / 4)); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setV((x) => Math.max(0, Math.round(x * 4 - 1) / 4)); }
    if (e.key === 'Enter') onSave(level.id);
    if (e.key === 'Escape') onClose();
  };

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 25, background: 'rgba(40,24,70,.55)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 84, animation: 'fadein .18s' }}>
      <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 44, right: 16, color: 'var(--muted)' }}>
        <Icon name="iconamoon:close-bold" size={22} />
      </button>
      <span className="t-small" style={{ color: 'var(--ink2)' }}>Anxiety right now</span>
      <span className="ha" aria-live="polite" style={{ fontSize: 24, fontWeight: 700, lineHeight: '32px', color: colorAt(v), marginTop: 2, transition: 'color .1s' }}>{level.name}</span>
      <div className="row" style={{ gap: 6, marginTop: 8, minHeight: 28, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
        {level.words.map((w) => <span key={w} className="chip sm" style={{ background: 'rgba(255,255,255,.1)', color: 'var(--ink2)' }}>{w}</span>)}
      </div>

      <div ref={ref} onClick={(e) => e.stopPropagation()} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
        role="slider" tabIndex={0} aria-label="Anxiety level" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Math.round(v * 4)} aria-valuetext={level.name}
        style={{ position: 'relative', marginTop: 28, width: 116, height: H, borderRadius: 40, overflow: 'hidden', background: 'rgba(255,255,255,.32)', boxShadow: '0 0 0 2px rgba(255,255,255,.45), 0 16px 40px rgba(0,0,0,.35)', touchAction: 'none', cursor: drag ? 'grabbing' : 'grab', transform: drag ? 'scale(1.03)' : 'none', transition: 'transform .15s' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${8 + v * 92}%`, background: colorAt(v), transition: drag ? 'none' : 'height .2s ease, background .2s' }} />
        {[1, 2, 3].map((k) => <div key={k} aria-hidden="true" style={{ position: 'absolute', left: 44, right: 44, bottom: `${8 + (k / 4) * 92}%`, height: 2, borderRadius: 1, background: 'rgba(255,255,255,.55)' }} />)}
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 18, display: 'flex', justifyContent: 'center', color: v > 0.05 ? 'rgba(20,10,30,.75)' : '#ffffff' }}>
          <Icon name="cuida:heart-rate-outline" size={28} />
        </div>
      </div>
      <span className="t-cap" style={{ marginTop: 10 }}>Drag up or down</span>
      <p className="t-body" aria-live="polite" style={{ margin: '18px 32px 0', textAlign: 'center', color: 'var(--ink)', minHeight: 42 }}>{MESSAGE[level.id]}</p>

      <div onClick={(e) => e.stopPropagation()} className="stack" style={{ position: 'absolute', left: 'var(--pad)', right: 'var(--pad)', bottom: 40, gap: 12 }}>
        <button className="btn" onClick={() => onSave(level.id)} style={{ background: colorAt(v), color: '#1a1025', transition: 'background .1s' }}>Save · {level.name}</button>
        <div className="stack" style={{ alignItems: 'center', gap: 2 }}>
          {(level.id === 'high' || level.id === 'severe') && <button className="link" onClick={() => onBreathe(level.id)} style={{ color: 'var(--green)' }}>Save and breathe for a minute</button>}
          <button className="link" onClick={() => onMore(level.id)} style={{ color: 'var(--ink2)' }}>{level.id === 'none' ? 'Add what’s helping' : 'Add what’s behind it'}</button>
        </div>
      </div>
    </div>
  );
}
