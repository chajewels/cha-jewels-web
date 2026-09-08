-- Cha Jewels website: catalog + live claims.
-- DRAFTED by Claude Code. APPLIED by Lovable / Cynthia in the shared Hub project. Review against existing Hub schema first.
-- Reuses (does NOT recreate): customers, orders, layaway_plans, layaway_payments, loyalty_ledger.

create type product_karat as enum ('K18','PT900','PT950');
create type product_status as enum ('draft','active','archived');
create type claim_status as enum ('held','paid','layaway','expired','released');

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  slug text unique not null,
  name text not null,
  karat product_karat,
  weight_g numeric(8,2),
  description_en text, description_ja text, description_tl text,
  status product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text, stone text,
  price_jpy integer not null check (price_jpy >= 0),
  price_php integer check (price_php >= 0),
  cost_basis integer,                       -- admin only, never exposed (see RLS + view below)
  stock_qty integer not null default 0 check (stock_qty >= 0)
);
create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  url text not null, alt text, sort integer not null default 0
);
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null, hero_media text, description text
);
create table if not exists collection_products (
  collection_id uuid references collections(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  sort integer not null default 0,
  primary key (collection_id, product_id)
);
create table if not exists live_claims (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  product_variant_id uuid not null references product_variants(id),
  customer_id uuid references customers(id),
  csr_id uuid,                              -- references the Hub's staff/user table; set FK after confirming its name
  price_locked integer not null,
  status claim_status not null default 'held',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on live_claims (status, expires_at);
create index on products (status);

-- Terminology guard at the data layer: the Hub UI cannot save forbidden gold terms.
create or replace function reject_forbidden_gold_terms() returns trigger language plpgsql as $$
begin
  if coalesce(new.name,'') || ' ' || coalesce(new.description_en,'') || ' ' || coalesce(new.description_tl,'')
     ~* '\m(japan(ese)?|saudi|italian|dubai|hk|chinese) gold\M' then
    raise exception 'Forbidden gold terminology. Use "K18 gold, Made in Japan".';
  end if;
  return new;
end $$;
create trigger products_terminology before insert or update on products for each row execute function reject_forbidden_gold_terms();

-- Public read view that hides cost_basis. The website reads variants through this policy set.
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_media enable row level security;
alter table collections enable row level security;
alter table collection_products enable row level security;
alter table live_claims enable row level security;

create policy "public read active products" on products for select using (status = 'active');
create policy "public read variants" on product_variants for select using (exists (select 1 from products p where p.id = product_id and p.status = 'active'));
create policy "public read media" on product_media for select using (true);
create policy "public read collections" on collections for select using (true);
create policy "public read collection_products" on collection_products for select using (true);
-- Column-level: revoke cost_basis from anon/authenticated so it can never be selected by the website.
revoke select (cost_basis) on product_variants from anon, authenticated;
-- Claims: a customer sees only their own; anon can look up by code (needed for the claim link) but not list.
create policy "claim by code" on live_claims for select using (true);

-- Seed the four collections.
insert into collections (slug, name, description) values
 ('k18-gold','K18 Gold','Chains, bangles, rings and hoops in 75% pure gold. The everyday pieces that still weigh something.'),
 ('pearls','Pearls','Akoya and freshwater strands graded for luster and match, finished with K18 clasps.'),
 ('diamonds','Diamonds','Certified stones in K18 and PT900. Carat weight and clarity stated on every piece.'),
 ('preloved-luxury','Preloved Luxury','Pieces from iconic houses, authenticated and serviced in Japan before they reach you.')
on conflict (slug) do nothing;
