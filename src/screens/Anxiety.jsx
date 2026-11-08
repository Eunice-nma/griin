import { useRef, useState } from 'react';
import { LEVELS, actions, useStore } from '../store.js';
import Icon, { PointArrow } from '../Icon.jsx';
import { TopBar, Sheet } from '../ui.jsx';

const ROW0 = 200, STEP = 86;                          // centre of the first level row, distance between rows
const CENTER = LEVELS.map((_, k) => ROW0 + k * STEP); // severe → none
const TRACK_TOP = ROW0 - 34, TRACK_BOTTOM = CENTER[4] + 40;

export default function Anxiety({ nav, level: preset }) {
  const s = useStore();
  const [li, setLi] = useState(preset ? Math.max(0, LEVELS.findIndex((l) => l.id === preset)) : 3);
  const [picked, setPicked] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newF, setNewF] = useState('');
  const trackRef = useRef(null);
  const level = LEVELS[li];

  const fromY = (clientY) => {
    const r = trackRef.current.getBoundingClientRect();
    const y = TRACK_TOP + (clientY - r.top) / (r.height / (TRACK_BOTTOM - TRACK_TOP));
    let best = 0;
    CENTER.forEach((c, k) => { if (Math.abs(c - y) < Math.abs(CENTER[best] - y)) best = k; });
    setLi(best);
  };
  const toggle = (f) => setPicked((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));
  const save = () => { actions.logAnxiety(level.id, picked); nav.back(); };

  return (
    <div className="screen tall">
      <div className="page nonav" style={{ gap: 0 }}>
        <TopBar onBack={() => nav.back()} right={
          <button className="icon-btn" onClick={save} aria-label="Save anxiety level"><Icon name="icon-park:check-small" size={32} /></button>
        } />
        <h1 className="t-title" style={{ textAlign: 'center', marginTop: 8 }}>How’s your anxiety<br />level now?</h1>
      </div>

      {LEVELS.map((l, k) => (
        <button key={l.id} onClick={() => setLi(k)} aria-pressed={k === li} aria-label={`${l.name}: ${l.words.join(', ')}`}
          style={{ position: 'absolute', top: CENTER[k] - 30, left: 16, width: 156, height: 60 }}>
          <span className="ha" style={{ position: 'absolute', left: 0, width: 100, top: 6, textAlign: 'center', fontSize: 16, lineHeight: '22px', fontWeight: k === li ? 700 : 400, color: k === li ? '#fff' : 'var(--ink2)' }}>{l.name}</span>
          <span style={{ position: 'absolute', left: 42, top: 34, width: 16, height: 16, borderRadius: 8, background: l.color, boxShadow: k === li ? '0 0 0 4px rgba(255,255,255,.2)' : 'none' }} />
          <span style={{ position: 'absolute', left: 114, top: 18, opacity: k === li ? 1 : 0.6 }}><PointArrow size={28} /></span>
        </button>
      ))}

      <div ref={trackRef}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); fromY(e.clientY); }}
        onPointerMove={(e) => { if (e.buttons) fromY(e.clientY); }}
        role="slider" tabIndex={0} aria-label="Anxiety level" aria-valuemin={0} aria-valuemax={4} aria-valuenow={4 - li} aria-valuetext={level.name}
        onKeyDown={(e) => { if (e.key === 'ArrowUp') setLi((x) => Math.max(0, x - 1)); if (e.key === 'ArrowDown') setLi((x) => Math.min(4, x + 1)); }}
        style={{ position: 'absolute', left: 174, top: TRACK_TOP, width: 46, height: TRACK_BOTTOM - TRACK_TOP, cursor: 'grab', touchAction: 'none' }}>
        <div style={{ position: 'absolute', left: 16.5, top: 0, width: 13, height: '100%', borderRadius: 20, background: '#584b6d' }} />
        <div style={{ position: 'absolute', left: 16.5, bottom: 0, width: 13, height: TRACK_BOTTOM - CENTER[li], borderRadius: 20, background: level.color, transition: 'height .2s, background .2s' }} />
        <div style={{ position: 'absolute', left: 5, top: CENTER[li] - TRACK_TOP - 18, width: 36, height: 36, borderRadius: 18, background: level.color, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'top .2s, background .2s', boxShadow: '0 0 0 3px rgba(255,255,255,.15)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M5 5.5 8 2.5l3 3M5 10.5l3 3 3-3" /></svg>
        </div>
      </div>

      {LEVELS.map((l, k) => (
        <div key={l.id} aria-hidden="true" style={{ position: 'absolute', left: 230, right: 14, top: CENTER[k] - 26, display: 'flex', flexWrap: 'wrap', gap: 5, opacity: k === li ? 1 : 0.5, transition: 'opacity .2s' }}>
          {l.words.map((w) => <span key={w} className="chip sm" style={{ background: l.chip }}>{w}</span>)}
        </div>
      ))}

      <div style={{ position: 'absolute', left: 'var(--pad)', right: 'var(--pad)', top: TRACK_BOTTOM + 26, bottom: 24 }} className="stack">
        <h2 className="t-section" style={{ marginBottom: 10 }}>What’s behind it?</h2>
        <div className="scroll" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start' }}>
          {s.factors.map((f) => {
            const on = picked.includes(f);
            return (
              <button key={f} onClick={() => toggle(f)} aria-pressed={on} className="chip"
                style={{ border: '1px solid rgba(255,149,81,0.8)', background: on ? 'rgba(255,149,81,0.85)' : 'transparent', color: on ? '#2a1205' : '#fff' }}>{f}</button>
            );
          })}
          <button onClick={() => setAdding(true)} className="chip" style={{ border: '1px dashed var(--purple)', color: 'var(--purple)', gap: 4 }}>
            <Icon name="ph:plus-bold" size={11} /> Your own
          </button>
        </div>
      </div>

      {adding && (
        <Sheet title="Add a factor" onClose={() => { setAdding(false); setNewF(''); }}>
          <input id="new-factor" className="field" autoFocus value={newF} onChange={(e) => setNewF(e.target.value)} placeholder="e.g. Deadlines" />
          <button className="btn btn-green" disabled={!newF.trim()} onClick={() => { const f = newF.trim(); actions.addFactor(f); setPicked((p) => [...p, f]); setAdding(false); setNewF(''); }}>Add factor</button>
        </Sheet>
      )}
    </div>
  );
}
