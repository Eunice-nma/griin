import { useMemo, useState } from 'react';
import { useStore, actions, dayKey, addDays, sortTodos } from '../store.js';
import Composer, { GoalDot } from '../Composer.jsx';
import Icon from '../Icon.jsx';
import { TopBar, Sheet, Check } from '../ui.jsx';

const parse = (k) => new Date(k + 'T12:00:00');
const mondayOf = (k) => { const d = parse(k); return addDays(-((d.getDay() + 6) % 7), d); };

function dayTitle(k) {
  const diff = Math.round((parse(k) - parse(dayKey())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return parse(k).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function Todos({ nav }) {
  const s = useStore();
  const today = dayKey();
  const [sel, setSel] = useState(today);
  const [confirmClear, setConfirmClear] = useState(false);
  const [calendar, setCalendar] = useState(false);

  const byDay = useMemo(() => {
    const m = {};
    s.tasks.forEach((t) => { (m[t.day] ||= []).push(t); });
    return m;
  }, [s.tasks]);

  const week = Array.from({ length: 7 }, (_, i) => dayKey(addDays(i, mondayOf(sel))));
  const list = byDay[sel] || [];
  const sorted = sortTodos(list);
  const done = list.filter((t) => t.done);
  const isPast = sel < today;
  const pick = (k) => { setSel(k); setConfirmClear(false); };
  const monthLabel = parse(week[3]).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="screen tall">
      <div className="page nonav" style={{ gap: 16, paddingBottom: 0 }}>
        <TopBar onBack={() => nav.back()} right={
          <button onClick={() => setCalendar(true)} className="row" aria-label="Open calendar"
            style={{ gap: 8, height: 36, padding: '0 14px', borderRadius: 18, border: '1px solid var(--mid)', background: 'rgba(34,13,71,0.55)', color: '#fff' }}>
            <Icon name="solar:calendar-linear" size={16} color="var(--purple)" />
            <span className="t-small" style={{ color: '#fff' }}>{monthLabel}</span>
          </button>
        } />

        <div className="between">
          <h1 className="t-display">To-do</h1>
          {sel !== today && <button className="link" onClick={() => pick(today)}>Back to today</button>}
        </div>

        {/* week strip */}
        <div className="row" style={{ gap: 4, margin: '0 -10px' }}>
          <button className="icon-btn" style={{ width: 28 }} onClick={() => pick(dayKey(addDays(-7, parse(sel))))} aria-label="Previous week"><Icon name="ic:round-arrow-back-ios" size={14} color="var(--muted)" /></button>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
            {week.map((k) => {
              const d = parse(k);
              const ts = byDay[k] || [];
              const pending = ts.some((t) => !t.done);
              const on = k === sel;
              return (
                <button key={k} onClick={() => pick(k)} aria-pressed={on} aria-label={`${dayTitle(k)}, ${ts.length} to-dos`}
                  className="stack" style={{ alignItems: 'center', gap: 2, padding: '8px 0 6px', borderRadius: 16, background: on ? 'var(--active)' : 'transparent', border: `1px solid ${on ? 'var(--active)' : k === today ? 'var(--green)' : 'transparent'}` }}>
                  <span className="t-cap" style={{ color: on ? '#fff' : 'var(--muted)' }}>{d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2)}</span>
                  <span className="ha" style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{d.getDate()}</span>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: ts.length ? (pending ? (on ? '#fff' : 'var(--purple)') : 'var(--green)') : 'transparent' }} />
                </button>
              );
            })}
          </div>
          <button className="icon-btn" style={{ width: 28 }} onClick={() => pick(dayKey(addDays(7, parse(sel))))} aria-label="Next week"><Icon name="ic:round-arrow-back-ios" size={14} color="var(--muted)" style={{ transform: 'rotate(180deg)' }} /></button>
        </div>

        {/* the day */}
        <div className="between" style={{ marginTop: 4 }}>
          <div className="stack" style={{ gap: 2 }}>
            <h2 className="t-title" style={{ fontSize: 18 }}>{dayTitle(sel)}</h2>
            <span className="t-cap">{list.length ? `${done.length} of ${list.length} done` : 'Nothing planned'}</span>
          </div>
          {list.length > 0 && !confirmClear && <button className="link" style={{ color: 'var(--muted)' }} onClick={() => setConfirmClear(true)}>Clear all</button>}
        </div>
        {confirmClear && (
          <div className="between" style={{ border: '1px solid #ff9c9c', borderRadius: 16, padding: '8px 8px 8px 14px', marginTop: -6 }}>
            <span className="t-small" style={{ color: 'var(--ink)' }}>Delete all {list.length} to-dos for {dayTitle(sel).toLowerCase() === 'today' ? 'today' : 'this day'}?</span>
            <div className="row" style={{ gap: 4 }}>
              <button className="link" style={{ padding: '0 8px' }} onClick={() => setConfirmClear(false)}>Keep</button>
              <button className="link" style={{ padding: '0 8px', color: '#ff9c9c' }} onClick={() => { actions.clearDay(sel); setConfirmClear(false); }}>Delete</button>
            </div>
          </div>
        )}

        <div className="scroll stack" style={{ flex: 1, gap: 0, margin: '0 -4px', padding: `0 4px ${isPast ? 16 : 130}px` }}>
          {list.length === 0 && <p className="t-small" style={{ textAlign: 'center', marginTop: 32 }}>{isPast ? 'No to-dos on this day.' : 'Add something for this day below.'}</p>}
          {sorted.map((t, i) => (
            <div key={t.id} className="row" style={{ gap: 4, minHeight: 52, borderTop: i ? '1px solid rgba(160,132,232,.15)' : 'none' }}>
              <button onClick={() => actions.toggleTask(t.id)} aria-pressed={t.done} className="row" style={{ flex: 1, minWidth: 0, gap: 12, minHeight: 48, textAlign: 'left' }}>
                <Check done={t.done} />
                <span className="stack" style={{ minWidth: 0 }}>
                  <span className="t-body" style={{ fontSize: 16, color: t.done ? 'var(--mid)' : 'var(--ink2)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                  {t.time && <span className="t-cap">{t.time}</span>}
                </span>
              </button>
              <GoalDot goal={s.goals.find((g) => g.id === t.goalId)} size={10} />
              {isPast && !t.done && <button className="link" onClick={() => actions.moveTask(t.id, today)}>Move to today</button>}
              <button className="icon-btn" onClick={() => actions.removeTask(t.id)} aria-label={`Delete ${t.text}`} style={{ width: 36, height: 36, color: 'var(--muted)' }}>
                <Icon name="iconamoon:close-bold" size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* add for the selected day */}
      {!isPast && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px var(--pad) 20px', background: 'linear-gradient(180deg, rgba(42,21,78,0), rgba(42,21,78,.97) 18%)' }}>
          <Composer day={sel} compact />
        </div>
      )}

      {calendar && <MonthSheet sel={sel} byDay={byDay} onClose={() => setCalendar(false)} onPick={(k) => { pick(k); setCalendar(false); }} />}
    </div>
  );
}

function MonthSheet({ sel, byDay, onPick, onClose }) {
  const [ym, setYm] = useState(() => { const d = parse(sel); return [d.getFullYear(), d.getMonth()]; });
  const [y, m] = ym;
  const shift = (n) => { const d = new Date(y, m + n, 1); setYm([d.getFullYear(), d.getMonth()]); };
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const today = dayKey();
  return (
    <Sheet title={new Date(y, m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} onClose={onClose}>
      <div className="between" style={{ marginTop: -8 }}>
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><Icon name="ic:round-arrow-back-ios" size={16} /></button>
        <span className="t-cap">Pick a day to see or plan its to-dos</span>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="Next month"><Icon name="ic:round-arrow-back-ios" size={16} style={{ transform: 'rotate(180deg)' }} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', rowGap: 6 }}>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((w) => <span key={w} className="t-cap" style={{ textAlign: 'center' }}>{w}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={'e' + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const k = dayKey(new Date(y, m, i + 1));
          const ts = byDay[k] || [];
          const on = k === sel;
          return (
            <button key={k} onClick={() => onPick(k)} aria-pressed={on} aria-label={`${i + 1}, ${ts.length} to-dos`}
              className="stack" style={{ alignItems: 'center', gap: 2, height: 44, justifyContent: 'center', borderRadius: 14, background: on ? 'var(--active)' : 'transparent', border: k === today && !on ? '1px solid var(--green)' : '1px solid transparent' }}>
              <span className="ha" style={{ fontSize: 14, fontWeight: 600 }}>{i + 1}</span>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: ts.length ? (ts.some((t) => !t.done) ? (on ? '#fff' : 'var(--purple)') : 'var(--green)') : 'transparent' }} />
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
