// Sends any reminders that are due. Called every minute by the cron job in supabase/cron.sql.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@example.com', VAPID_PUBLIC, VAPID_PRIVATE)
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET')
  if (secret && req.headers.get('x-cron-secret') !== secret) return new Response('Not allowed', { status: 401 })
  // say clearly what's missing instead of crashing
  const missing = [['VAPID_PUBLIC_KEY', VAPID_PUBLIC], ['VAPID_PRIVATE_KEY', VAPID_PRIVATE], ['CRON_SECRET', secret]]
    .filter(([, v]) => !v).map(([k]) => k)
  if (missing.length) return Response.json({ error: `Missing secrets: ${missing.join(', ')}` }, { status: 500 })

  const now = new Date()
  const { data: due, error } = await sb
    .from('reminders')
    .select('*')
    .lte('fire_at', now.toISOString())
    .is('sent_at', null)
    .limit(200)
  if (error) return new Response(error.message, { status: 500 })

  let sent = 0
  for (const r of due ?? []) {
    const { data: subs } = await sb.from('push_subscriptions').select('endpoint, subscription').eq('user_id', r.user_id)
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(s.subscription, JSON.stringify({ title: r.title, body: r.body, tag: r.kind, url: '/' }))
        sent++
      } catch (e) {
        // the phone unsubscribed or the app was removed
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      }
    }
    if (r.repeat === 'daily') {
      let next = new Date(r.fire_at).getTime()
      while (next <= now.getTime()) next += 24 * 60 * 60 * 1000
      await sb.from('reminders').update({ fire_at: new Date(next).toISOString() }).eq('id', r.id)
    } else {
      await sb.from('reminders').update({ sent_at: now.toISOString() }).eq('id', r.id)
    }
  }
  return Response.json({ due: due?.length ?? 0, sent })
})
