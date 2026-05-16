-- Next Step in Life — Supabase 테이블 생성
-- Supabase 대시보드 > SQL Editor 에서 이 SQL을 실행하세요.

-- 1. 세션 테이블: 퀴즈 답변 + 페르소나 + 인사이트 저장
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  quiz_answers jsonb,
  persona_a jsonb,
  persona_b jsonb,
  insight jsonb
);

-- 2. 대화 테이블: 페르소나 토론 메시지 저장
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade,
  speaker text not null,        -- 'A' or 'B'
  content text not null,
  turn_order integer not null,
  created_at timestamptz default now()
);

-- 인덱스
create index if not exists idx_conversations_session
  on public.conversations(session_id);

-- 3. RLS (Row Level Security) — 누구나 읽기/쓰기 가능 (팀 프로젝트용)
alter table public.sessions enable row level security;
alter table public.conversations enable row level security;

create policy "sessions_public_read" on public.sessions
  for select using (true);

create policy "sessions_public_insert" on public.sessions
  for insert with check (true);

create policy "conversations_public_read" on public.conversations
  for select using (true);

create policy "conversations_public_insert" on public.conversations
  for insert with check (true);

-- 4. Why 트리 (v2 — 일자별)
-- 이전 v1(단일 트리) 스키마가 있으면 자동으로 정리. 데이터는 보존되지 않음 — 초기 단계.
drop table if exists public.whytree_messages cascade;
drop table if exists public.whytree_trees cascade;

create table public.whytree_trees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  tree jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, date)
);
create index idx_whytree_trees_user_date
  on public.whytree_trees (user_id, date desc);

-- 5. Why 트리 대화 로그: 트리에 종속(트리 삭제 시 cascade)
create table public.whytree_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tree_id uuid not null references public.whytree_trees(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
create index idx_whytree_messages_tree
  on public.whytree_messages (tree_id, created_at);

-- RLS — 본인 데이터만
alter table public.whytree_trees enable row level security;
alter table public.whytree_messages enable row level security;

create policy "whytree_trees_owner_all" on public.whytree_trees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "whytree_messages_owner_all" on public.whytree_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. 90일 플랜 결과 저장 (사용자별 누적)
create table if not exists public.nextstep_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  answers jsonb not null,
  personas jsonb not null,
  plan jsonb not null
);
create index if not exists idx_nextstep_plans_user
  on public.nextstep_plans (user_id, created_at desc);

alter table public.nextstep_plans enable row level security;

create policy "nextstep_plans_owner_all" on public.nextstep_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
