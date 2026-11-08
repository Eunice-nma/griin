// Turns a short voice recording into text. Only used when the phone's own speech recognition isn't available
// (often the case for Home Screen apps on iPhone). Needs an OpenAI API key set as OPENAI_API_KEY.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  // only signed-in Griin users
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return new Response('Sign in first', { status: 401, headers: cors })

  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return Response.json({ text: '', error: 'Voice service not set up' }, { headers: cors })

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return new Response('No audio', { status: 400, headers: cors })
  if (file.size > 10 * 1024 * 1024) return new Response('Recording too long', { status: 413, headers: cors })

  const out = new FormData()
  out.append('file', file, file.name || 'voice.m4a')
  out.append('model', 'whisper-1')
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: out,
  })
  const j = await r.json()
  return Response.json({ text: j.text ?? '' }, { headers: cors })
})
