// Griin: the parts that talk to the phone and the cloud.
// Face ID (a passkey on this device), voice to text, encrypted sync with Supabase, and push reminders.
// Everything here is optional: if a feature isn't available, the app keeps working as before.
import { createClient } from '@supabase/supabase-js'
import config from './config.js'

// .env.local values win if present; otherwise the public values in src/config.js are used
const SB_URL = import.meta.env.VITE_SUPABASE_URL || config.supabaseUrl
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || config.supabaseKey
const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY || config.vapidPublicKey
const sb = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } }) : null

const $ = (id) => document.getElementById(id)
const say = (m) => window.toast && window.toast(m)
const enc = new TextEncoder()
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const urlB64 = (s) => unb64((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
  del: (k) => { try { localStorage.removeItem(k) } catch { /* private mode */ } },
}

/* ---------------- Face ID ---------------- */
const CRED = 'griin-passkey'
const canPasskey = () => !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext)

async function faceToggle(on) {
  if (!on) { store.del(CRED); return true }
  if (!canPasskey()) { say('Face ID needs Griin on its https link'); return false }
  try {
    // called straight away (no await first) so Safari still counts it as part of your tap
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'Griin', id: location.hostname },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'Griin journal', displayName: 'Griin journal' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        attestation: 'none',
        timeout: 60000,
      },
    })
    store.set(CRED, b64(cred.rawId))
    return true
  } catch {
    say('Face ID wasn’t set up')
    return false
  }
}

// returns 'ok' | 'none' (not set up) | 'fail' | 'quiet' (silent attempt didn't go through)
async function faceUnlock(asked) {
  const id = store.get(CRED)
  if (!id || !canPasskey()) return 'none'
  try {
    await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: location.hostname,
        allowCredentials: [{ type: 'public-key', id: unb64(id), transports: ['internal', 'hybrid'] }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return 'ok'
  } catch {
    return asked ? 'fail' : 'quiet'
  }
}

/* ---------------- Voice to text ---------------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition
let rec = null, recorder = null, listening = false

function micUI(on) {
  listening = on
  $('edMic')?.classList.toggle('on', on)
  const l = $('listen'); if (l) l.hidden = !on
  const mp = $('moodPick'); if (on && mp) mp.hidden = true
}
function writeInto(base, text) {
  const t = $('edText'); if (!t) return
  t.value = base + text
  t.dispatchEvent(new Event('input', { bubbles: true }))
  t.scrollTop = t.scrollHeight
}

function voiceStart() {
  const t = $('edText'); if (!t) return
  const base = t.value ? t.value.replace(/\s*$/, ' ') : ''
  micUI(true)
  if (SR) {
    try {
      rec = new SR()
      rec.lang = navigator.language || 'en-GB'
      rec.continuous = true
      rec.interimResults = true
      let done = ''
      rec.onresult = (e) => {
        let live = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]
          if (r.isFinal) done += r[0].transcript + ' '
          else live += r[0].transcript
        }
        writeInto(base, done + live)
      }
      rec.onerror = (e) => {
        rec = null
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') recordAndSend(base)
        else { micUI(false); if (e.error !== 'no-speech' && e.error !== 'aborted') say('Voice stopped') }
      }
      rec.onend = () => { if (rec) { rec = null; micUI(false) } }
      rec.start()
      return
    } catch { rec = null }
  }
  recordAndSend(base)
}

// Fallback for Home Screen apps on iPhone: record, then let the server write it down.
async function recordAndSend(base) {
  const session = sb && (await sb.auth.getSession()).data.session
  if (!session) { micUI(false); say('Voice needs Sync & backup turned on'); return }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const type = window.MediaRecorder && MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm'
    const chunks = []
    recorder = new MediaRecorder(stream, { mimeType: type })
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      recorder = null
      micUI(false)
      say('Writing it down…')
      try {
        const form = new FormData()
        form.append('file', new Blob(chunks, { type }), type === 'audio/mp4' ? 'voice.m4a' : 'voice.webm')
        const r = await fetch(`${SB_URL}/functions/v1/transcribe`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: form })
        const j = await r.json()
        if (j.text) writeInto(base, j.text.trim()); else say('Couldn’t catch that')
      } catch { say('Couldn’t reach the voice service') }
    }
    recorder.start()
  } catch {
    micUI(false)
    say('Microphone access is off')
  }
}

function voiceStop() {
  if (rec) { const r = rec; rec = null; try { r.stop() } catch { /* already stopped */ } }
  if (recorder) { try { recorder.stop() } catch { /* already stopped */ } return }
  micUI(false)
}

