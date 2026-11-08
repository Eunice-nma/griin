import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, actions, dayKey, timeOf, nextPrompt, moodById, levelById } from '../store.js';
import Icon from '../Icon.jsx';
import { NavBar, TopBar } from '../ui.jsx';
import { prettyDate } from './Home.jsx';

export default function Journal({ nav, day, prompt: startWithPrompt }) {
  const s = useStore();
  const key = day || dayKey();
  const isToday = key === dayKey();
  const date = new Date(key + 'T12:00:00');
  const [draft, setDraft] = useState('');
  const s0 = useStore();
  const [pending, setPending] = useState(startWithPrompt && isToday ? nextPrompt(s0.notes, key) : null); // a prompt waiting for a reply
  const [skip, setSkip] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const asTab = nav.depth === 1;

  const items = useMemo(() => {
    const on = (x) => dayKey(x.ts) === key;
    return [
      ...s.notes.filter(on).map((x) => ({ ...x, kind: 'note' })),
      ...s.moods.filter(on).map((x) => ({ ...x, kind: 'mood' })),
      ...s.anxiety.filter(on).map((x) => ({ ...x, kind: 'anx' })),
    ].sort((a, b) => a.ts - b.ts);
  }, [s.notes, s.moods, s.anxiety, key]);

  const lastMood = [...s.moods].reverse().find((m) => dayKey(m.ts) === key);
  // once a prompt is answered, the next unanswered one takes its place
  const offered = nextPrompt(s.notes, key, skip);

  useEffect(() => { listRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [items.length, pending]);
  useEffect(() => { if (pending) inputRef.current?.focus(); }, [pending]);

  const ask = () => setPending(offered);
  const send = () => {
    const t = draft.trim();
    if (!t) return;
    actions.addNote(t, pending || undefined);
    setDraft('');
    setPending(null);
  };

  return (
    <div className="screen">
      <div aria-hidden="true" style={{ position: 'absolute', left: 60, top: 240, width: 140, height: 140, borderRadius: '50%', background: 'rgba(113,89,175,.3)', filter: 'blur(60px)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', left: 250, top: 480, width: 120, height: 120, borderRadius: '50%', background: 'rgba(160,80,220,.3)', filter: 'blur(60px)' }} />

      <div className="page nonav" style={{ bottom: asTab ? 'var(--nav-h)' : 0, paddingBottom: 0, gap: 16 }}>
        <TopBar onBack={asTab ? null : () => nav.back()} left={asTab ? <h1 className="t-display" style={{ marginLeft: 8 }}>Journal</h1> : null} right={
          <div className="row" style={{ gap: 8 }}>
            <button onClick={() => nav.go('insights', { view: 'mood', pick: key })} className="hm" aria-label="Open calendar"
              style={{ height: 36, padding: '0 14px', borderRadius: 18, border: '1px solid var(--mid)', background: 'rgba(34,13,71,0.55)', fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="solar:calendar-linear" size={16} color="var(--purple)" />{prettyDate(date)}
            </button>
            <button className="icon-btn" onClick={() => { nav.lock(); nav.reset('home'); }} aria-label="Lock journal" style={{ color: 'var(--purple)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            </button>
          </div>
        } />

        {/* today's prompt offer */}
        {isToday && !pending && (
          <div className="row" style={{ gap: 12, padding: '0 2px' }}>
            <button onClick={ask} className="stack" style={{ flex: 1, gap: 4, textAlign: 'left' }}>
              <span className="row" style={{ gap: 6 }}>
                <span className="ha" style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>Journal Prompt</span>
                <Icon name="boxicons:sparkle-filled" size={12} color="var(--green)" />
              </span>
              <span className="t-small" style={{ color: 'var(--purple)' }}>{offered}</span>
            </button>
            <div className="stack" style={{ gap: 4 }}>
              <button className="icon-btn" onClick={ask} aria-label="Answer this prompt" style={{ width: 36, height: 36, border: '1px solid var(--green)', color: 'var(--green)' }}>
                <Icon name="system-uicons:write" size={16} />
              </button>
              <button className="icon-btn" onClick={() => setSkip((i) => i + 1)} aria-label="Show another prompt" style={{ width: 36, height: 36, color: 'var(--muted)' }}>
                <Icon name="ph:arrow-counter-clockwise-bold" size={14} />
              </button>
            </div>
          </div>
        )}

        {/* the conversation */}
        <div ref={listRef} className="scroll stack" style={{ flex: 1, gap: 12, paddingBottom: 16, margin: '0 -4px', padding: '0 4px 16px' }}>
          {items.length === 0 && !pending && (
            <div className="t-small" style={{ textAlign: 'center', marginTop: 48 }}>
              {isToday ? 'Nothing here yet. Write anything below, or tap the prompt.' : 'No entries on this day.'}
            </div>
          )}
          {items.map((it) => {
            if (it.kind === 'note') return (
              <div key={it.id} className="stack" style={{ gap: 8 }}>
                {it.prompt && <PromptBubble text={it.prompt} />}
                <div style={{ alignSelf: 'flex-end', maxWidth: 310, background: 'rgba(34,13,71,0.6)', border: '1px solid var(--mid)', borderRadius: '20px 20px 8px 20px', padding: '12px 16px 8px' }}>
                  <div className="t-body" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{it.text}</div>
                  <div className="t-cap" style={{ textAlign: 'right', marginTop: 4, color: 'var(--purple)' }}>{timeOf(it.ts)}</div>
                </div>
              </div>
            );
            if (it.kind === 'mood') { const m = moodById(it.mood); return <Pill key={it.id} color={m.color} label="Feeling " value={m.name} time={timeOf(it.ts)} />; }
            const l = levelById(it.level);
            return (
              <div key={it.id} className="stack" style={{ alignItems: 'center', gap: 4 }}>
                <Pill color={l.color} label="Anxiety • " value={l.name} time={timeOf(it.ts)} />
                {it.factors?.length > 0 && <span className="t-cap">{it.factors.join(' · ')}</span>}
              </div>
            );
          })}
          {pending && <PromptBubble text={pending} live />}
        </div>
      </div>

      {isToday && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: asTab ? 'var(--nav-h)' : 0, padding: '10px var(--pad) 14px', background: 'linear-gradient(180deg, rgba(42,21,78,0), rgba(42,21,78,.95) 30%)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pending && (
            <div className="between" style={{ background: 'rgba(90,181,105,.14)', border: '1px solid rgba(90,181,105,.5)', borderRadius: 14, padding: '6px 6px 6px 12px' }}>
              <span className="t-cap" style={{ color: 'var(--ink2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Replying to the prompt</span>
              <button onClick={() => { setPending(null); setDraft(''); }} className="hm" style={{ fontSize: 13, color: 'var(--green)', height: 32, padding: '0 10px' }}>Cancel</button>
            </div>
          )}
          <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
            <button className="circle" onClick={() => nav.go('anxiety')} aria-label="Log anxiety level" style={{ width: 48, height: 48, borderRadius: 24, color: '#fff' }}>
              <Icon name="cuida:heart-rate-outline" size={20} />
            </button>
            <button className="circle" onClick={() => nav.go('feel', { mood: lastMood?.mood })} aria-label="Log how you feel" style={{ width: 48, height: 48, borderRadius: 24 }}>
              <Icon name={moodById(lastMood?.mood || 'great').icon} size={20} color={lastMood ? moodById(lastMood.mood).color : 'var(--yellow)'} />
            </button>
            <div className="row" style={{ flex: 1, minWidth: 0, minHeight: 48, borderRadius: 16, border: '1px solid var(--purple)', background: 'rgba(37,23,53,0.7)', padding: '0 4px 0 14px' }}>
              <label htmlFor="note" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{pending ? 'Your answer' : 'Write a journal note'}</label>
              <textarea id="note" ref={inputRef} className="hm" rows={1} value={draft} placeholder={pending ? 'Type your answer…' : 'Write anything…'}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: '#fff', fontSize: 15, lineHeight: '20px', padding: '13px 0', maxHeight: 100 }} />
              <button onClick={send} disabled={!draft.trim()} className="icon-btn" aria-label="Save note" style={{ color: draft.trim() ? '#fff' : 'var(--mid)' }}>
                <Icon name="system-uicons:write" size={20} />
              </button>
            </div>
          </div>
          <style>{`#note::placeholder{color:#8a72c9}`}</style>
        </div>
      )}

      {asTab && <NavBar nav={nav} active="journal" />}
    </div>
  );
}

function PromptBubble({ text, live }) {
  return (
    <div className="row" style={{ gap: 8, alignItems: 'flex-end', alignSelf: 'flex-start', maxWidth: 310, animation: live ? 'fadein .25s' : undefined }}>
      <span className="circle" style={{ width: 28, height: 28, borderColor: 'var(--green)', color: 'var(--green)' }} aria-hidden="true"><Icon name="boxicons:sparkle-filled" size={12} /></span>
      <div style={{ background: 'rgba(34,13,71,0.6)', border: '1px solid rgba(90,181,105,.7)', borderRadius: '20px 20px 20px 8px', padding: '10px 14px' }}>
        <div className="t-cap" style={{ color: 'var(--green)', marginBottom: 2 }}>Griin</div>
        <div className="t-small" style={{ color: 'var(--purple)', fontSize: 14, lineHeight: '19px' }}>{text}</div>
      </div>
    </div>
  );
}

function Pill({ color, label, value, time }) {
  return (
    <div className="row" style={{ alignSelf: 'center', minHeight: 26, borderRadius: 13, border: `1px solid ${color}`, background: 'rgba(60,28,117,0.45)', gap: 6, padding: '0 12px 0 8px' }}>
      <span style={{ width: 10, height: 10, borderRadius: 5, background: color }} />
      <span className="ha" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>{label}<span style={{ color: '#fff' }}>{value}</span></span>
      <span className="t-cap" style={{ fontSize: 11 }}>{time}</span>
    </div>
  );
}
