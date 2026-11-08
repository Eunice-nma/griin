-- Checks for due reminders every minute.
-- Before running: replace YOUR-CRON-SECRET with the same secret you set for the function.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('griin-reminders') where exists (select 1 from cron.job where jobname = 'griin-reminders');

select cron.schedule(
  'griin-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url     := 'https://godocavklzvdsedgdmdg.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "66ff07daf011a3bc3a8c964803f79c4fecc8c9b40ff09328"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
