import { useEffect, useState } from 'react';

const KEY = 'griin-v1';

export const MOODS = [
  { id: 'great', name: 'Great', icon: 'pajamas:smile', color: '#5ab569', homeColor: '#ffce5d',
    desc: 'Happy, Energized, Excited,\nOptimistic', bg: '#6ab36b', face: '#2f6b33', text: '#1f4a22', chip: '#4f9b52' },
  { id: 'calm', name: 'Calm', icon: 'fluent:emoji-smile-slight-24-regular', color: '#a084e8', homeColor: '#5ab569',
    desc: 'Relaxed, at Ease, Peaceful\nor Unbothered', bg: '#2d1753', face: '#a084e8', text: '#ffffff', chip: '#26103e' },
  { id: 'meh', name: 'Meh', icon: 'octicon:smiley-neutral-24', color: '#ffce5d', homeColor: '#6fb7e8',
    desc: 'Neutral, indifferent, bored or\nunmotivated', bg: '#f4c65a', face: '#7d6224', text: '#6b521a', chip: '#c99d3a' },
  { id: 'down', name: 'Down', icon: 'ph:smiley-nervous-light', color: '#fa8235', homeColor: '#a084e8',
    desc: 'Sad, low, lonely, heavy or\nwithdrawn', bg: '#f0a05b', face: '#c4591c', text: '#8a3b0e', chip: '#d27a36' },
  { id: 'terrible', name: 'Terrible', icon: 'hugeicons:angry', color: '#dc5702', homeColor: '#ff4343',
    desc: 'Angry, frustrated, overwhelmed\nor tense', bg: '#ee7a58', face: '#8f3417', text: '#6e240c', chip: '#c85a39' },
];
export const moodById = (id) => MOODS.find((m) => m.id === id);

export const LEVELS = [
  { id: 'severe', name: 'Severe', color: '#ff4343', chip: 'rgba(255,67,67,0.6)', words: ['Panicked', 'shaky', 'Out of control'] },
  { id: 'high', name: 'High', color: '#ff9551', chip: 'rgba(255,149,81,0.6)', words: ['Racing thoughts', 'overwhelmed', 'easily irritated'] },
  { id: 'moderate', name: 'Moderate', color: '#ffce5d', chip: 'rgba(255,206,93,0.6)', words: ['Restless', 'worried', 'hard to focus'] },
  { id: 'mild', name: 'Mild', color: '#a084e8', chip: 'rgba(160,132,232,0.6)', words: ['Uneasy', 'distracted', 'overthinking'] },
  { id: 'none', name: 'None', color: '#5ab569', chip: 'rgba(90,181,105,0.6)', words: ['Calm', 'relaxed', 'At ease'] },
];
export const levelById = (id) => LEVELS.find((l) => l.id === id);

export const DEFAULT_FACTORS = ['Job', 'Fear', 'Uneasy', 'Uncertainty', 'At ease', 'Confrontation', 'Meetings', 'Work', 'Public speaking', 'Walk'];

export const PROMPTS = [
  'What is one thing you are looking forward to today?',
  'Talk about something small you are grateful for in your day',
  'Has there been any unusual or reoccurring thoughts today?',
  'What drained your energy today, and what gave some back?',
  'Write about a moment today you want to remember.',
  'What is one hard thing you did today?',
];

export const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const timeOf = (ts) => {
  const d = new Date(ts);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const promptFor = (key) => {
  const n = key.split('-').reduce((a, b) => a + Number(b), 0);
  return PROMPTS[n % PROMPTS.length];
};

export const addDays = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return d; };
const uid = () => Math.random().toString(36).slice(2, 10);

export const GOAL_COLORS = ['#ffce5d', '#5ab569', '#a084e8', '#ff9551', '#6fb7e8', '#ff6f91'];

