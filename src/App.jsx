import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { useStore } from './store.js';
import Intro from './screens/Intro.jsx';
import Home from './screens/Home.jsx';
import Feel from './screens/Feel.jsx';
import Anxiety from './screens/Anxiety.jsx';
import Pin from './screens/Pin.jsx';
import Journal from './screens/Journal.jsx';
import Insights from './screens/Insights.jsx';
import Plans from './screens/Plans.jsx';
import Play from './screens/Play.jsx';
import Profile from './screens/Profile.jsx';
import Todos from './screens/Todos.jsx';
import Goal from './screens/Goal.jsx';
import Logo from './Logo.jsx';

const W = 393, H = 852;

function useScale() {
  const [s, setS] = useState(1);
  useLayoutEffect(() => {
    const fit = () => setS(Math.min(window.innerWidth / W, window.innerHeight / H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return s;
}

export default function App() {
  const store = useStore();
  const scale = useScale();
  const [stack, setStack] = useState([{ name: store.onboarded ? 'home' : 'intro' }]);
  const [unlocked, setUnlocked] = useState(false);
  const [splash, setSplash] = useState('in'); // in → out → gone
  useEffect(() => {
    if (splash === 'in') { const t = setTimeout(() => setSplash('out'), 3600); return () => clearTimeout(t); }
    if (splash === 'out') { const t = setTimeout(() => setSplash('gone'), 450); return () => clearTimeout(t); }
  }, [splash]);
  const top = stack[stack.length - 1];
  useEffect(() => { document.documentElement.dataset.font = store.font || 'nunito'; }, [store.font]);
  useEffect(() => { document.documentElement.style.setProperty('--nav-h', store.navStyle === 'classic' ? '84px' : '96px'); }, [store.navStyle]);

  const go = useCallback((name, params = {}) => setStack((s) => [...s, { name, params }]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ name: 'home' }])), []);
  const reset = useCallback((name, params = {}) => setStack([{ name, params }]), []);

  // the journal locks again when the app is hidden (phone sleeps / app closed)
  useEffect(() => {
    const onHide = () => { if (document.hidden) setUnlocked(false); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const openJournal = (params = {}) => {
    if (params.tab) return unlocked ? reset('journal', params) : reset('pin', { next: 'journal', ...params });
    return unlocked ? go('journal', params) : go('pin', { next: 'journal', ...params });
  };
  const nav = { go, back, reset, openJournal, unlock: () => setUnlocked(true), lock: () => setUnlocked(false), unlocked, depth: stack.length };
  const p = top.params || {};

  let screen;
  switch (top.name) {
    case 'intro': screen = <Intro nav={nav} />; break;
    case 'feel': screen = <Feel nav={nav} start={p.mood} />; break;
    case 'anxiety': screen = <Anxiety nav={nav} level={p.level} />; break;
    case 'pin': screen = <Pin nav={nav} params={p} />; break;
    case 'journal': screen = <Journal nav={nav} day={p.day} prompt={p.prompt} />; break;
    case 'insights': screen = <Insights nav={nav} view={p.view} />; break;
    case 'plans': screen = <Plans nav={nav} view={p.view} />; break;
    case 'play': screen = <Play nav={nav} view={p.view} />; break;
    case 'profile': screen = <Profile nav={nav} />; break;
    case 'todos': screen = <Todos nav={nav} />; break;
    case 'goal': screen = <Goal nav={nav} id={p.id} />; break;
    default: screen = <Home nav={nav} />;
  }

  return (
    <div className="viewport">
      <div className="stage" style={{ width: W, height: H, transform: `scale(${scale})` }}>
        <div key={stack.length + top.name + JSON.stringify(p)} className="screen-wrap">{screen}</div>
        {splash !== 'gone' && (
          <div className={'splash' + (splash === 'out' ? ' out' : '')} onClick={() => setSplash('out')} aria-label="Skip intro" role="button" tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSplash('out')}>
            <Logo size={96} mode="play" color="#1f4a22" />
          </div>
        )}
      </div>
    </div>
  );
}
