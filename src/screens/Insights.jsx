import { useMemo, useState } from 'react';
import { useStore, MOODS, LEVELS, moodById, levelById, dayKey, timeOf } from '../store.js';
import Icon from '../Icon.jsx';
import { NavBar } from '../ui.jsx';

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const rank = (id) => LEVELS.findIndex((l) => l.id === id); // 0 = severe

function cellsFor(y, m) {
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

export default function Insights({ nav, view: startView }) {
  const s = useStore();
  const now = new Date();
  const [view, setView] = useState(startView === 'anxiety' ? 'anxiety' : 'mood');
  const [ym, setYm] = useState([now.getFullYear(), now.getMonth()]);
  const [sel, setSel] = useState(now.getDate());
  const [y, m] = ym;
  const monthName = new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const shift = (d) => { const n = new Date(y, m + d, 1); setYm([n.getFullYear(), n.getMonth()]); setSel(null); };

  const source = view === 'mood' ? s.moods : s.anxiety;
  const byDay = useMemo(() => {
    const map = {};
    source.forEach((e) => { const k = dayKey(e.ts); (map[k] ||= []).push(e); });
    return map;
  }, [source]);
  const keyOf = (d) => dayKey(new Date(y, m, d));
  const inMonth = source.filter((e) => { const d = new Date(e.ts); return d.getFullYear() === y && d.getMonth() === m; });
  const selKey = sel ? keyOf(sel) : null;
  const entries = selKey ? byDay[selKey] || [] : [];
  const todayKey = dayKey();
  const selLabel = selKey ? new Date(selKey + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  return (
    <div className="screen tall">
      <div className="page scroll" style={{ gap: 20 }}>
        <div className="between">
          <h1 className="t-display">Vibes</h1>
          <button className="link" onClick={() => nav.openJournal({ day: selKey || todayKey })}>Open journal</button>
        </div>
        <div className="seg" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button aria-pressed={view === 'mood'} onClick={() => setView('mood')}>Mood</button>
          <button aria-pressed={view === 'anxiety'} onClick={() => setView('anxiety')}>Anxiety</button>
        </div>

        <div className="between">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><Icon name="ic:round-arrow-back-ios" size={18} /></button>
          <h2 className="t-title" style={{ fontSize: 18 }}>{monthName}</h2>
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><Icon name="ic:round-arrow-back-ios" size={18} style={{ transform: 'rotate(180deg)' }} /></button>
        </div>

        {/* this month at a glance: most frequent first, sized by how often */}
        <div className="card" style={{ padding: '14px 12px 12px' }}>
          <div className="t-cap" style={{ marginBottom: 8, paddingLeft: 4 }}>{view === 'mood' ? 'Moods this month' : 'Anxiety this month'}</div>
          <Summary items={(view === 'mood' ? MOODS : LEVELS).map((x) => ({ ...x, n: inMonth.filter((e) => (view === 'mood' ? e.mood : e.level) === x.id).length }))} mood={view === 'mood'} />
        </div>

        {/* calendar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', rowGap: 10 }}>
          {WD.map((w) => <div key={w} className="t-cap" style={{ textAlign: 'center', color: 'var(--ink2)' }}>{w}</div>)}
          {cellsFor(y, m).map((d, i) => {
            if (!d) return <div key={'e' + i} />;
            const k = keyOf(d);
            const es = byDay[k] || [];
            const on = d === sel;
            let inner = null, fill = 'rgba(57,29,105,0.3)';
            if (view === 'mood' && es.length) inner = <DayFaces entries={es} />;
            if (view === 'anxiety' && es.length) {
              fill = es.length === 1 ? levelById(es[0].level).color : `conic-gradient(${es.map((e, j) => `${levelById(e.level).color} ${(j / es.length) * 360}deg ${((j + 1) / es.length) * 360}deg`).join(', ')})`;
              inner = es.length > 1 ? <span className="ha" style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--bg0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{es.length}</span> : null;
            }
            return (
              <button key={k} onClick={() => setSel(d)} aria-pressed={on} className="stack" style={{ alignItems: 'center', gap: 2 }}
                aria-label={`${d}: ${es.length ? es.length + (view === 'mood' ? ' moods' : ' check-ins') : 'nothing logged'}`}>
                <span style={{ width: 40, height: 40, borderRadius: 20, background: fill, border: `${on ? 2 : 1}px solid ${on ? '#fff' : 'rgba(160,132,232,0.5)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{inner}</span>
                <span className="ha" style={{ fontSize: 13, fontWeight: 600, lineHeight: '18px', color: k === todayKey ? 'var(--green)' : 'var(--ink2)' }}>{d}</span>
              </button>
            );
          })}
        </div>

        {/* breakdown */}
        <section className="stack" style={{ gap: 12 }}>
          <div className="stack" style={{ gap: 2 }}>
            <h2 className="t-section">{view === 'mood' ? 'Mood breakdown' : 'Anxiety breakdown'}</h2>
            <span className="t-cap">{selKey ? selLabel : 'Tap a day to see how it went'}</span>
          </div>
          {selKey && entries.length === 0 && <div className="t-small">Nothing logged on this day.</div>}
          {view === 'mood' && entries.map((e) => {
            const md = moodById(e.mood);
            return (
              <div key={e.id} className="row" style={{ minHeight: 56, borderRadius: 18, border: `1px solid ${md.color}99`, padding: '0 16px', gap: 14 }}>
                <Icon name={md.icon} size={30} color={md.color} />
                <span className="ha" style={{ flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{md.name}</span>
                <span className="t-cap">{timeOf(e.ts)}</span>
              </div>
            );
          })}
          {view === 'anxiety' && entries.map((e, i) => {
            const l = levelById(e.level);
            const nx = entries[i + 1] && levelById(entries[i + 1].level);
            return (
              <div key={e.id}>
                <div className="row" style={{ gap: 12, minHeight: 32 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 12, background: l.color, flexShrink: 0 }} />
                  <span className="ha" style={{ fontSize: 14, fontWeight: 700, width: 70 }}>{l.name}</span>
                  <div className="row" style={{ flex: 1, flexWrap: 'wrap', gap: 6 }}>
                    {(e.factors?.length ? e.factors : ['No factors']).map((f) => <span key={f} className="chip sm" style={{ border: `1px solid ${l.color}99` }}>{f}</span>)}
                  </div>
                  <span className="t-cap">{timeOf(e.ts)}</span>
                </div>
                {nx && <div style={{ width: 3, height: 20, margin: '4px 0 4px 10.5px', background: `${nx.color}80` }} />}
              </div>
            );
          })}
          {view === 'anxiety' && entries.length > 0 && <Words entries={entries} />}
        </section>
      </div>
      <NavBar nav={nav} active="insights" />
    </div>
  );
}

function Words({ entries }) {
  const present = LEVELS.filter((l) => entries.some((e) => e.level === l.id));
  const [pick, setPick] = useState(present[present.length - 1].id);
  const shown = levelById(present.some((p) => p.id === pick) ? pick : present[0].id);
  return (
    <div className="card stack" style={{ gap: 12, marginTop: 4 }}>
      <span className="t-cap">Levels present · tap one to see how it feels</span>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {present.map((l) => (
          <button key={l.id} onClick={() => setPick(l.id)} aria-pressed={l.id === shown.id} className="chip"
            style={{ gap: 6, border: `1px solid ${l.id === shown.id ? l.color : 'transparent'}`, background: 'rgba(26,16,37,.4)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 6, background: l.color }} />{l.name}
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {shown.words.map((w) => <span key={w} className="chip sm" style={{ background: shown.chip }}>{w}</span>)}
      </div>
    </div>
  );
}

function Summary({ items, mood }) {
  const max = Math.max(1, ...items.map((x) => x.n));
  const sorted = [...items].sort((a, b) => b.n - a.n);
  return (
    <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-around', minHeight: 84 }}>
      {sorted.map((x) => {
        const size = x.n ? 20 + (x.n / max) * 22 : 16;
        return (
          <div key={x.id} className="stack" style={{ alignItems: 'center', gap: 2, opacity: x.n ? 1 : 0.4, transition: 'all .3s' }} aria-label={`${x.name}: ${x.n}`}>
            {mood ? <Icon name={x.icon} size={size} color={x.color} /> : <span style={{ width: size, height: size, borderRadius: size, background: x.color }} />}
            <span className="ha" style={{ fontSize: x.n === max && x.n ? 18 : 14, fontWeight: 700, color: x.color, lineHeight: '20px' }}>{x.n}</span>
            <span className="t-cap" style={{ fontSize: 11 }}>{x.name}</span>
          </div>
        );
      })}
    </div>
  );
}

// up to 3 of the day's latest moods, clustered like bubbles; the newest is biggest
function DayFaces({ entries }) {
  const last = entries.slice(-3);
  if (last.length === 1) { const md = moodById(last[0].mood); return <Icon name={md.icon} size={24} color={md.color} />; }
  const spots = last.length === 2
    ? [{ l: 4, t: 5, s: 13 }, { l: 13, t: 12, s: 20 }]
    : [{ l: 4, t: 5, s: 11 }, { l: 20, t: 4, s: 12 }, { l: 10, t: 15, s: 19 }];
  return (
    <span style={{ position: 'relative', width: 38, height: 38 }}>
      {last.map((e, i) => {
        const md = moodById(e.mood), p = spots[i];
        return <span key={e.id} style={{ position: 'absolute', left: p.l, top: p.t, display: 'flex' }}><Icon name={md.icon} size={p.s} color={md.color} /></span>;
      })}
    </span>
  );
}