function seedPlans() {
  const bali = uid(), launch = uid();
  const T = (text, day, extra = {}, i = 0) => ({ id: uid(), day: dayKey(day), text, time: '', done: false, createdAt: i, ...extra });
  return {
    tasks: [
      T('Call Paul', new Date(), { done: true, doneAt: Date.now() - 3600e3 }, 1),
      T('Make banana smoothie', new Date(), {}, 2),
      T('Meeting with Investor', new Date(), { time: '12:30', goalId: launch }, 3),
      T('Finish slide', new Date(), { goalId: launch }, 4),
      T('Buy hand luggage bag', new Date(), { goalId: bali }, 5),
      T('Gym — leg day', addDays(1), { time: '17:30' }, 6),
      T('Reply to Ada’s email', addDays(-1), { done: true, doneAt: Date.now() - 86400e3 }, 7),
      T('Water the plants', addDays(-1), {}, 8),
    ],
    goals: [
      { id: bali, title: 'Bali Trip', icon: 'material-symbols-light:flight-rounded', color: '#ffce5d', due: 'in 6 weeks', note: 'Two weeks in Ubud and Uluwatu with Ada.',
        steps: [
          { id: uid(), text: 'Book flights', done: true, doneAt: Date.now() - 5 * 86400e3 },
          { id: uid(), text: 'Renew passport', done: true, doneAt: Date.now() - 9 * 86400e3 },
          { id: uid(), text: 'Find a villa in Ubud', done: false },
          { id: uid(), text: 'Get travel insurance', done: false },
        ] },
      { id: launch, title: 'Launch', icon: 'ph:rocket-launch-light', color: '#5ab569', due: 'by March', note: '',
        steps: [
          { id: uid(), text: 'Write the pitch deck', done: true, doneAt: Date.now() - 2 * 86400e3 },
          { id: uid(), text: 'Pick a launch date', done: false },
        ] },
    ],
  };
}

// a goal's to-dos are its own steps plus any dated to-dos tagged with it
export function goalItems(goal, tasks) {
  const steps = goal.steps.map((x) => ({ ...x, kind: 'step' }));
  const dated = tasks.filter((t) => t.goalId === goal.id).map((x) => ({ ...x, kind: 'task' }));
  const all = [...steps, ...dated];
  const done = all.filter((x) => x.done).length;
  return { all, open: all.filter((x) => !x.done), doneItems: all.filter((x) => x.done), done, total: all.length, progress: all.length ? Math.round((done / all.length) * 100) : 0 };
}

// new first; ticked-off ones go to the bottom
export function sortTodos(list) {
  const open = list.filter((t) => !t.done).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const done = list.filter((t) => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  return [...open, ...done];
}

// the first prompt (starting from the day's own) not yet answered that day
export function nextPrompt(notes, key, offset = 0) {
  const answered = new Set(notes.filter((n) => dayKey(n.ts) === key && n.prompt).map((n) => n.prompt));
  const start = PROMPTS.indexOf(promptFor(key)) + offset;
  for (let i = 0; i < PROMPTS.length; i++) {
    const p = PROMPTS[(start + i) % PROMPTS.length];
    if (!answered.has(p)) return p;
  }
  return PROMPTS[start % PROMPTS.length];
}

const fresh = () => ({
  onboarded: false,
  signedIn: false,
  pin: null,
  ...seedPlans(),
  moods: [],    // {id, ts, mood}
  anxiety: [],  // {id, ts, level, factors}
  notes: [],    // {id, ts, text, prompt?}
  factors: DEFAULT_FACTORS,
  reminders: [  // {id, text, at (ISO local), done}
    { id: uid(), text: 'Pay rent', at: soon(2, 9), done: false },
    { id: uid(), text: 'Goal check-in', at: soon(4, 18), done: false },
  ],
  someday: [    // {id, text}
    { id: uid(), text: 'Learn to make sourdough' },
    { id: uid(), text: 'Visit Zanzibar' },
  ],
  font: 'nunito',
  games: seedGames(), // { 'YYYY-MM-DD:easy': {guesses:[], done, won} }
  gamesSeeded: true,
  plansV2: true,
  navStyle: 'float',
});

function seedGames() {
  // example history so the streak tile has something to show
  const g = {};
  [1, 2, 3].forEach((n) => { g[`${dayKey(addDays(-n))}:easy`] = { guesses: ['CALM'], done: true, won: true }; });
  return g;
}

export function gameStreak(games) {
  const days = new Set(Object.entries(games || {}).filter(([, g]) => g.done).map(([k]) => k.split(':')[0]));
  const playedToday = days.has(dayKey());
  let d = playedToday ? new Date() : addDays(-1);
  let streak = 0;
  while (days.has(dayKey(d))) { streak++; d = addDays(-1, d); }
  return { streak, playedToday };
}

function soon(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return localIso(d);
}
export function localIso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.tasks) saved.tasks = saved.tasks.map((x, i) => ({ createdAt: i, ...(x.day ? x : { ...x, day: dayKey(), doneAt: x.done ? Date.now() : undefined }) }));
      if (!saved.plansV2) { Object.assign(saved, seedPlans()); saved.plansV2 = true; }
      if (!saved.gamesSeeded) { saved.games = { ...seedGames(), ...(saved.games || {}) }; saved.gamesSeeded = true; }
      return { ...fresh(), ...saved };
    }
  } catch (e) { /* storage unavailable */ }
  return fresh();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

