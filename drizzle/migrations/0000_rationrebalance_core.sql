-- roles
create type public.app_role as enum ('admin','moderator','worker');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- worker profiles
create table public.worker_profiles (
  id uuid primary key,
  full_name text not null default '',
  organization text not null default '',
  district text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.worker_profiles to authenticated;
grant all on public.worker_profiles to service_role;
alter table public.worker_profiles enable row level security;
create policy "workers read all profiles" on public.worker_profiles for select to authenticated using (true);
create policy "worker manages own profile" on public.worker_profiles for insert to authenticated with check (id = auth.uid());
create policy "worker updates own profile" on public.worker_profiles for update to authenticated using (id = auth.uid());

-- anonymous demand records
create table public.demand_records (
  id uuid primary key default gen_random_uuid(),
  district text not null,
  card_type text not null,
  family_size integer not null default 1,
  has_diabetes text not null default 'unknown',
  rice_kg numeric not null default 0,
  millet_kg numeric not null default 0,
  pulses_kg numeric not null default 0,
  plan_cost numeric not null default 0,
  declared_budget numeric,
  availability text not null default 'unknown',
  alt_source text,
  logged_by uuid,
  created_at timestamptz not null default now()
);
grant insert on public.demand_records to anon;
grant select, insert on public.demand_records to authenticated;
grant all on public.demand_records to service_role;
alter table public.demand_records enable row level security;
create policy "anyone can log demand" on public.demand_records for insert to anon, authenticated with check (true);
create policy "signed in can read demand" on public.demand_records for select to authenticated using (true);

-- forum
create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid,
  display_name text not null default 'Anonymous',
  district text not null,
  tag text not null default 'general',
  body text not null,
  image_url text,
  status text not null default 'visible',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.forum_posts to anon;
grant select, insert, update, delete on public.forum_posts to authenticated;
grant all on public.forum_posts to service_role;
alter table public.forum_posts enable row level security;
create policy "visible posts public" on public.forum_posts for select to anon, authenticated using (status = 'visible');
create policy "moderators read all posts" on public.forum_posts for select to authenticated using (public.has_role(auth.uid(),'moderator') or public.has_role(auth.uid(),'admin'));
create policy "anyone can post" on public.forum_posts for insert to anon, authenticated with check (true);
create policy "moderators update posts" on public.forum_posts for update to authenticated using (public.has_role(auth.uid(),'moderator') or public.has_role(auth.uid(),'admin'));
create policy "moderators delete posts" on public.forum_posts for delete to authenticated using (public.has_role(auth.uid(),'moderator') or public.has_role(auth.uid(),'admin'));

create table public.forum_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  kind text not null default 'up',
  created_at timestamptz not null default now()
);
grant select, insert on public.forum_reactions to anon;
grant select, insert on public.forum_reactions to authenticated;
grant all on public.forum_reactions to service_role;
alter table public.forum_reactions enable row level security;
create policy "reactions public" on public.forum_reactions for select to anon, authenticated using (true);
create policy "anyone can react" on public.forum_reactions for insert to anon, authenticated with check (true);

create index on public.demand_records (district, created_at);
create index on public.forum_posts (district, created_at desc);
create index on public.forum_reactions (post_id);

-- seed a few forum posts so the board is not empty
insert into public.forum_posts (display_name, district, tag, body) values
('Lakshmi · Ward 5','Tiruvallur','dealer','ராகி இப்போது எங்கள் கடையில் கிடைக்கிறது, செவ்வாய் அன்று கேளுங்கள். Ragi is now available at our shop on Tuesdays.'),
('Ravi','Coimbatore','recipe','கம்பு கூழ் சுவையாக உள்ளது, குழந்தைகளுக்கும் பிடித்தது. Kambu koozh is tasty and the children like it.'),
('Selvi · ASHA','Madurai','scheme','அச்சிட்ட பட்டியலைக் காட்டியதும் கடைக்காரர் பருப்பு தந்தார். The dealer gave extra dal once I showed the printed sheet.'),
('Anbu','Tiruvallur','problem','எங்கள் கடையில் சிறுதானியம் இல்லை, வாரச் சந்தையில் ₹42/kg. No millets at our shop; weekly market sells at ₹42/kg.');