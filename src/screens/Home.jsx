import { useState } from 'react';
import { useStore, actions, MOODS, moodById, levelById, nextPrompt, dayKey, timeOf, gameStreak, sortTodos } from '../store.js';
import Composer, { GoalDot } from '../Composer.jsx';
import Icon from '../Icon.jsx';
import { NavBar, Sheet, Check, useToast } from '../ui.jsx';
import QuickAnxiety, { colorAt, valueOf } from '../QuickAnxiety.jsx';

export const prettyDate = (d = new Date()) =>
  `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${d.getDate()}, ${d.toLocaleDateString('en-GB', { month: 'long' })}`;

export const whenText = (iso) => {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day - today) / 86400000);
  const t = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
  if (diff === 0) return `Today ${t}`;
  if (diff === 1) return `Tomorrow ${t}`;
  if (diff > 1 && diff < 7) return `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${t}`;
  return `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })} ${t}`;
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// Up to 4 of today's to-dos: the one most recently ticked off, then the open ones in order.
export function homeTasks(tasks, today) {
  const todays = tasks.filter((t) => t.day === today);
  const sorted = sortTodos(todays);
  const open = sorted.filter((t) => !t.done);
  const lastDone = sorted.find((t) => t.done);
  return { shown: [...open.slice(0, lastDone ? 3 : 4), ...(lastDone ? [lastDone] : [])], open: open.length, total: todays.length, lastDone };
}

