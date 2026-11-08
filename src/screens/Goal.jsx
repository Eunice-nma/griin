import { useState } from 'react';
import { useStore, actions, goalItems, sortTodos } from '../store.js';
import Icon from '../Icon.jsx';
import { TopBar, Sheet, Check } from '../ui.jsx';
import { dayLabel, ColorPick } from './Plans.jsx';

export default function Goal({ nav, id }) {
  const s = useStore();
  const g = s.goals.find((x) => x.id === id);
  const [text, setText] = useState('');
  const [day, setDay] = useState('');
  const [showDay, setShowDay] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(null);

  if (!g) return (
    <div className="screen tall"><div className="page nonav"><TopBar onBack={() => nav.back()} /><p className="t-small">This goal was deleted.</p></div></div>
  );

  const gi = goalItems(g, s.tasks);
  const open = sortTodos(gi.open);
  const done = sortTodos(gi.doneItems);
  const toggle = (it) => (it.kind === 'step' ? actions.toggleStep(g.id, it.id) : actions.toggleTask(it.id));
  const remove = (it) => (it.kind === 'step' ? actions.removeStep(g.id, it.id) : actions.removeTask(it.id));
  const add = () => {
    if (!text.trim()) return;
    if (showDay && day) actions.addTask(text.trim(), '', day, g.id); else actions.addStep(g.id, text.trim());
    setText(''); setDay(''); setShowDay(false);
  };
  const R = 30, C = 2 * Math.PI * R;

  const Row = ({ it }) => (
    <div className="row" style={{ gap: 4, minHeight: 50, borderTop: '1px solid rgba(160,132,232,.12)' }}>
      <button onClick={() => toggle(it)} aria-pressed={it.done} className="row" style={{ flex: 1, minWidth: 0, gap: 12, minHeight: 48, textAlign: 'left' }}>
        <Check done={it.done} color={g.color} />
        <span className="stack" style={{ minWidth: 0 }}>
          <span className="t-body" style={{ color: it.done ? 'var(--mid)' : 'var(--ink2)', textDecoration: it.done ? 'line-through' : 'none' }}>{it.text}</span>
          {it.kind === 'task' && <span className="t-cap">{dayLabel(it.day)}{it.time ? ` · ${it.time}` : ''}</span>}
        </span>
      </button>
      <button className="icon-btn" onClick={() => remove(it)} aria-label={`Delete ${it.text}`} style={{ width: 36, height: 36, color: 'var(--muted)' }}><Icon name="iconamoon:close-bold" size={15} /></button>
    </div>
  );

  return (
    <div className="screen tall">
      <div className="page nonav scroll" style={{ gap: 20, paddingBottom: 150 }}>
        <TopBar onBack={() => nav.back()} right={
          <button className="icon-btn" onClick={() => { setForm({ title: g.title, due: g.due || '', note: g.note || '', color: g.color }); setEditing(true); }} aria-label="Edit goal" style={{ color: 'var(--purple)' }}>
            <Icon name="system-uicons:write" size={20} />
          </button>
        } />

        <header className="row" style={{ gap: 16 }}>
          <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
            <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
              <circle cx="38" cy="38" r={R} fill="none" stroke="var(--deep)" strokeWidth="7" />
              <circle cx="38" cy="38" r={R} fill="none" stroke={g.color} strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - gi.progress / 100)} transform="rotate(-90 38 38)" style={{ transition: 'stroke-dashoffset .4s' }} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={g.icon} size={26} color={g.color} /></span>
          </div>
          <div className="stack" style={{ gap: 4, minWidth: 0 }}>
            <h1 className="t-display">{g.title}</h1>
            <span className="t-small"><span className="ha" style={{ color: g.color, fontWeight: 700 }}>{gi.progress}%</span> · {gi.done} of {gi.total} done{g.due ? ` · ${g.due}` : ''}</span>
          </div>
        </header>

        {g.note && <p className="t-body card" style={{ margin: 0, color: 'var(--ink2)', borderColor: `${g.color}66` }}>{g.note}</p>}

        <section className="stack">
          <h2 className="t-section" style={{ marginBottom: 6 }}>To-dos</h2>
          {open.length === 0 && <p className="t-small" style={{ margin: '4px 0 8px' }}>Nothing left to do. Add the next step below.</p>}
          {open.map((it) => <Row key={it.id} it={it} />)}
        </section>

        {done.length > 0 && (
          <section className="stack">
            <button className="between" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} style={{ minHeight: 40 }}>
              <span className="t-section" style={{ color: 'var(--muted)' }}>Done · {done.length}</span>
              <Icon name="ic:round-arrow-back-ios" size={12} color="var(--muted)" style={{ transform: showDone ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform .2s' }} />
            </button>
            {showDone && done.map((it) => <Row key={it.id} it={it} />)}
          </section>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="stack"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, gap: 10, padding: '14px var(--pad) 20px', background: 'linear-gradient(180deg, rgba(42,21,78,0), rgba(42,21,78,.97) 18%)' }}>
        <div className="row" style={{ gap: 8 }}>
          <label htmlFor="goal-todo" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>New to-do for {g.title}</label>
          <input id="goal-todo" className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Next step for ${g.title}…`} style={{ flex: 1, minWidth: 0, borderColor: g.color }} />
          <button type="submit" className="icon-btn" disabled={!text.trim()} aria-label="Add to-do" style={{ width: 48, height: 48, borderRadius: 24, background: g.color, color: '#1a1025', opacity: text.trim() ? 1 : 0.45 }}>
            <Icon name="ph:plus-bold" size={18} />
          </button>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="chip" onClick={() => setShowDay((v) => !v)} aria-pressed={showDay} style={{ border: `1px solid ${showDay ? 'var(--purple)' : 'var(--line)'}`, color: 'var(--ink2)' }}>
            {showDay ? 'On a day' : 'Schedule on a day'}
          </button>
          {showDay && <input id="goal-todo-day" type="date" className="field" aria-label="Day" value={day} onChange={(e) => setDay(e.target.value)} style={{ width: 150, height: 32, borderRadius: 16, fontSize: 13, padding: '0 10px' }} />}
          {!showDay && <span className="t-cap">Unscheduled steps live here only</span>}
        </div>
      </form>

      {editing && form && (
        <Sheet title="Edit goal" onClose={() => { setEditing(false); setConfirmDelete(false); }}>
          <label className="label">Goal<input id="edit-title" className="field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="label">When<input id="edit-due" className="field" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} placeholder="e.g. by March" /></label>
          <label className="label">Why it matters (optional)<input id="edit-note" className="field" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="A line to remember why" /></label>
          <ColorPick value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
          <button className="btn btn-green" disabled={!form.title.trim()} onClick={() => { actions.updateGoal(g.id, { ...form, title: form.title.trim() }); setEditing(false); }}>Save</button>
          {!confirmDelete ? (
            <button className="link" style={{ alignSelf: 'center', color: '#ff9c9c' }} onClick={() => setConfirmDelete(true)}>Delete this goal</button>
          ) : (
            <div className="between" style={{ border: '1px solid #ff9c9c', borderRadius: 16, padding: '6px 6px 6px 14px' }}>
              <span className="t-small" style={{ color: 'var(--ink)' }}>Delete {g.title}? Its dated to-dos stay on your list.</span>
              <button className="link" style={{ color: '#ff9c9c', padding: '0 10px' }} onClick={() => { actions.removeGoal(g.id); nav.back(); }}>Delete</button>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}
