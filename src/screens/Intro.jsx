import { useState, useRef } from 'react';
import { actions } from '../store.js';
import Icon from '../Icon.jsx';
import Logo from '../Logo.jsx';

// Big friendly face used on the three intro screens
function Face({ lashes, blush, sparkle }) {
  const eye = (cx) => (
    <g>
      {lashes && (
        <g stroke="#2a1a12" strokeWidth="2.2" strokeLinecap="round">
          <path d={`M${cx - 30} ${-58} l-12 -14`} />
          <path d={`M${cx - 8} ${-66} l-2 -18`} />
          <path d={`M${cx + 14} ${-64} l8 -16`} />
        </g>
      )}
      <ellipse cx={cx} cy="0" rx="50" ry="68" fill={lashes ? 'rgba(255,255,255,0)' : 'none'} stroke="#2a1a12" strokeWidth="2" />
      <ellipse cx={cx + 6} cy={lashes ? 4 : -14} rx="36" ry={lashes ? 44 : 40} fill="#1d1416" />
      <ellipse cx={cx + 18} cy={lashes ? -14 : -30} rx="7" ry="11" fill="#cfe6f0" />
    </g>
  );
  return (
    <svg width="393" height="420" viewBox="-196 -210 393 420" aria-hidden="true" style={{ display: 'block' }}>
      {sparkle && (
        <path transform="translate(108 -150)" d="M0 -14 C2 -4 4 -2 14 0 C4 2 2 4 0 14 C-2 4 -4 2 -14 0 C-4 -2 -2 -4 0 -14Z" fill="#d84a54" />
      )}
      {eye(-78)}
      {eye(78)}
      <ellipse cx={lashes ? -86 : -76} cy={lashes ? 100 : 118} rx={lashes ? 28 : 14} ry={lashes ? 13 : 14} fill={blush} transform={lashes ? `rotate(-10 -86 100)` : undefined} />
      <ellipse cx={lashes ? 90 : 76} cy={lashes ? 100 : 112} rx={lashes ? 28 : 14} ry={lashes ? 13 : 14} fill={blush} transform={lashes ? `rotate(10 90 100)` : undefined} />
      <path d={lashes ? 'M-42 150 Q 0 192 42 150' : 'M-40 176 Q 4 196 46 174'} fill="none" stroke="#2a1a12" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const PAGES = [
  { bg: '#80c5cb', title: 'Need a Place to Reflect?', body: 'Capture your daily thoughts, track your mood, and build a record that’s just for you.', face: { blush: '#a9aab0', sparkle: true } },
  { bg: '#f2c35a', title: 'Find Clarity!', body: 'Plan your tasks, set goals, and take a moment to reflect—clear your mind.', face: { lashes: true, blush: '#f39a2e' } },
];

export default function Intro({ nav }) {
  const [i, setI] = useState(0);
  const startX = useRef(null);
  const next = () => setI((x) => Math.min(x + 1, 2));
  const prev = () => setI((x) => Math.max(x - 1, 0));
  const onDown = (e) => { startX.current = e.clientX; };
  const onUp = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (dx < -40) next(); else if (dx > 40) prev(); else if (i < 2) next();
  };
  const done = () => { actions.finishOnboarding(); nav.reset('home'); };

  if (i < 2) {
    const p = PAGES[i];
    return (
      <div className="screen" style={{ background: p.bg, cursor: 'pointer' }} onPointerDown={onDown} onPointerUp={onUp}
        role="button" tabIndex={0} aria-label="Next" onKeyDown={(e) => (e.key === 'Enter' || e.key === 'ArrowRight') && next()}>
        <div style={{ position: 'absolute', top: 96, left: 0 }}><Face {...p.face} /></div>
        <div style={{ position: 'absolute', left: 20, right: 40, top: 586 }}>
          <h1 className="fr" style={{ margin: 0, fontWeight: 700, fontSize: 30, lineHeight: '34px', color: '#fff' }}>{p.title}</h1>
          <p className="hm" style={{ margin: '12px 0 0', fontSize: 14, lineHeight: '19px', color: '#fff', maxWidth: 290 }}>{p.body}</p>
        </div>
        <Dots i={i} />
      </div>
    );
  }

  return (
    <div className="screen" style={{ background: '#9f97f7' }} onPointerDown={onDown} onPointerUp={(e) => { const dx = startX.current == null ? 0 : e.clientX - startX.current; startX.current = null; if (dx > 40) prev(); }}>
      <div style={{ position: 'absolute', top: 70, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Logo size={64} color="#ffffff" eye="#2d1753" />
      </div>
      <div style={{ position: 'absolute', top: 150, left: 0 }}><Face lashes blush="#f39a2e" /></div>
      <div style={{ position: 'absolute', top: 546, left: 38, right: 38, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={done} className="fr" style={{ height: 48, borderRadius: 24, background: '#7b52d6', color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Icon name="flat-color-icons:google" size={18} /> Sign-in with Google
        </button>
        <button onClick={done} className="fr" style={{ height: 48, borderRadius: 24, background: '#fff', color: '#6a3fc7', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Icon name="mdi:apple" size={20} color="#6a3fc7" /> Sign-in with Apple
        </button>
      </div>
      <svg style={{ position: 'absolute', bottom: 0, left: 0 }} width="393" height="160" viewBox="0 0 393 160" aria-hidden="true">
        <ellipse cx="40" cy="150" rx="110" ry="70" fill="#e9e7fd" />
        <ellipse cx="360" cy="150" rx="110" ry="62" fill="#e9e7fd" />
        <ellipse cx="200" cy="170" rx="190" ry="120" fill="#fbfbff" />
      </svg>
    </div>
  );
}

function Dots({ i }) {
  return (
    <div style={{ position: 'absolute', bottom: 48, left: 20, display: 'flex', gap: 8 }} aria-hidden="true">
      {[0, 1, 2].map((d) => (
        <span key={d} style={{ width: d === i ? 22 : 8, height: 8, borderRadius: 4, background: d === i ? '#fff' : 'rgba(255,255,255,.5)', transition: 'width .2s' }} />
      ))}
    </div>
  );
}
