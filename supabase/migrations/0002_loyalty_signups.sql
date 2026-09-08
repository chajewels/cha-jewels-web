-- Website loyalty join form. Hub staff convert rows to customers; the tier itself is computed from loyalty_ledger.
create table if not exists loyalty_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null, contact text not null,
  region text not null check (region in ('JP','PH','OTHER')),
  lang text not null check (lang in ('ja','en')),
  converted_customer_id uuid references customers(id),
  created_at timestamptz not null default now()
);
alter table loyalty_signups enable row level security;
create policy "anon can insert signup" on loyalty_signups for insert with check (true);
-- No select for anon/authenticated: only staff (service role / Hub) read signups.

-- Level thresholds (12-month rolling spend, JPY). PROPOSED; confirm before launch.
create table if not exists loyalty_tiers (
  slug text primary key, name text not null, threshold_jpy integer not null, hold_minutes integer not null, sort integer not null
);
insert into loyalty_tiers (slug, name, threshold_jpy, hold_minutes, sort) values
 ('glimmer','Glimmer',0,60,1),('radiant','Radiant',100000,180,2),('elite','Elite',300000,720,3),('crown','Crown VIP',1000000,1440,4)
on conflict (slug) do update set threshold_jpy = excluded.threshold_jpy, hold_minutes = excluded.hold_minutes;
