-- lowkey social core schema, age-band split enforced in RLS
create type public.age_band as enum ('under_18', 'adult');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  handle text not null unique,
  display_name text not null,
  bio text not null default '',
  avatar_hue int not null default 60,
  age_band public.age_band,
  verification_status text not null default 'unverified',
  verified_provider text,
  daily_limit_minutes int not null default 45,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'post',
  caption text not null default '',
  media_url text,
  poster_hue int not null default 60,
  tagged_handle text,
  age_band public.age_band not null,
  created_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  age_band public.age_band not null,
  streak_count int not null default 0,
  streak_last_day date,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.daily_usage (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  minutes int not null default 0,
  primary key (profile_id, day)
);

-- gdpr: explicit, revocable, auditable consents (camera age check, terms)
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index on public.posts (age_band, created_at desc);
create index on public.messages (conversation_id, created_at);
create index on public.conversation_members (profile_id);

-- helpers (security definer so policies never recurse into profiles rls)
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid()
$$;

create or replace function public.current_band()
returns public.age_band language sql stable security definer set search_path = public as $$
  select age_band from public.profiles
  where user_id = auth.uid() and verification_status = 'verified'
$$;

create or replace function public.is_conversation_member(_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = _conversation_id
      and profile_id = public.current_profile_id()
  )
$$;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, delete on public.post_likes to authenticated;
grant select, insert, delete on public.post_comments to authenticated;
grant select, insert, delete on public.follows to authenticated;
grant select, insert on public.conversations to authenticated;
grant update on public.conversations to authenticated;
grant select, insert, update, delete on public.conversation_members to authenticated;
grant select, insert, delete on public.messages to authenticated;
grant select, insert, update, delete on public.daily_usage to authenticated;
grant select, insert, update on public.consents to authenticated;
grant all on public.profiles, public.posts, public.post_likes, public.post_comments,
  public.follows, public.conversations, public.conversation_members, public.messages,
  public.daily_usage, public.consents to service_role;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.follows enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.daily_usage enable row level security;
alter table public.consents enable row level security;

-- profiles: always your own row; other people only inside your verified band
create policy "own profile readable" on public.profiles
  for select to authenticated using (user_id = auth.uid());
create policy "same band profiles readable" on public.profiles
  for select to authenticated using (age_band = public.current_band());
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy "update own profile" on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own profile" on public.profiles
  for delete to authenticated using (user_id = auth.uid());

-- posts: hard age wall
create policy "band posts readable" on public.posts
  for select to authenticated using (age_band = public.current_band());
create policy "insert own band posts" on public.posts
  for insert to authenticated
  with check (author_id = public.current_profile_id() and age_band = public.current_band());
create policy "delete own posts" on public.posts
  for delete to authenticated using (author_id = public.current_profile_id());

create policy "band likes readable" on public.post_likes
  for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.age_band = public.current_band()));
create policy "like as self" on public.post_likes
  for insert to authenticated with check (profile_id = public.current_profile_id());
create policy "unlike as self" on public.post_likes
  for delete to authenticated using (profile_id = public.current_profile_id());

create policy "band comments readable" on public.post_comments
  for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.age_band = public.current_band()));
create policy "comment as self" on public.post_comments
  for insert to authenticated with check (author_id = public.current_profile_id());
create policy "delete own comments" on public.post_comments
  for delete to authenticated using (author_id = public.current_profile_id());

create policy "band follows readable" on public.follows
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = following_id and p.age_band = public.current_band()));
create policy "follow as self" on public.follows
  for insert to authenticated with check (follower_id = public.current_profile_id());
create policy "unfollow as self" on public.follows
  for delete to authenticated using (follower_id = public.current_profile_id());

-- chats: members only, and only inside your band
create policy "member conversations readable" on public.conversations
  for select to authenticated
  using (age_band = public.current_band() and public.is_conversation_member(id));
create policy "create band conversation" on public.conversations
  for insert to authenticated with check (age_band = public.current_band());
create policy "member updates conversation" on public.conversations
  for update to authenticated
  using (public.is_conversation_member(id)) with check (age_band = public.current_band());

create policy "membership readable" on public.conversation_members
  for select to authenticated
  using (profile_id = public.current_profile_id() or public.is_conversation_member(conversation_id));
create policy "add members to own conversation" on public.conversation_members
  for insert to authenticated
  with check (
    profile_id = public.current_profile_id()
    or exists (
      select 1 from public.profiles p
      where p.id = profile_id and p.age_band = public.current_band()
    )
  );
create policy "update own membership" on public.conversation_members
  for update to authenticated
  using (profile_id = public.current_profile_id()) with check (profile_id = public.current_profile_id());
create policy "leave conversation" on public.conversation_members
  for delete to authenticated using (profile_id = public.current_profile_id());

create policy "member messages readable" on public.messages
  for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "send as self in own conversation" on public.messages
  for insert to authenticated
  with check (sender_id = public.current_profile_id() and public.is_conversation_member(conversation_id));
create policy "delete own messages" on public.messages
  for delete to authenticated using (sender_id = public.current_profile_id());

create policy "own usage" on public.daily_usage
  for all to authenticated
  using (profile_id = public.current_profile_id()) with check (profile_id = public.current_profile_id());

create policy "own consents readable" on public.consents
  for select to authenticated using (profile_id = public.current_profile_id());
create policy "record own consent" on public.consents
  for insert to authenticated with check (profile_id = public.current_profile_id());
create policy "revoke own consent" on public.consents
  for update to authenticated
  using (profile_id = public.current_profile_id()) with check (profile_id = public.current_profile_id());
