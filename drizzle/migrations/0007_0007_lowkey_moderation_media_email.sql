-- moderation: reports (admin reads via service role; reporters see their own)
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','profile')),
  target_id uuid not null,
  reason text not null default 'other',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "own reports readable" on public.reports for select to authenticated
  using (reporter_id = public.current_profile_id());
create policy "report as self" on public.reports for insert to authenticated
  with check (reporter_id = public.current_profile_id());
create index reports_target_idx on public.reports (target_type, target_id, created_at desc);
create index reports_open_idx on public.reports (resolved_at, created_at desc);

-- roles: separate table, never on profiles (privilege escalation guard)
create type public.app_role as enum ('admin', 'moderator', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role::public.app_role
  )
$$;

-- dm photos
ALTER TABLE public.messages ADD COLUMN media_path text;

-- status updates ("what are you doing right now")
ALTER TABLE public.profiles ADD COLUMN status text;

-- post titles (create screen now has a title field)
ALTER TABLE public.posts ADD COLUMN title text;

-- email notification prefs (off by default, gdpr-friendly)
ALTER TABLE public.profiles ADD COLUMN email_follows boolean not null default false;
ALTER TABLE public.profiles ADD COLUMN email_likes boolean not null default false;
ALTER TABLE public.profiles ADD COLUMN email_comments boolean not null default false;
ALTER TABLE public.profiles ADD COLUMN email_dms boolean not null default false;

-- edit own post title/caption
create policy "edit own posts" on public.posts for update to authenticated
  using (author_id = public.current_profile_id())
  with check (author_id = public.current_profile_id());

-- seed the owner as admin (only if the account exists)
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'alfredcasper1010@gmail.com'
on conflict (user_id, role) do nothing;