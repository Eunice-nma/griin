import { useState } from 'react';
import { useStore, actions, localIso, goalItems, GOAL_COLORS, sortTodos } from '../store.js';
import Icon from '../Icon.jsx';
import { NavBar, Sheet, Check } from '../ui.jsx';
import { whenText } from './Home.jsx';

export default function Plans({ nav, view: startView }) {
  const s = useStore();
  const [view, setView] = useState(startView || 'goals');
  const [sheet, setSheet] = useState(null);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [stepFor, setStepFor] = useState(null);
  const [stepText, setStepText] = useState('');
  const [someText, setSomeText] = useState('');
  const [color, setColor] = useState(GOAL_COLORS[(s.goals.length + 2) % GOAL_COLORS.length]);

  const close = () => { setSheet(null); setA(''); setB(''); setC(''); };
  const openReminder = () => { const d = new Date(Date.now() + 86400e3); d.setHours(9, 0, 0, 0); setB(localIso(d)); setSheet('reminder'); };
  const reminders = [...s.reminders].sort((x, y) => x.at.localeCompare(y.at));
  const upcoming = reminders.filter((r) => !r.done), done = reminders.filter((r) => r.done);

  return (
    <div className="screen tall">
      <div className="page scroll" style={{ gap: 20 }}>
        <div className="between">
          <h1 className="t-display">Plans</h1>
          <button className="btn btn-purple" style={{ height: 40, padding: '0 16px', fontSize: 14 }}
            onClick={() => (view === 'goals' ? setSheet('goal') : view === 'reminders' ? openReminder() : document.getElementById('someday-text')?.focus())}>
            <Icon name="ph:plus-bold" size={14} /> New
          </button>
        </div>
        <div className="seg" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <button aria-pressed={view === 'goals'} onClick={() => setView('goals')}>Goals</button>
          <button aria-pressed={view === 'future'} onClick={() => setView('future')}>Future plans</button>
          <button aria-pressed={view === 'reminders'} onClick={() => setView('reminders')}>Reminders</button>
        </div>

        {view === 'goals' && (
          <div className="stack" style={{ gap: 14 }}>
            {s.goals.length === 0 && <div className="t-small">No goals yet. Tap New to set your first one.</div>}
            {s.goals.map((g) => {
              const gi = goalItems(g, s.tasks);
              return (
                <article key={g.id} className="card stack" style={{ gap: 10, borderColor: g.color, padding: 0, overflow: 'hidden' }}>
                  <button onClick={() => nav.go('goal', { id: g.id })} className="stack" style={{ gap: 10, padding: '16px 16px 4px', textAlign: 'left' }} aria-label={`Open ${g.title}`}>
                    <span className="row" style={{ gap: 12, width: '100%' }}>
                      <span className="circle" style={{ border: 'none', background: 'var(--deep)' }}><Icon name={g.icon} size={22} color={g.color} /></span>
                      <span className="stack" style={{ flex: 1, gap: 2 }}>
                        <span className="t-section">{g.title}</span>
                        <span className="t-cap">{[g.due, `${gi.done} of ${gi.total} done`].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className="ha" style={{ fontSize: 17, fontWeight: 700, color: g.color }}>{gi.progress}%</span>
                      <Icon name="ph:caret-right-bold" size={12} color="var(--muted)" />
                    </span>
                    <span style={{ display: 'block', width: '100%', height: 6, borderRadius: 3, background: 'var(--deep)' }}><span style={{ display: 'block', width: `${gi.progress}%`, height: 6, borderRadius: 3, background: g.color, transition: 'width .3s' }} /></span>
                  </button>
                  <div className="stack" style={{ padding: '0 16px 10px' }}>
                    {gi.open.length === 0 && <span className="t-small" style={{ padding: '8px 0', color: 'var(--green)' }}>Everything’s done here.</span>}
                    {sortTodos(gi.open).slice(0, 3).map((it) => (
                      <button key={it.id} onClick={() => (it.kind === 'step' ? actions.toggleStep(g.id, it.id) : actions.toggleTask(it.id))} className="row" style={{ gap: 12, minHeight: 42, textAlign: 'left' }}>
                        <Check done={false} color={g.color} />
                        <span className="t-body" style={{ flex: 1, color: 'var(--ink2)' }}>{it.text}</span>
                        {it.kind === 'task' && <span className="t-cap">{dayLabel(it.day)}</span>}
                      </button>
                    ))}
                    {gi.open.length > 3 && <button className="link" onClick={() => nav.go('goal', { id: g.id })} style={{ marginLeft: 30, alignSelf: 'flex-start' }}>+{gi.open.length - 3} more</button>}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {view === 'future' && (
          <div className="stack" style={{ gap: 12 }}>
            <p className="t-small" style={{ margin: 0 }}>Things you want to do some day. No dates, no pressure.</p>
            <form className="row" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); if (someText.trim()) { actions.addSomeday(someText.trim()); setSomeText(''); } }}>
              <input id="someday-text" className="field" value={someText} onChange={(e) => setSomeText(e.target.value)} placeholder="e.g. Learn to swim" />
              <button type="submit" className="btn btn-green" style={{ padding: '0 18px' }} disabled={!someText.trim()}>Add</button>
            </form>
            <div className="card" style={{ padding: '4px 8px 4px 16px' }}>
              {s.someday.length === 0 && <div className="t-small" style={{ padding: '12px 0' }}>Nothing here yet.</div>}
              {s.someday.map((x, i) => (
                <div key={x.id} className="row" style={{ gap: 12, minHeight: 52, borderTop: i ? '1px solid rgba(160,132,232,.15)' : 'none' }}>
                  <Icon name="ph:lightbulb-light" size={20} color="var(--yellow)" />
                  <span className="t-body" style={{ flex: 1, color: 'var(--ink2)' }}>{x.text}</span>
                  <button className="link" onClick={() => { actions.addGoal(x.text, '', ''); actions.removeSomeday(x.id); setView('goals'); }}>Make it a goal</button>
                  <button className="icon-btn" onClick={() => actions.removeSomeday(x.id)} aria-label={`Remove ${x.text}`} style={{ color: 'var(--muted)', width: 36, height: 36 }}><Icon name="ph:trash-light" size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'reminders' && (
          <div className="stack" style={{ gap: 12 }}>
            {upcoming.length === 0 && <div className="t-small">No reminders coming up. Tap New to add one.</div>}
            {upcoming.map((r) => <ReminderRow key={r.id} r={r} />)}
            {done.length > 0 && <h2 className="t-section" style={{ marginTop: 8 }}>Done</h2>}
            {done.map((r) => <ReminderRow key={r.id} r={r} />)}
            <p className="t-cap" style={{ margin: '4px 0 0' }}>Reminders show on Today when they’re close. Phone alerts arrive with the phone app.</p>
          </div>
        )}
      </div>
      <NavBar nav={nav} active="plans" />

      {sheet === 'goal' && (
        <Sheet title="New goal" onClose={close}>
          <label className="label">Goal<input id="goal-title" className="field" autoFocus value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. Bali Trip" /></label>
          <label className="label">First step<input id="goal-step" className="field" value={b} onChange={(e) => setB(e.target.value)} placeholder="e.g. Buy hand luggage bag" /></label>
          <label className="label">When (optional)<input id="goal-due" className="field" value={c} onChange={(e) => setC(e.target.value)} placeholder="e.g. in 6 weeks" /></label>
          <ColorPick value={color} onChange={setColor} />
          <button className="btn btn-green" disabled={!a.trim()} onClick={() => { actions.addGoal(a.trim(), b.trim(), c.trim(), color); close(); }}>Add goal</button>
        </Sheet>
      )}
      {sheet === 'reminder' && (
        <Sheet title="New reminder" onClose={close}>
          <label className="label">Remind me to<input id="rem-text" className="field" autoFocus value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. Pay rent" /></label>
          <label className="label">When<input id="rem-at" className="field" type="datetime-local" value={b} onChange={(e) => setB(e.target.value)} /></label>
          <button className="btn btn-green" disabled={!a.trim() || !b} onClick={() => { actions.addReminder(a.trim(), b); close(); }}>Add reminder</button>
        </Sheet>
      )}
    </div>
  );
}

export function dayLabel(k) {
  const d = new Date(k + 'T12:00'), t = new Date(); t.setHours(12, 0, 0, 0);
  const diff = Math.round((d - t) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function ReminderRow({ r }) {
  const late = !r.done && new Date(r.at) < new Date();
  return (
    <div className="card row" style={{ gap: 12, padding: '8px 8px 8px 16px', opacity: r.done ? 0.65 : 1 }}>
      <button onClick={() => actions.toggleReminder(r.id)} aria-pressed={r.done} className="row" style={{ flex: 1, gap: 12, minHeight: 44, textAlign: 'left' }}>
        <Check done={r.done} color="var(--yellow)" />
        <span className="stack" style={{ gap: 2 }}>
          <span className="t-body" style={{ color: 'var(--ink2)', textDecoration: r.done ? 'line-through' : 'none' }}>{r.text}</span>
          <span className="t-cap" style={{ color: late ? '#ff9c9c' : 'var(--muted)' }}>{late ? 'Overdue · ' : ''}{whenText(r.at)}</span>
        </span>
      </button>
      <button className="icon-btn" onClick={() => actions.removeReminder(r.id)} aria-label={`Delete reminder ${r.text}`} style={{ color: 'var(--muted)' }}><Icon name="ph:trash-light" size={18} /></button>
    </div>
  );
}

export function ColorPick({ value, onChange }) {
  return (
    <div className="label">Colour
      <div className="row" style={{ gap: 10 }} role="radiogroup" aria-label="Goal colour">
        {GOAL_COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={c} onClick={() => onChange(c)}
            style={{ width: 36, height: 36, borderRadius: 18, background: c, boxShadow: value === c ? '0 0 0 3px var(--deep), 0 0 0 5px #fff' : 'none' }} />
        ))}
      </div>
    </div>
  );
}
