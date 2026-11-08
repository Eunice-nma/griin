import { useEffect, useRef, useState } from 'react';
import { useStore, actions, dayKey } from '../store.js';
import Icon from '../Icon.jsx';
import { NavBar, TopBar, useToast } from '../ui.jsx';

const EASY = ['CALM', 'GLOW', 'HOPE', 'KIND', 'SOFT', 'WARM', 'BOLD', 'SEED', 'RAIN', 'MOON', 'STAR', 'LUSH', 'WAVE', 'NEST', 'TIDE', 'LEAF', 'SONG', 'FIRE', 'PATH', 'GROW', 'REST', 'SNUG', 'JOKE', 'BAKE', 'HUMS', 'MINT', 'PLUM', 'COZY', 'GLAD', 'TRUE'];
const HARD = ['BLOOM', 'PEACE', 'SUNNY', 'HAPPY', 'DREAM', 'SMILE', 'GRACE', 'BRAVE', 'SHINE', 'HEART', 'TRUST', 'OCEAN', 'LIGHT', 'QUIET', 'CHEER', 'FRESH', 'SWEET', 'MAGIC', 'PLANT', 'WORLD', 'SPARK', 'RELAX', 'NOBLE', 'CLEAR', 'HONEY', 'LUCKY', 'MERRY', 'STORM', 'CLOUD', 'GREEN'];
const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const TRIES = 6;

const dayIndex = () => Math.floor(new Date(dayKey() + 'T00:00').getTime() / 86400000);

function score(guess, answer) {
  const res = Array(guess.length).fill('miss');
  const left = {};
  [...answer].forEach((ch, i) => { if (guess[i] === ch) res[i] = 'hit'; else left[ch] = (left[ch] || 0) + 1; });
  [...guess].forEach((ch, i) => { if (res[i] !== 'hit' && left[ch]) { res[i] = 'near'; left[ch]--; } });
  return res;
}
const COLORS = { hit: ['#5ab569', '#0f2e14'], near: ['#a084e8', '#1a1025'], miss: ['#3b2a5c', '#cbbcf2'] };

