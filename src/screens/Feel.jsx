import { useRef, useState, useEffect } from 'react';
import { MOODS, actions } from '../store.js';
import Icon from '../Icon.jsx';
import { Back } from '../ui.jsx';

const MOUTH = {
  great: 'M158 392 Q 196 458 234 392',
  calm: 'M172 430 Q 228 428 257 388',
  meh: 'M164 427 H 230',
  down: 'M160 446 Q 196 396 232 446',
  terrible: 'M160 452 Q 196 404 232 452',
};

export default function Feel({ nav, start }) {
  const [i, setI] = useState(Math.max(0, MOODS.findIndex((m) => m.id === (start || 'calm'))));
  const m = MOODS[i];
  const chipsRef = useRef(null);
  const sx = useRef(null);
  const dark = m.id === 'calm';

  useEffect(() => {
    const el = chipsRef.current?.children[i];
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [i]);

  const save = () => { actions.logMood(m.id); nav.back(); };
  const addNote = () => { actions.logMood(m.id); nav.back(); nav.openJournal(); };

  const eyeStyle = (left, rot) => ({ position: 'absolute', top: m.id === 'terrible' ? 236 : 216, left, width: 44, height: m.id === 'terrible' ? 64 : 80, borderRadius: 40, background: m.face, transform: rot ? `rotate(${rot}deg)` : undefined, transition: 'all .25s' });

  return (
    <div className="screen" style={{ background: m.bg, transition: 'background .25s' }}
      onPointerDown={(e) => { sx.current = e.clientX; }}
      onPointerUp={(e) => { if (sx.current == null) return; const dx = e.clientX - sx.current; sx.current = null; if (Math.abs(dx) > 50 && e.clientY < 660) setI((x) => Math.min(4, Math.max(0, x + (dx < 0 ? 1 : -1)))); }}>
      <Back onClick={() => nav.back()} top={62} left={32} />
      <button onClick={save} aria-label="Save mood" style={{ position: 'absolute', top: 49, left: 324, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <Icon name="icon-park:check-small" size={30} />
      </button>

      <h1 className="ha" style={{ position: 'absolute', top: 104, width: '100%', textAlign: 'center', margin: 0, fontSize: 52, fontWeight: 700, lineHeight: '60px', color: '#fff' }}>I Feel</h1>

      <div aria-hidden="true">
        <div style={eyeStyle(90, m.id === 'terrible' ? 50 : 0)} />
        <div style={eyeStyle(259, m.id === 'terrible' ? -50 : 0)} />
        <svg width="393" height="852" viewBox="0 0 393 852" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <path d={MOUTH[m.id]} fill="none" stroke={m.face} strokeWidth="44" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ position: 'absolute', top: 514, width: '100%', textAlign: 'center' }} aria-live="polite">
        <div className="ha" style={{ fontSize: 36, fontWeight: 700, lineHeight: '48px', color: dark ? '#fff' : m.text }}>{m.name}</div>
        <div className="hm" style={{ fontSize: 16, lineHeight: '20px', color: dark ? '#fff' : m.text, opacity: dark ? 1 : 0.85, whiteSpace: 'pre-line', marginTop: 6 }}>{m.desc}</div>
      </div>

      <div ref={chipsRef} className="hscroll" style={{ position: 'absolute', top: 685, left: 0, right: 0, display: 'flex', gap: 16, padding: '0 32px' }}>
        {MOODS.map((c, ci) => {
          const on = ci === i;
          return (
            <button key={c.id} onClick={() => setI(ci)} aria-pressed={on} className="hm"
              style={{ flex: '0 0 84px', height: 40, borderRadius: 20, fontSize: 14, color: '#fff',
                border: `1px solid ${dark ? '#a084e8' : m.face}`,
                background: dark ? (on ? 'rgba(113,89,175,0.33)' : '#26103e') : (on ? m.face : m.chip) }}>
              {c.name}
            </button>
          );
        })}
      </div>

      <button onClick={addNote} className="btn" style={{ position: 'absolute', top: 752, left: 'var(--pad)', right: 'var(--pad)', background: '#fffffb', color: '#391d69' }}>
        Save and add a note
      </button>
    </div>
  );
}