/* ---------------- Sync (end-to-end encrypted) ---------------- */
const STATE = 'griin-v2', KEY = 'griin-ek', LAST = 'griin-lastsync'
let user = null, aesKey = null, pushT = null, busy = false

async function deriveKey(password, uid) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('griin:' + uid), iterations: 210000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}
async function keepKey(k) { store.set(KEY, b64(await crypto.subtle.exportKey('raw', k))) }
async function loadKey() {
  const raw = store.get(KEY)
  return raw ? crypto.subtle.importKey('raw', unb64(raw), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']) : null
}
async function seal(obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, enc.encode(JSON.stringify(obj)))
  return { v: 1, iv: b64(iv), ct: b64(ct) }
}
async function open(box) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, aesKey, unb64(box.ct))
  return JSON.parse(new TextDecoder().decode(pt))
}
const localState = () => { try { return JSON.parse(store.get(STATE) || 'null') } catch { return null } }
const freshState = () => (window.griinGetState ? window.griinGetState() : localState())

// preferCloud: on first sign-in on a phone, the cloud copy wins so a new phone never overwrites your journal
async function pull(preferCloud = false) {
  if (!user || !aesKey || busy) return
  busy = true
  try {
    const { data, error } = await sb.from('griin_state').select('data').eq('user_id', user.id).maybeSingle()
    if (error) throw error
    if (!data) { busy = false; return push() }
    let remote
    try { remote = await open(data.data) } catch { syncErr('This phone has an old key. Sign out and sign in again.'); return }
    const local = localState()
    if (preferCloud || !local || (remote.savedAt || 0) > (local.savedAt || 0)) {
      store.set(STATE, JSON.stringify(remote))
      if (window.griinApplyState) window.griinApplyState(remote)
    } else if ((local.savedAt || 0) > (remote.savedAt || 0)) {
      busy = false
      return push()
    }
    stamp()
  } catch { /* offline: try again later */ } finally { busy = false }
}

async function push() {
  if (!user || !aesKey) return
  const st = freshState(); if (!st) return
  store.set(STATE, JSON.stringify(st))
  try {
    const { error } = await sb.from('griin_state').upsert({ user_id: user.id, data: await seal(st), updated_at: new Date().toISOString() })
    if (error) throw error
    stamp()
    await syncReminders(st)
  } catch { /* offline: the next change or reopen will retry */ }
}
function changed() { if (!user || !aesKey) return; clearTimeout(pushT); pushT = setTimeout(push, 1500) }
function stamp() { store.set(LAST, String(Date.now())); drawSync() }

function ago() {
  const t = +store.get(LAST); if (!t) return 'Not synced yet'
  const m = Math.round((Date.now() - t) / 60000)
  return m < 1 ? 'Synced just now' : m < 60 ? `Synced ${m} min ago` : `Synced ${Math.round(m / 60)} h ago`
}
function syncErr(m) { const e = $('syncErr'); if (e) { e.textContent = m; e.hidden = !m } }
function drawSync() {
  const sub = $('syncSub')
  if (sub) sub.textContent = user && aesKey ? `${user.email} · ${ago().toLowerCase()}` : 'Keep your journal safe on any device'
  const form = $('syncForm'), box = $('syncBox'); if (!form || !box) return
  const hint = $('syncHint')
  if (!sb) {
    hint.textContent = 'Sync isn’t connected yet. Add your Supabase keys to turn it on.'
    form.querySelectorAll('input,button').forEach((x) => (x.disabled = true)); box.hidden = true; form.hidden = false
    return
  }
  const on = !!(user && aesKey)
  form.hidden = on; box.hidden = !on
  if (on) { $('syncWho').textContent = user.email; $('syncWhen').textContent = ago() }
  else {
    hint.textContent = user
      ? 'Enter your password to unlock your journal on this phone.'
      : 'Sign in to back up your journal and use it on any device. Everything is encrypted on your phone with your password before it’s saved.'
    if (user) $('syncEmail').value = user.email
    $('syncUp').hidden = !!user
  }
}

