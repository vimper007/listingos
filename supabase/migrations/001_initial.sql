-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- AGENTS TABLE
-- ============================================================
create table if not exists public.agents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null default '',
  bio text,
  logo_url text,
  brand_color text not null default '#1a2e4a',
  slug text not null unique,
  stripe_customer_id text,
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'pro', 'agency')),
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS for agents
alter table public.agents enable row level security;

create policy "Agents: select own row"
  on public.agents for select
  using (auth.uid() = user_id);

create policy "Agents: insert own row"
  on public.agents for insert
  with check (auth.uid() = user_id);

create policy "Agents: update own row"
  on public.agents for update
  using (auth.uid() = user_id);

-- ============================================================
-- LISTINGS TABLE
-- ============================================================
create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  address text not null,
  price numeric not null default 0,
  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  square_footage integer not null default 0,
  features text[] not null default '{}',
  description text,
  photo_urls text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'sold', 'archived')),
  created_at timestamptz not null default now()
);

-- RLS for listings
alter table public.listings enable row level security;

create policy "Listings: select own"
  on public.listings for select
  using (
    agent_id in (
      select id from public.agents where user_id = auth.uid()
    )
  );

create policy "Listings: insert own"
  on public.listings for insert
  with check (
    agent_id in (
      select id from public.agents where user_id = auth.uid()
    )
  );

create policy "Listings: update own"
  on public.listings for update
  using (
    agent_id in (
      select id from public.agents where user_id = auth.uid()
    )
  );

create policy "Listings: delete own"
  on public.listings for delete
  using (
    agent_id in (
      select id from public.agents where user_id = auth.uid()
    )
  );

-- Public can read active listings (for /listing/[id] page)
create policy "Listings: public read active"
  on public.listings for select
  using (status = 'active');

-- ============================================================
-- GENERATED CONTENT TABLE
-- ============================================================
create table if not exists public.generated_content (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  mls_description text not null default '',
  instagram_post text not null default '',
  facebook_post text not null default '',
  email_template text not null default '',
  whatsapp_message text not null default '',
  tiktok_script text not null default '',
  generated_at timestamptz not null default now()
);

-- RLS for generated_content
alter table public.generated_content enable row level security;

create policy "Content: select own"
  on public.generated_content for select
  using (
    listing_id in (
      select l.id from public.listings l
      join public.agents a on a.id = l.agent_id
      where a.user_id = auth.uid()
    )
  );

create policy "Content: insert own"
  on public.generated_content for insert
  with check (
    listing_id in (
      select l.id from public.listings l
      join public.agents a on a.id = l.agent_id
      where a.user_id = auth.uid()
    )
  );

create policy "Content: update own"
  on public.generated_content for update
  using (
    listing_id in (
      select l.id from public.listings l
      join public.agents a on a.id = l.agent_id
      where a.user_id = auth.uid()
    )
  );

-- Public can read content for active listings
create policy "Content: public read for active listings"
  on public.generated_content for select
  using (
    listing_id in (
      select id from public.listings where status = 'active'
    )
  );

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- STORAGE BUCKET + POLICIES
-- ============================================================
-- Create bucket via dashboard: Storage > New Bucket > name: listing-photos, Public: true
-- Then run these policies:

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-photos');

create policy "Authenticated users can update photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'listing-photos');

create policy "Public can read listing photos"
  on storage.objects for select
  to public
  using (bucket_id = 'listing-photos');

create policy "Authenticated users can delete photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-photos');

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists agents_user_id_idx on public.agents(user_id);
create index if not exists agents_slug_idx on public.agents(slug);
create index if not exists listings_agent_id_idx on public.listings(agent_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists generated_content_listing_id_idx on public.generated_content(listing_id);