const tile = { borderRadius: 22, border: '1px solid var(--line)', background: 'rgba(26,16,37,.45)', padding: '12px 14px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4 };

export default function Home({ nav }) {
  const s = useStore();
  const [adding, setAdding] = useState(false);
  const [quick, setQuick] = useState(false);
  const [text, setText] = useState('');
  const [time, setTime] = useState('');
  const [toast, say] = useToast();

  const today = dayKey();
  const todayMood = [...s.moods].reverse().find((m) => dayKey(m.ts) === today);
  const mood = todayMood && moodById(todayMood.mood);
  const todayAnx = [...s.anxiety].reverse().find((a) => dayKey(a.ts) === today);
  const anx = todayAnx && levelById(todayAnx.level);
  const { shown, open, lastDone } = homeTasks(s.tasks, today);
  const hidden = open - (shown.length - (lastDone ? 1 : 0));
  const { streak, playedToday } = gameStreak(s.games);
  const nextReminder = s.reminders.filter((r) => !r.done && new Date(r.at) >= new Date(Date.now() - 3600e3)).sort((a, b) => a.at.localeCompare(b.at))[0];

  const pickMood = (m) => { actions.logMood(m.id); say(`Feeling ${m.name} logged`); };
  const saveAnx = (level) => { const id = actions.logAnxiety(level, []); setQuick(false); say(`Anxiety: ${levelById(level).name}`, () => actions.removeAnxiety(id)); };
  const close = () => { setAdding(false); setText(''); setTime(''); };

  return (
    <div className="screen">
      <div className="page scroll" style={{ gap: 14, paddingTop: 50, paddingBottom: 16 }}>
        {/* greeting */}
        <header className="between" style={{ alignItems: 'flex-start', gap: 4, marginBottom: 4 }}>
          <div className="stack" style={{ gap: 2 }}>
            <div className="row" style={{ gap: 6 }}>
              <h1 className="t-display" style={{ whiteSpace: 'nowrap' }}>{greeting()}</h1>
              <Icon name="boxicons:sparkle-filled" size={14} color="var(--ink)" />
            </div>
            <span className="t-small" style={{ color: 'var(--ink2)', fontSize: 14 }}>Do the hard thing</span>
          </div>
          <div className="row" style={{ gap: 6, flexShrink: 0 }}>
            <span className="t-small" style={{ color: 'var(--ink2)', whiteSpace: 'nowrap' }}>{prettyDate()}</span>
            <button className="icon-btn" onClick={() => nav.go('profile')} aria-label="Profile and settings" style={{ width: 40, height: 40, background: 'rgba(57,29,105,.7)', marginRight: -2 }}>
              <Icon name="fluent:person-32-regular" size={17} />
            </button>
          </div>
        </header>

        {/* up next today: no border, blends into the top of the screen */}
        <section className="stack" style={{ gap: 0, borderRadius: 24, background: 'linear-gradient(180deg, rgba(57,29,105,0) 0%, rgba(57,29,105,.38) 100%)', padding: '4px 14px 10px', margin: '0 -14px' }}>
          <div className="between" style={{ marginBottom: 2 }}>
            <h2 className="ha" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--purple)' }}>Up Next Today</h2>
            <div className="row" style={{ gap: 6, marginRight: -4 }}>
              <button className="icon-btn" onClick={() => setAdding(true)} aria-label="Add a to-do" style={{ width: 34, height: 34, border: '1px solid var(--line)', color: 'var(--purple)' }}>
                <Icon name="ph:plus-bold" size={13} />
              </button>
              <button className="icon-btn" onClick={() => nav.go('todos')} aria-label="Open all to-dos" style={{ width: 34, height: 34, border: '1px solid var(--line)', color: 'var(--purple)' }}>
                <Icon name="ph:list-checks-light" size={17} />
              </button>
            </div>
          </div>
          {shown.length === 0 && <p className="t-small" style={{ margin: '8px 0 10px' }}>Nothing planned for today. Tap + to add a to-do.</p>}
          {shown.map((t) => (
            <button key={t.id} onClick={() => actions.toggleTask(t.id)} aria-pressed={t.done} className="row" style={{ width: '100%', gap: 12, minHeight: 42, textAlign: 'left' }}>
              <Check done={t.done} />
              <span className="t-body" style={{ flex: 1, color: t.done ? 'var(--mid)' : 'var(--ink2)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
              {t.time && <span className="t-cap">{t.time}</span>}
              <GoalDot goal={s.goals.find((g) => g.id === t.goalId)} />
            </button>
          ))}
          {hidden > 0 && <button className="link" onClick={() => nav.go('todos')} style={{ alignSelf: 'flex-start', marginLeft: 30, minHeight: 28 }}>+{hidden} more</button>}
        </section>

        {/* check-in: mood + anxiety */}
        <section aria-label="Check in" style={{ borderRadius: 24, border: '1px solid var(--line)', background: 'rgba(26,16,37,.45)', padding: '12px 14px 14px' }}>
          <div className="between" style={{ marginBottom: 10 }}>
            <span className="t-cap" style={{ letterSpacing: '.05em', textTransform: 'uppercase' }}>{mood ? 'Today you’re feeling' : 'How are you feeling?'}</span>
            <span className="t-cap" style={{ letterSpacing: '.05em', textTransform: 'uppercase' }}>Anxiety</span>
          </div>
          <div className="row" style={{ gap: 12 }}>
            {!mood ? (
              <div className="row" style={{ flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
                {MOODS.map((m) => (
                  <button key={m.id} onClick={() => pickMood(m)} aria-label={`I feel ${m.name}`} className="circle" style={{ width: 44, height: 44, borderRadius: 22 }}>
                    <Icon name={m.icon} size={21} color={m.color} />
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => nav.go('feel', { mood: mood.id })} aria-label={`Feeling ${mood.name} since ${timeOf(todayMood.ts)}. Change mood`}
                className="row" style={{ flex: 1, minWidth: 0, gap: 12, height: 48, padding: '0 16px 0 6px', borderRadius: 24, border: `1px solid ${mood.color}`, background: 'rgba(26,16,37,.5)' }}>
                <span className="circle" style={{ width: 36, height: 36, border: 'none', background: 'rgba(57,29,105,.9)' }}><Icon name={mood.icon} size={20} color={mood.color} /></span>
                <span className="ha" style={{ flex: 1, textAlign: 'left', fontSize: 16, fontWeight: 600, color: '#fff' }}>{mood.name}</span>
                <span className="t-cap">{timeOf(todayMood.ts)} · Change</span>
              </button>
            )}
            <span aria-hidden="true" style={{ width: 1, height: 36, background: 'var(--line)' }} />
            <button onClick={() => setQuick(true)} aria-label={anx ? `Anxiety ${anx.name}. Update` : 'Log anxiety'}
              style={{ position: 'relative', width: 34, height: 48, borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,.1)', flexShrink: 0 }}>
              {anx && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${12 + valueOf(anx.id) * 88}%`, background: colorAt(valueOf(anx.id)) }} />}
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6, color: anx ? 'rgba(20,10,30,.8)' : 'var(--ink2)' }}>
                <Icon name="cuida:heart-rate-outline" size={16} />
              </span>
            </button>
          </div>
        </section>

        {/* journal prompt */}
        <section className="row" style={{ gap: 14, borderRadius: 24, border: '1px solid rgba(90,181,105,.5)', background: 'rgba(26,16,37,.45)', padding: '14px 14px 14px 16px' }}>
          <div className="stack" style={{ flex: 1, gap: 4 }}>
            <span className="row" style={{ gap: 6 }}>
              <span className="ha" style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>Journal Prompt</span>
              <Icon name="boxicons:sparkle-filled" size={12} color="var(--green)" />
            </span>
            <span className="t-body" style={{ color: 'var(--ink)' }}>{nextPrompt(s.notes, today)}</span>
            <button className="link" onClick={() => nav.openJournal()} style={{ alignSelf: 'flex-start', color: 'var(--muted)', minHeight: 28 }}>or write freely</button>
          </div>
          <button className="icon-btn" onClick={() => nav.openJournal({ prompt: true })} aria-label="Answer the prompt" style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--green)', color: '#fff' }}>
            <Icon name="system-uicons:write" size={20} />
          </button>
        </section>

        {/* thin solid check-in strip */}
        {nextReminder && (
          <button onClick={() => nav.reset('plans', { view: 'reminders' })} className="row" style={{ gap: 10, background: 'var(--yellow)', color: '#2a2205', borderRadius: 14, padding: '10px 14px', textAlign: 'left' }}>
            <Icon name="ph:bell-simple-light" size={18} />
            <span className="t-body" style={{ flex: 1, fontWeight: 600 }}>{nextReminder.text}</span>
            <span className="t-small" style={{ color: '#4a3a10' }}>{whenText(nextReminder.at)}</span>
          </button>
        )}

        {/* game streak, last */}
        <button onClick={() => nav.reset('play')} className="row" style={{ gap: 12, borderRadius: 18, border: `1px solid ${playedToday ? 'var(--line)' : 'rgba(255,149,81,.7)'}`, background: 'rgba(26,16,37,.45)', padding: '10px 10px 10px 14px', textAlign: 'left' }}>
          <Icon name="ph:fire-fill" size={22} color={streak ? 'var(--orange)' : 'var(--mid)'} />
          <span className="stack" style={{ flex: 1, gap: 0 }}>
            <span className="ha" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{streak ? `${streak}-day streak` : 'No streak yet'}</span>
            <span className="t-cap" style={{ color: playedToday ? 'var(--green)' : 'var(--muted)' }}>{playedToday ? 'Played today. See you tomorrow.' : streak ? 'Play today’s word to keep it going' : 'Play today’s word to start one'}</span>
          </span>
          {!playedToday && <span className="hm" style={{ height: 34, padding: '0 14px', borderRadius: 17, background: 'var(--orange)', color: '#2a1205', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center' }}>Play</span>}
        </button>
      </div>

      <NavBar nav={nav} active="home" />
      {toast}

      {quick && (
        <QuickAnxiety start={anx ? valueOf(anx.id) : 0.25} onClose={() => setQuick(false)} onSave={saveAnx}
          onMore={(level) => { setQuick(false); nav.go('anxiety', { level }); }}
          onBreathe={(level) => { actions.logAnxiety(level, []); setQuick(false); nav.reset('play', { view: 'breathe' }); }} />
      )}

      {adding && (
        <Sheet title="Add to today" onClose={close}>
          <Composer day={today} autoFocus onAdded={close} />
          <button className="link" style={{ alignSelf: 'center' }} onClick={() => { close(); nav.go('todos'); }}>Plan for another day instead</button>
        </Sheet>
      )}
    </div>
  );
}