async function signIn(create) {
  const email = $('syncEmail').value.trim(), password = $('syncPass').value
  syncErr('')
  if (!email || password.length < 8) { syncErr('Use your email and a password of at least 8 characters.'); return }
  const btn = create ? $('syncUp') : $('syncIn'); btn.disabled = true
  try {
    const res = create ? await sb.auth.signUp({ email, password }) : await sb.auth.signInWithPassword({ email, password })
    if (res.error) throw res.error
    if (!res.data.session) { syncErr('Check your email to confirm your account, then sign in here.'); return }
    user = res.data.user
    aesKey = await deriveKey(password, user.id)
    await keepKey(aesKey)
    $('syncPass').value = ''
    await pull(!create)
    drawSync()
    say(create ? 'Account created · journal backed up' : 'Signed in · journal synced')
  } catch (e) {
    syncErr(e.message || 'Couldn’t sign in')
  } finally { btn.disabled = false }
}

async function signOut() {
  if (sb) await sb.auth.signOut()
  user = null; aesKey = null
  store.del(KEY); store.del(LAST)
  drawSync(); say('Signed out · your journal stays on this phone')
}

/* ---------------- Reminders (web push) ---------------- */
let lastRem = ''
async function enableReminders() {
  if (!sb || !VAPID) return 'Reminders aren’t connected yet'
  if (!user || !aesKey) return 'Sign in under Sync & backup first'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
    return 'On iPhone, open Griin from your Home Screen to get reminders'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'Notifications are off for Griin'
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(VAPID) }))
    const { error } = await sb.from('push_subscriptions').upsert({ endpoint: sub.endpoint, user_id: user.id, subscription: sub.toJSON() })
    if (error) throw error
    lastRem = ''
    setTimeout(push, 300)
    return 'ok'
  } catch { return 'Couldn’t turn on reminders' }
}

function at(hhmm, dayOffset = 0) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0)
  return d
}
function nextDaily(hhmm) { const d = at(hhmm); return d > new Date() ? d : at(hhmm, 1) }

async function syncReminders(st) {
  const p = st.prefs || {}
  const list = []
  if (p.morning) list.push({ kind: 'morning', title: 'Good morning ☀️', body: 'Today’s prompt is waiting for you.', fire_at: nextDaily('08:00'), repeat: 'daily' })
  if (p.evening) list.push({ kind: 'evening', title: 'How did today feel?', body: 'Take a minute to check in.', fire_at: nextDaily('21:00'), repeat: 'daily' })
  if (p.todos) for (const t of st.todos || []) {
    if (t.done || !t.time || !/^\d{1,2}:\d{2}$/.test(t.time)) continue
    const when = at(t.time); if (when <= new Date()) continue
    list.push({ kind: 'todo', title: t.t, body: `${t.time}${t.g ? ' · ' + t.g : ''}`, fire_at: when, repeat: null })
  }
  const sig = JSON.stringify(list.map((r) => [r.kind, r.title, r.body, r.repeat, r.repeat ? r.fire_at.toTimeString().slice(0, 5) : +r.fire_at]))
  if (sig === lastRem) return
  await sb.from('reminders').delete().eq('user_id', user.id)
  if (list.length) await sb.from('reminders').insert(list.map((r) => ({ ...r, user_id: user.id, fire_at: r.fire_at.toISOString() })))
  lastRem = sig
}

/* ---------------- start ---------------- */
window.GriinNative = { faceToggle, faceUnlock, enableReminders, changed, syncOpen: drawSync }

// the real mic replaces the demo one
window.startMic_ = voiceStart
window.stopMic = voiceStop
const mic = $('edMic'); if (mic) mic.onclick = () => (listening ? voiceStop() : voiceStart())

// Face ID shows as on only if this phone actually has it set up
if (window.griinSetFace) window.griinSetFace(!!store.get(CRED))

$('syncForm')?.addEventListener('submit', (e) => { e.preventDefault(); signIn(false) })
const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn }
on('syncUp', () => signIn(true))
on('syncNow', async () => { await pull(); await push(); say('Synced') })
on('syncOutBtn', signOut)
window.griinPrefsChanged = changed

if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => {})

if (sb) {
  sb.auth.getSession().then(async ({ data }) => {
    user = data.session ? data.session.user : null
    aesKey = user ? await loadKey() : null
    drawSync()
    if (user && aesKey) pull()
  })
  sb.auth.onAuthStateChange((_e, s) => { user = s ? s.user : null; if (!user) aesKey = null; drawSync() })
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pull() })
} else drawSync()
