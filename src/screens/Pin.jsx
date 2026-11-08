import { useState } from 'react';
import { useStore, actions } from '../store.js';
import Icon, { BackArrow } from '../Icon.jsx';
import { TopBar, useToast } from '../ui.jsx';

function FaceId({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9V6a3 3 0 0 1 3-3h3M19 3h3a3 3 0 0 1 3 3v3M25 19v3a3 3 0 0 1-3 3h-3M9 25H6a3 3 0 0 1-3-3v-3" />
      <path d="M10 10.5v2M18 10.5v2M14 10.5v5h-1.5M10.5 19a5 5 0 0 0 7 0" />
    </svg>
  );
}

export default function Pin({ nav, params = {} }) {
  const s = useStore();
  const creating = !s.pin;
  const [entry, setEntry] = useState('');
  const [first, setFirst] = useState(null);
  const [err, setErr] = useState('');
  const [menu, setMenu] = useState(false);
  const [toast, say] = useToast();

  const title = creating ? (first ? 'Confirm PIN' : 'Create PIN') : 'Journal PIN';
  const sub = creating
    ? (first ? 'Enter the same 4 digits again to confirm.' : 'Choose a 4-digit PIN to keep your journal private.')
    : 'Enter PIN to securely access and add new journal entries.';

  const finish = () => {
    nav.unlock();
    const { next, tab, ...rest } = params;
    if (tab) nav.reset('journal', rest);
    else { nav.back(); nav.go('journal', rest); }
  };
  const submit = (value = entry) => {
    if (value.length < 4) return;
    if (creating) {
      if (!first) { setFirst(value); setEntry(''); return; }
      if (value !== first) { setErr('Those PINs didn’t match. Start again.'); setFirst(null); setEntry(''); return; }
      actions.setPin(value);
      return finish();
    }
    if (value !== s.pin) { setErr('Wrong PIN. Try again.'); setEntry(''); return; }
    finish();
  };
  const press = (d) => {
    setErr('');
    if (entry.length >= 4) return;
    const v = entry + d;
    setEntry(v);
    if (v.length === 4 && !creating) setTimeout(() => submit(v), 120);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'face', '0', 'del'];

  return (
    <div className="screen tall">
      <div style={{ position: 'absolute', inset: '0 0 auto', height: 292, border: '1px solid rgba(90,181,105,0.7)', borderTop: 'none', borderRadius: '0 0 40px 40px' }} aria-hidden="true" />
      <div className="page nonav" style={{ gap: 0 }}>
        <TopBar onBack={() => nav.back()} right={!creating && (
          <button className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label="PIN options"><Icon name="solar:menu-dots-bold" size={24} /></button>
        )} />
        {menu && (
          <div className="card" style={{ position: 'absolute', top: 92, right: 20, zIndex: 6, padding: 6, background: 'var(--deep)' }}>
            <button className="t-body" onClick={() => { actions.setPin(null); setMenu(false); setEntry(''); }} style={{ padding: '10px 14px' }}>Set a new PIN</button>
          </div>
        )}

        <div className="row" style={{ gap: 8, marginTop: 16 }}>
          <h1 className="ha" style={{ margin: 0, fontSize: 26, fontWeight: 700, lineHeight: '34px', color: 'var(--ink)' }}>{title}</h1>
          <Icon name="boxicons:sparkle-filled" size={22} color="var(--ink)" />
        </div>
        <p className="t-small" style={{ margin: '6px 0 0', color: 'var(--ink2)' }}>{sub}</p>

        <div role="img" aria-label={`${entry.length} of 4 digits entered`} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 56px)', justifyContent: 'center', gap: 16, marginTop: 28 }}>
          {[0, 1, 2, 3].map((k) => (
            <span key={k} style={{ height: 56, borderRadius: 14, border: `1px solid ${k === entry.length ? '#8fe39c' : 'rgba(90,181,105,0.7)'}`, background: 'rgba(26,16,37,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {k < entry.length && <span style={{ width: 14, height: 14, borderRadius: 7, background: '#fff' }} />}
            </span>
          ))}
        </div>
        <div className="t-cap" role="alert" style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff9c9c' }}>{err}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 68px)', justifyContent: 'center', columnGap: 44, rowGap: 18, marginTop: 30 }}>
          {keys.map((k) => {
            const base = { width: 68, height: 68, borderRadius: 34, border: '1px solid rgba(90,181,105,0.7)', background: 'rgba(57,29,105,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' };
            if (k === 'face') return <button key={k} style={base} aria-label="Unlock with Face ID" onClick={() => say('Face ID will work in the phone app. Use your PIN for now.')}><FaceId /></button>;
            if (k === 'del') return <button key={k} style={base} aria-label="Delete digit" onClick={() => setEntry((e) => e.slice(0, -1))}><BackArrow size={24} /></button>;
            return <button key={k} style={{ ...base, paddingTop: 4 }} className="ha" aria-label={k} onClick={() => press(k)}><span style={{ fontSize: 30, fontWeight: 700 }}>{k}</span></button>;
          })}
        </div>

        <div style={{ flex: 1 }} />
        <button className="btn btn-green" onClick={() => submit()} disabled={entry.length < 4}>{creating && !first ? 'NEXT' : 'OPEN'}</button>
        <p className="t-cap" style={{ margin: '12px 8px 0', textAlign: 'center' }}>
          Your journal stays open until the app is closed or the phone sleeps. You can change this in settings.
        </p>
      </div>
      {toast}
    </div>
  );
}
