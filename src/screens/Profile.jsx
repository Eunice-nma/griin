import { useState } from 'react';
import { useStore, actions } from '../store.js';
import Icon from '../Icon.jsx';
import { TopBar } from '../ui.jsx';

function Row({ icon, label, sub, onClick, color = 'var(--purple)' }) {
  return (
    <button onClick={onClick} style={{ width: '100%', minHeight: 56, borderRadius: 20, border: '1px solid rgba(160,132,232,.5)', background: 'rgba(57,29,105,.35)', display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', textAlign: 'left' }}>
      <span style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}><Icon name={icon} size={18} /></span>
      <span style={{ flex: 1 }}>
        <span className="ha" style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{label}</span>
        {sub && <span className="hm" style={{ display: 'block', fontSize: 11, color: 'var(--purple)', marginTop: 2 }}>{sub}</span>}
      </span>
      <Icon name="ic:round-arrow-back-ios" size={12} color="var(--mid)" style={{ transform: 'rotate(180deg)' }} />
    </button>
  );
}

export default function Profile({ nav }) {
  const s = useStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="screen tall">
      <div className="page nonav scroll" style={{ gap: 0 }}>
        <TopBar onBack={() => nav.back()} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <h1 className="ha" style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>You</h1>
          <Icon name="boxicons:sparkle-filled" size={16} color="var(--ink)" />
        </div>
        <p className="hm" style={{ margin: '6px 0 24px', fontSize: 14, color: 'var(--ink2)' }}>
          {s.notes.length} notes · {s.moods.length} moods · {s.anxiety.length} anxiety check-ins
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row icon="fluent:emoji-smile-slight-24-regular" label="Mood calendar" sub="See your moods month by month" onClick={() => nav.reset('insights')} />
          <Row icon="cuida:heart-rate-outline" label="Anxiety tracker" sub="Levels, triggers and factors" onClick={() => nav.reset('insights', { view: 'anxiety' })} color="var(--orange)" />
          <Row icon="fluent:pen-sparkle-24-regular" label="Journal" sub={nav.unlocked ? 'Unlocked until you close the app' : 'Locked with your PIN'} onClick={() => nav.openJournal({ tab: true })} color="var(--green)" />
          {nav.unlocked && <Row icon="iconamoon:close-bold" label="Lock journal now" onClick={() => nav.lock()} />}
          {s.pin && <Row icon="solar:menu-dots-bold" label="Change journal PIN" sub="You’ll set a new PIN next time you open the journal" onClick={() => { actions.setPin(null); nav.lock(); }} />}
        </div>
        <section style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="t-section">App font</h2>
          <div className="seg" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {[['nunito', 'Nunito', "'Nunito'"], ['figtree', 'Figtree', "'Figtree'"], ['monkey', 'Original', "'Happy Monkey'"]].map(([id, name, fam]) => (
              <button key={id} aria-pressed={(s.font || 'nunito') === id} onClick={() => actions.setFont(id)} style={{ fontFamily: `${fam}, system-ui, sans-serif`, fontSize: 14 }}>{name}</button>
            ))}
          </div>
          <span className="t-cap">Changes the text everywhere. Headings stay the same.</span>
          <h2 className="t-section" style={{ marginTop: 14 }}>Navigation bar</h2>
          <div className="seg" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button aria-pressed={s.navStyle !== 'classic'} onClick={() => actions.setNavStyle('float')}>Floating</button>
            <button aria-pressed={s.navStyle === 'classic'} onClick={() => actions.setNavStyle('classic')}>Classic</button>
          </div>
        </section>
        <div style={{ marginTop: 30 }}>
          {!confirm ? (
            <button onClick={() => setConfirm(true)} className="hm" style={{ fontSize: 12, color: '#ff8a8a', padding: '8px 0' }}>Erase everything on this device</button>
          ) : (
            <div style={{ border: '1px solid #ff8a8a', borderRadius: 20, padding: 16 }}>
              <p className="hm" style={{ margin: 0, fontSize: 12, color: 'var(--ink)' }}>This deletes all notes, moods, tasks and goals saved on this device. It can’t be undone.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => setConfirm(false)} className="hm" style={{ flex: 1, height: 40, borderRadius: 20, border: '1px solid var(--purple)', fontSize: 13 }}>Keep my data</button>
                <button onClick={() => { actions.reset(); nav.lock(); nav.reset('intro'); }} className="hm" style={{ flex: 1, height: 40, borderRadius: 20, background: '#c84a4a', fontSize: 13 }}>Erase</button>
              </div>
            </div>
          )}
        </div>
        <p className="hm" style={{ marginTop: 24, fontSize: 10, color: 'var(--mid)' }}>Everything is saved on this device for now. Accounts and sync come later.</p>
      </div>
    </div>
  );
}
