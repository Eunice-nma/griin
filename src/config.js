// Public settings for Griin. These are safe to commit: the publishable key only allows what the
// row-level security rules in supabase/schema.sql allow, and the VAPID key here is the PUBLIC half.
// Never put the secret key or the VAPID private key in this file.
export default {
  supabaseUrl: 'https://godocavklzvdsedgdmdg.supabase.co',
  supabaseKey: 'sb_publishable_Fg4jiVWSoUrBQoYltv3vxA_nIsO7rvz',
  vapidPublicKey: 'BPyXDbzVXh2V7W2QNu9EGkIyaPszCTwuQjSbXUR2mD1L3L-qTNAiJjloBKHIBZTYs7KtacjCr1e5jrszLgTJH4I',
}