export default function Play({ nav, view: startView }) {
  const [view, setView] = useState(startView || 'menu');
  if (view === 'word') return <WordGame nav={nav} onBack={() => setView('menu')} />;
  if (view === 'breathe') return <Breathe onBack={() => setView('menu')} />;

  return (
    <div className="screen tall">
      <div className="page scroll" style={{ gap: 20 }}>
        <div className="stack" style={{ gap: 2 }}>
          <div className="row" style={{ gap: 6 }}><h1 className="t-display">Play</h1><Icon name="boxicons:sparkle-filled" size={16} color="var(--ink)" /></div>
          <span className="t-body" style={{ color: 'var(--ink2)' }}>A little brain break, new every day</span>
        </div>
        <button onClick={() => setView('word')} className="card stack" style={{ gap: 12, textAlign: 'left', background: 'var(--deep)', borderColor: 'var(--purple)', padding: 20 }}>
          <span className="between"><span className="t-title" style={{ fontSize: 18 }}>Word of the day</span><span className="chip sm" style={{ background: 'rgba(90,181,105,.25)', color: '#bff0c8' }}>Easy · Hard</span></span>
          <span className="row" style={{ gap: 6 }} aria-hidden="true">
            {['G', 'R', 'I', 'I', 'N'].map((ch, i) => (
              <span key={i} className="ha" style={{ width: 40, height: 40, borderRadius: 10, background: i < 2 ? '#5ab569' : i === 2 ? '#a084e8' : '#3b2a5c', color: i < 2 ? '#0f2e14' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>{ch}</span>
            ))}
          </span>
          <span className="t-small">Guess the word in 6 tries. 4 letters on Easy, 5 on Hard.</span>
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={() => setView('breathe')} className="stack" style={{ gap: 6, alignItems: 'flex-start', textAlign: 'left', minHeight: 120, padding: 16, borderRadius: 'var(--r-card)', background: '#5ab569', color: '#0f2e14' }}>
            <Icon name="ph:wind-light" size={24} />
            <span className="ha" style={{ fontSize: 16, fontWeight: 700 }}>Breathe</span>
            <span className="hm" style={{ fontSize: 13 }}>One calm minute</span>
          </button>
          <div className="stack" style={{ gap: 6, minHeight: 120, padding: 16, borderRadius: 'var(--r-card)', background: '#ffce5d', color: '#3d2d08' }}>
            <Icon name="ph:lightbulb-light" size={24} />
            <span className="ha" style={{ fontSize: 16, fontWeight: 700 }}>Tiny cryptic</span>
            <span className="hm" style={{ fontSize: 13 }}>Coming soon</span>
          </div>
          <div className="stack" style={{ gap: 6, minHeight: 120, padding: 16, borderRadius: 'var(--r-card)', background: '#ff9551', color: '#3f1a03', gridColumn: 'span 2' }}>
            <Icon name="ph:paint-brush-light" size={24} />
            <span className="ha" style={{ fontSize: 16, fontWeight: 700 }}>Colour a page</span>
            <span className="hm" style={{ fontSize: 13 }}>Like the back of the book. Coming soon.</span>
          </div>
        </div>
      </div>
      <NavBar nav={nav} active="play" />
    </div>
  );
}

function WordGame({ nav, onBack }) {
  const s = useStore();
  const [mode, setMode] = useState('easy');
  const [cur, setCur] = useState('');
  const [toast, say] = useToast();
  const list = mode === 'easy' ? EASY : HARD;
  const answer = list[dayIndex() % list.length];
  const n = answer.length;
  const gkey = `${dayKey()}:${mode}`;
  const game = s.games[gkey] || { guesses: [], done: false, won: false };

  const keyState = {};
  game.guesses.forEach((g) => score(g, answer).forEach((r, i) => {
    const ch = g[i], prev = keyState[ch];
    if (r === 'hit' || (r === 'near' && prev !== 'hit') || (r === 'miss' && !prev)) keyState[ch] = r;
  }));

  const type = (ch) => { if (!game.done && cur.length < n) setCur((c) => c + ch); };
  const del = () => setCur((c) => c.slice(0, -1));
  const enter = () => {
    if (game.done) return;
    if (cur.length < n) return say(`The word has ${n} letters`);
    const guesses = [...game.guesses, cur];
    const won = cur === answer;
    const done = won || guesses.length >= TRIES;
    actions.saveGame(gkey, { guesses, done, won });
    setCur('');
    if (won) say(['Brilliant!', 'Lovely!', 'Nice one!', 'Got it!', 'Phew!', 'Just in time!'][guesses.length - 1]);
    else if (done) say(`The word was ${answer}`);
  };

  const ref = useRef({});
  ref.current = { type, del, enter };
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') ref.current.enter();
      else if (e.key === 'Backspace') ref.current.del();
      else if (/^[a-zA-Z]$/.test(e.key)) ref.current.type(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setCur(''), [mode]);

  const rows = Array.from({ length: TRIES }, (_, r) => {
    const g = game.guesses[r];
    if (g) return { letters: [...g], res: score(g, answer) };
    if (r === game.guesses.length && !game.done) return { letters: [...cur.padEnd(n)], res: null, active: true };
    return { letters: Array(n).fill(' '), res: null };
  });
  const tile = mode === 'easy' ? 56 : 52;

  return (
    <div className="screen tall">
      <div className="page nonav" style={{ gap: 16 }}>
        <TopBar onBack={onBack} right={<span className="t-cap" style={{ marginRight: 8 }}>{game.done ? (game.won ? 'Solved' : 'Try again tomorrow') : `Guess ${game.guesses.length + 1} of ${TRIES}`}</span>} />
        <h1 className="t-title">Word of the day</h1>
        <div className="seg" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button aria-pressed={mode === 'easy'} onClick={() => setMode('easy')}>Easy · 4 letters</button>
          <button aria-pressed={mode === 'hard'} onClick={() => setMode('hard')}>Hard · 5 letters</button>
        </div>
        <div className="stack" role="grid" aria-label={`${n}-letter word puzzle`} style={{ gap: 8, alignItems: 'center', marginTop: 4 }}>
          {rows.map((r, ri) => (
            <div key={ri} role="row" className="row" style={{ gap: 8 }}>
              {r.letters.map((ch, i) => {
                const c = r.res && COLORS[r.res[i]];
                return (
                  <span key={i} role="gridcell" aria-label={ch.trim() ? `${ch}${r.res ? ', ' + { hit: 'right spot', near: 'in the word', miss: 'not in the word' }[r.res[i]] : ''}` : 'empty'} className="ha"
                    style={{ width: tile, height: tile, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700,
                      background: c ? c[0] : 'rgba(26,16,37,.4)', color: c ? c[1] : '#fff', border: c ? 'none' : `1.5px solid ${r.active && ch.trim() ? 'var(--purple)' : 'rgba(160,132,232,.35)'}` }}>{ch}</span>
                );
              })}
            </div>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'center', gap: 16 }} aria-hidden="true">
          <span className="row t-cap" style={{ gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#5ab569' }} />Right spot</span>
          <span className="row t-cap" style={{ gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#a084e8' }} />In the word</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="stack" style={{ gap: 8, margin: '0 -12px' }}>
          {ROWS.map((row, ri) => (
            <div key={row} className="row" style={{ gap: 5, justifyContent: 'center' }}>
              {ri === 2 && <button onClick={enter} className="ha" style={{ width: 54, height: 48, borderRadius: 10, background: 'var(--green)', fontSize: 12, fontWeight: 700 }}>ENTER</button>}
              {[...row].map((ch) => {
                const st = keyState[ch];
                const c = st ? COLORS[st] : ['rgba(160,132,232,.28)', '#fff'];
                return <button key={ch} onClick={() => type(ch)} className="ha" style={{ width: 31, height: 48, borderRadius: 8, background: c[0], color: c[1], fontSize: 15, fontWeight: 700 }}>{ch}</button>;
              })}
              {ri === 2 && <button onClick={del} aria-label="Delete letter" style={{ width: 54, height: 48, borderRadius: 10, background: 'rgba(160,132,232,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="ph:backspace-light" size={22} /></button>}
            </div>
          ))}
        </div>
      </div>
      {toast}
    </div>
  );
}

function Breathe({ onBack }) {
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(60);
  const [phase, setPhase] = useState('in');
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((x) => { if (x <= 1) { setRunning(false); return 0; } return x - 1; }), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (!running) return;
    let alive = true;
    const loop = () => { if (!alive) return; setPhase('in'); setTimeout(() => { if (!alive) return; setPhase('out'); setTimeout(loop, 6000); }, 4000); };
    loop();
    return () => { alive = false; };
  }, [running]);
  const big = running && phase === 'in';
  return (
    <div className="screen tall">
      <div className="page nonav" style={{ alignItems: 'center' }}>
        <div style={{ alignSelf: 'stretch' }}><TopBar onBack={onBack} /></div>
        <h1 className="t-title" style={{ alignSelf: 'flex-start' }}>Breathe</h1>
        <p className="t-small" style={{ alignSelf: 'flex-start', margin: '-12px 0 0' }}>Breathe in for 4 seconds, out for 6. One minute.</p>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 260, height: 260, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(90,181,105,.12)' }}>
            <div style={{ width: big ? 240 : 120, height: big ? 240 : 120, borderRadius: '50%', background: 'radial-gradient(circle, #8fdc9b, #5ab569)', transition: `all ${phase === 'in' ? 4 : 6}s ease-in-out`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="ha" style={{ fontSize: 18, fontWeight: 700, color: '#0f2e14' }} aria-live="polite">{!running ? (left === 0 ? 'Well done' : 'Ready') : phase === 'in' ? 'Breathe in' : 'Breathe out'}</span>
            </div>
          </div>
        </div>
        <div className="ha" style={{ fontSize: 32, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>0:{String(left).padStart(2, '0')}</div>
        <button className="btn btn-green" style={{ alignSelf: 'stretch' }} onClick={() => { if (running) setRunning(false); else { if (left === 0) setLeft(60); setRunning(true); } }}>
          {running ? 'Pause' : left === 0 ? 'Again' : left < 60 ? 'Resume' : 'Start'}
        </button>
      </div>
    </div>
  );
}
