-- Run once in the Supabase SQL Editor before enabling Stripe payments.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_payment_intent_id text unique,
  status text not null default 'inactive',
  plan text not null default 'free' check (plan in ('free', 'plus')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
add column if not exists stripe_payment_intent_id text unique;

alter table public.subscriptions enable row level security;
create policy "users read own subscription"
on public.subscriptions for select
using (auth.uid() = user_id);

-- Stripe webhooks write with the server-only Supabase secret key.
-- End users intentionally receive no insert, update, or delete policy.

-- The bucket allows the Plus single-file ceiling. The app enforces the
-- smaller 2 MB Free limit and the 4 MB Plus limit before upload.
update storage.buckets
set file_size_limit = 4194304,
    allowed_mime_types = array['audio/webm','audio/mp4','audio/ogg']
where id = 'speaking-recordings';
