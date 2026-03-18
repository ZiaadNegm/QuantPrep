-- QuantPrep Database Schema
-- Run this against your Supabase project (via SQL Editor or MCP)

-- 1. Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Sessions table
create table public.sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('practice', 'test')),
  preset_name text,
  config jsonb,
  selected_levels smallint[] not null,
  operation_filters text[] not null,
  number_type_filters text[] not null,
  is_finite boolean not null default true,
  question_count_target int,
  timer_enabled boolean not null default false,
  timer_duration_seconds int,
  seed text not null,
  generator_version text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  completed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  current_question_index int not null default 0,
  paused_at timestamptz,
  elapsed_seconds_at_pause numeric(10,3),
  score int,
  accuracy numeric(5,4),
  avg_response_time_ms int,
  correct_count int,
  wrong_count int,
  skipped_count int,
  total_answered int,
  percent_within_target numeric(5,4),
  created_at timestamptz default now()
);

create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_user_status on public.sessions(user_id, status);
create index idx_sessions_user_completed on public.sessions(user_id, completed_at desc)
  where completed_at is not null;

alter table public.sessions enable row level security;

create policy "Users can read own sessions"
  on public.sessions for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own sessions"
  on public.sessions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own sessions"
  on public.sessions for update to authenticated
  using (user_id = auth.uid());

-- 3. Question instances table
create table public.question_instances (
  id bigint generated always as identity primary key,
  session_id bigint not null references public.sessions(id) on delete cascade,
  order_index smallint not null,
  prompt text not null,
  correct_answer text not null,
  level smallint not null,
  operation_type text not null,
  number_type text not null,
  variable_position text not null default 'right',
  target_time_seconds numeric(4,1) not null,
  user_answer text,
  is_correct boolean,
  skipped boolean not null default false,
  response_time_ms int,
  answered_at timestamptz,
  constraint uq_session_order unique (session_id, order_index)
);

create index idx_qi_session_id on public.question_instances(session_id);

alter table public.question_instances enable row level security;

create policy "Users can read own question instances"
  on public.question_instances for select to authenticated
  using (
    exists (
      select 1 from public.sessions s
      where s.id = question_instances.session_id
      and s.user_id = auth.uid()
    )
  );

create policy "Users can insert own question instances"
  on public.question_instances for insert to authenticated
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = question_instances.session_id
      and s.user_id = auth.uid()
    )
  );

create policy "Users can update own question instances"
  on public.question_instances for update to authenticated
  using (
    exists (
      select 1 from public.sessions s
      where s.id = question_instances.session_id
      and s.user_id = auth.uid()
    )
  );

-- 4. Streaks table
create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_qualifying_date date,
  updated_at timestamptz default now()
);

alter table public.streaks enable row level security;

create policy "Users can read own streak"
  on public.streaks for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own streak"
  on public.streaks for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own streak"
  on public.streaks for update to authenticated
  using (user_id = auth.uid());

-- 5. Test presets table (reference data)
create table public.test_presets (
  name text primary key,
  display_name text not null,
  question_count int not null,
  timer_duration_seconds int not null,
  level_weights jsonb not null,
  operation_filters text[] not null,
  number_type_filters text[] not null,
  description text
);

alter table public.test_presets enable row level security;

create policy "Anyone authenticated can read presets"
  on public.test_presets for select to authenticated
  using (true);

-- Seed test presets
insert into public.test_presets (name, display_name, question_count, timer_duration_seconds, level_weights, operation_filters, number_type_filters, description)
values
  ('optiver_80_in_8', 'Optiver 80 in 8', 80, 480, '{"1":15,"2":30,"3":25,"4":20,"5":10}', '{"add","sub","mul","div"}', '{"integer","decimal","fraction"}', 'The classic: 80 questions in 8 minutes'),
  ('mixed_sprint_20', 'Mixed Sprint 20', 20, 120, '{"1":20,"2":30,"3":25,"4":15,"5":10}', '{"add","sub","mul","div"}', '{"integer","decimal","fraction"}', 'Quick 20-question sprint'),
  ('mixed_sprint_40', 'Mixed Sprint 40', 40, 240, '{"1":15,"2":30,"3":25,"4":20,"5":10}', '{"add","sub","mul","div"}', '{"integer","decimal","fraction"}', 'Medium 40-question test'),
  ('fractions_decimals', 'Fractions & Decimals Drill', 30, 300, '{"3":35,"4":40,"5":25}', '{"add","sub","mul","div"}', '{"decimal","fraction"}', 'High cognitive-load arithmetic focus');