export function update(fn) {
  state = { ...state, ...fn(state) };
  save();
  listeners.forEach((l) => l(state));
}

export function useStore() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    return () => listeners.delete(setS);
  }, []);
  return s;
}

export const actions = {
  finishOnboarding: () => update(() => ({ onboarded: true, signedIn: true })),
  setPin: (pin) => update(() => ({ pin })),
  toggleTask: (id) => update((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done, doneAt: t.done ? undefined : Date.now() } : t)) })),
  addTask: (text, time, day = dayKey(), goalId) => update((s) => ({ tasks: [...s.tasks, { id: uid(), day, text, time, done: false, createdAt: Date.now(), ...(goalId ? { goalId } : {}) }] })),
  moveTask: (id, day) => update((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, day } : t)) })),
  clearDay: (day) => update((s) => ({ tasks: s.tasks.filter((t) => t.day !== day) })),
  setFont: (font) => update(() => ({ font })),
  setNavStyle: (navStyle) => update(() => ({ navStyle })),
  removeMood: (id) => update((s) => ({ moods: s.moods.filter((m) => m.id !== id) })),
  removeAnxiety: (id) => update((s) => ({ anxiety: s.anxiety.filter((m) => m.id !== id) })),
  removeTask: (id) => update((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  toggleStep: (gid, sid) => update((s) => ({
    goals: s.goals.map((g) => (g.id !== gid ? g : { ...g, steps: g.steps.map((st) => (st.id === sid ? { ...st, done: !st.done, doneAt: st.done ? undefined : Date.now() } : st)) })),
  })),
  addGoal: (title, step, due, color) => update((s) => ({
    goals: [...s.goals, { id: uid(), title, icon: 'ph:flag-banner-light', color: color || GOAL_COLORS[(s.goals.length + 2) % GOAL_COLORS.length], due, note: '',
      steps: step ? [{ id: uid(), text: step, done: false, createdAt: Date.now() }] : [] }],
  })),
  updateGoal: (gid, patch) => update((s) => ({ goals: s.goals.map((g) => (g.id === gid ? { ...g, ...patch } : g)) })),
  removeStep: (gid, sid) => update((s) => ({ goals: s.goals.map((g) => (g.id === gid ? { ...g, steps: g.steps.filter((x) => x.id !== sid) } : g)) })),
  logMood: (mood) => { const id = uid(); update((s) => ({ moods: [...s.moods, { id, ts: Date.now(), mood }] })); return id; },
  logAnxiety: (level, factors) => { const id = uid(); update((s) => ({ anxiety: [...s.anxiety, { id, ts: Date.now(), level, factors }] })); return id; },
  addNote: (text, prompt) => update((s) => ({ notes: [...s.notes, { id: uid(), ts: Date.now(), text, ...(prompt ? { prompt } : {}) }] })),
  addStep: (gid, text) => update((s) => ({
    goals: s.goals.map((g) => (g.id === gid ? { ...g, steps: [...g.steps, { id: uid(), text, done: false, createdAt: Date.now() }] } : g)),
  })),
  removeGoal: (gid) => update((s) => ({ goals: s.goals.filter((g) => g.id !== gid), tasks: s.tasks.map((t) => (t.goalId === gid ? { ...t, goalId: undefined } : t)) })),
  addReminder: (text, at) => update((s) => ({ reminders: [...s.reminders, { id: uid(), text, at, done: false }] })),
  toggleReminder: (id) => update((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)) })),
  removeReminder: (id) => update((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),
  addSomeday: (text) => update((s) => ({ someday: [...s.someday, { id: uid(), text }] })),
  removeSomeday: (id) => update((s) => ({ someday: s.someday.filter((x) => x.id !== id) })),
  saveGame: (key, g) => update((s) => ({ games: { ...s.games, [key]: g } })),
  addFactor: (f) => update((s) => ({ factors: s.factors.includes(f) ? s.factors : [...s.factors, f] })),
  reset: () => update(() => fresh()),
};
