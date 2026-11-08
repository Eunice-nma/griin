# Griin setup

Griin works on its own with everything saved on the phone. The steps below switch on the extras:
sync and backup, reminders, Face ID and voice on any iPhone. Run all the commands from the `griin` folder.

```bash
npm install
```

## 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com) and wait for it to finish setting up.
2. **SQL Editor → New query**: paste in `supabase/schema.sql` and click **Run**.
3. **Authentication → Sign In / Providers → Email**: keep it on. Turning off **Confirm email** saves a step for a personal app.
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

## 2. Keys for the app

```bash
cp .env.example .env.local
npx web-push generate-vapid-keys
```

Put the Project URL, publishable (anon) key and the **public** VAPID key in `src/config.js` (or in `.env.local`,
which wins if present). They're all public values. Keep the **private** VAPID key for step 3, and never put it or the
secret key in the app.

## 3. Reminders and voice (Supabase functions)

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com CRON_SECRET=make-up-a-long-random-string
npx supabase functions deploy send-reminders --no-verify-jwt
```

Then open `supabase/cron.sql`, put in your project ref and the same `CRON_SECRET`, and run it in the SQL Editor.
From then on, a check for due reminders runs every minute.

**Optional, voice on the Home Screen app.** iPhone often blocks its own speech recognition inside Home Screen apps.
When that happens, Griin records the audio and sends it here to be written down instead. This needs an OpenAI API key
(paid per use, a fraction of a cent per minute):

```bash
npx supabase secrets set OPENAI_API_KEY=sk-...
npx supabase functions deploy transcribe
```

## 4. Put it online (GitHub + Vercel)

1. Push the folder to a new GitHub repo.
2. On [vercel.com](https://vercel.com), choose **Add New → Project** and import the repo. It detects Vite on its own.
3. No environment variables are needed: the public values are in `src/config.js`.
4. Click **Deploy**, open the link in Safari on your iPhone, then **Share → Add to Home Screen**.

## 5. Turn things on in the app

**Profile → Settings**:

- **Sync & backup**: create your account. Your journal is encrypted on the phone with your password before it's saved,
  so Supabase only ever stores scrambled text. There's no password reset for the encrypted data: if you forget the
  password, the copy on your phone is still fine, but the cloud copy can't be opened.
- **Unlock with Face ID**: turn it on and confirm with Face ID once.
- **Change PIN**: set your own PIN. Until you do, any 4 digits except 0000 open the journal (handy for demos).
- **Reminders**: open Griin from the Home Screen icon first (iPhone only allows notifications there), then switch on the
  ones you want and allow notifications.

## What's where

| File | What it does |
| --- | --- |
| `index.html` | The app |
| `src/native.js` | Face ID, voice, encrypted sync, reminders |
| `public/sw.js` | Shows reminder notifications (caches nothing, so updates always show) |
| `supabase/schema.sql` | Tables, plus row-level security so each account only sees its own rows |
| `supabase/functions/send-reminders` | Sends the push notifications that are due |
| `supabase/functions/transcribe` | Voice to text fallback |
| `supabase/cron.sql` | Runs the reminder check every minute |
