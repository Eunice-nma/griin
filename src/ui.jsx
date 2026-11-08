import { useEffect, useState } from 'react';
import Icon, { BackArrow } from './Icon.jsx';
import { useStore } from './store.js';

const TABS = [
  { id: 'home', label: 'Today', icon: 'lets-icons:home-light', size: 22 },
  { id: 'journal', label: 'Journal', icon: 'fluent:pen-sparkle-24-regular', size: 19 },
  { id: 'insights', label: 'Vibes', icon: 'solar:calendar-linear', size: 20 },
  { id: 'plans', label: 'Plans', icon: 'ph:flag-banner-light', size: 21 },
  { id: 'play', label: 'Play', icon: 'ph:puzzle-piece-light', size: 21 },
];

export function NavBar({ nav, active }) {
  const { navStyle } = useStore();
  const float = navStyle !== 'classic';
  const open = (id) => {
    if (id === active) return;
    if (id === 'journal') return nav.openJournal({ tab: true });
    nav.reset(id);
  };
  return (
    <nav className={'navbar' + (float ? ' float' : '')} aria-label="Main">
      {TABS.map((t) => (
        <button key={t.id} className={'navtab' + (t.id === active ? ' on' : '')} aria-current={t.id === active ? 'page' : undefined} aria-label={t.label} onClick={() => open(t.id)}>
          <span className="dot"><Icon name={t.icon} size={t.size} /></span>
          <span className="lbl">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function TopBar({ onBack, left, right, label = 'Back' }) {
  return (
    <div className="topbar">
      {left ? left : onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label={label}><BackArrow size={26} /></button>
      ) : <span />}
      {right || <span />}
    </div>
  );
}

export function Back({ onClick, top = 44, left = 28, label = 'Back' }) {
  return (
    <button onClick={onClick} aria-label={label} className="icon-btn" style={{ position: 'absolute', top: top - 12, left: left - 10, zIndex: 5 }}>
      <BackArrow size={26} />
    </button>
  );
}

export function Sheet({ title, onClose, children }) {
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="between">
          <h2 className="t-title" style={{ fontSize: 18 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ color: 'var(--purple)', marginRight: -10 }}>
            <Icon name="iconamoon:close-bold" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function useToast() {
  const [t, setT] = useState(null);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT(null), t.undo ? 4500 : 2200);
    return () => clearTimeout(h);
  }, [t]);
  const say = (msg, undo) => setT({ msg, undo, k: Date.now() });
  const el = t ? (
    <div className="toast" role="status" key={t.k}>
      <span>{t.msg}</span>
      {t.undo && <button onClick={() => { t.undo(); setT(null); }} style={{ color: 'var(--green)', fontWeight: 700, minHeight: 28 }}>Undo</button>}
    </div>
  ) : null;
  return [el, say];
}

export function Check({ done, color = 'var(--purple)', size = 18 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: size / 2, border: `1.5px solid ${color}`, background: done ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
      {done && <Icon name="ph:check-bold" size={size - 7} color="#1a1025" />}
    </span>
  );
}
