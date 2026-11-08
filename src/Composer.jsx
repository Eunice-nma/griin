import { useState } from 'react';
import { useStore, actions } from './store.js';
import Icon from './Icon.jsx';

// Add a to-do: the text, which goal it belongs to (colour-coded), and a time only if asked for.
export default function Composer({ day, defaultGoal, onAdded, autoFocus, compact }) {
  const s = useStore();
  const [text, setText] = useState('');
  const [goalId, setGoalId] = useState(defaultGoal || null);
  const [showTime, setShowTime] = useState(false);
  const [time, setTime] = useState('');

  const add = () => {
    if (!text.trim()) return;
    actions.addTask(text.trim(), showTime ? time : '', day, goalId || undefined);
    setText(''); setTime(''); setShowTime(false);
    onAdded?.();
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); add(); }} className="stack" style={{ gap: 10 }}>
      <div className="row" style={{ gap: 8 }}>
        <label htmlFor="todo-text" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>New to-do</label>
        <input id="todo-text" className="field" autoFocus={autoFocus} value={text} onChange={(e) => setText(e.target.value)} placeholder="What needs doing?" style={{ flex: 1, minWidth: 0 }} />
        <button type="submit" className="icon-btn" disabled={!text.trim()} aria-label="Add to-do" style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--green)', opacity: text.trim() ? 1 : 0.45 }}>
          <Icon name="ph:plus-bold" size={18} />
        </button>
      </div>
      <div className="row hscroll" style={{ gap: 8, margin: '0 -2px', padding: '0 2px' }} role="group" aria-label="Goal">
        <button type="button" onClick={() => setShowTime((v) => !v)} aria-pressed={showTime} aria-label={showTime ? 'Remove time' : 'Add a time'} className="chip"
          style={{ gap: 6, flexShrink: 0, border: `1px solid ${showTime ? 'var(--purple)' : 'var(--line)'}`, background: showTime ? 'rgba(160,132,232,.2)' : 'transparent', color: 'var(--ink2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {showTime ? 'Time' : 'Add time'}
        </button>
        {showTime && <input id="todo-time" className="field" type="time" aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: 112, height: 32, borderRadius: 16, padding: '0 10px', fontSize: 13, flexShrink: 0 }} />}
        {!compact && <span aria-hidden="true" style={{ width: 1, height: 20, background: 'var(--line)', flexShrink: 0 }} />}
        <button type="button" onClick={() => setGoalId(null)} aria-pressed={!goalId} className="chip"
          style={{ flexShrink: 0, border: `1px solid ${!goalId ? 'var(--ink2)' : 'var(--line)'}`, color: 'var(--ink2)' }}>No goal</button>
        {s.goals.map((g) => (
          <button type="button" key={g.id} onClick={() => setGoalId(g.id)} aria-pressed={goalId === g.id} className="chip"
            style={{ gap: 6, flexShrink: 0, border: `1px solid ${goalId === g.id ? g.color : 'var(--line)'}`, background: goalId === g.id ? `${g.color}26` : 'transparent', color: 'var(--ink2)' }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: g.color }} />{g.title}
          </button>
        ))}
      </div>
    </form>
  );
}

export function GoalDot({ goal, size = 9 }) {
  if (!goal) return null;
  return <span title={goal.title} aria-label={`Goal: ${goal.title}`} style={{ width: size, height: size, borderRadius: size, background: goal.color, flexShrink: 0 }} />;
}
