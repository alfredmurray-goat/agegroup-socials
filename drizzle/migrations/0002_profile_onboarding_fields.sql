alter table public.profiles
  add column if not exists interests text[] not null default '{}',
  add column if not exists vibe text,
  add column if not exists pronouns text,
  add column if not exists city text,
  add column if not exists content_pace text not null default 'balanced',
  add column if not exists quiet_hours boolean not null default false,
  add column if not exists onboarded_at timestamptz;

alter table public.posts
  add column if not exists topic text;
