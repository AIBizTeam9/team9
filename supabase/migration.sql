-- Next Step in Life — Supabase 스키마
--
-- 이 파일은 idempotent — 몇 번 다시 돌려도 데이터를 보존합니다.
-- Vercel 배포 시 scripts/migrate.mjs가 자동 실행합니다.
-- 로컬에서 수동으로 돌리려면: `npm run migrate` (DIRECT_URL 필요)

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
  speaker text not null,
  content text not null,
  turn_order integer not null,
  created_at timestamptz default now()
);
create index if not exists idx_conversations_session
  on public.conversations(session_id);

-- 3. RLS — sessions/conversations는 데모/공용 (누구나 읽기/쓰기)
alter table public.sessions enable row level security;
alter table public.conversations enable row level security;

drop policy if exists "sessions_public_read" on public.sessions;
create policy "sessions_public_read" on public.sessions
  for select using (true);

drop policy if exists "sessions_public_insert" on public.sessions;
create policy "sessions_public_insert" on public.sessions
  for insert with check (true);

drop policy if exists "conversations_public_read" on public.conversations;
create policy "conversations_public_read" on public.conversations
  for select using (true);

drop policy if exists "conversations_public_insert" on public.conversations;
create policy "conversations_public_insert" on public.conversations
  for insert with check (true);

-- 4. Why 트리 (일자별)
create table if not exists public.whytree_trees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  tree jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, date)
);
create index if not exists idx_whytree_trees_user_date
  on public.whytree_trees (user_id, date desc);

-- 5. Why 트리 대화 로그
create table if not exists public.whytree_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tree_id uuid not null references public.whytree_trees(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
create index if not exists idx_whytree_messages_tree
  on public.whytree_messages (tree_id, created_at);

alter table public.whytree_trees enable row level security;
alter table public.whytree_messages enable row level security;

drop policy if exists "whytree_trees_owner_all" on public.whytree_trees;
create policy "whytree_trees_owner_all" on public.whytree_trees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "whytree_messages_owner_all" on public.whytree_messages;
create policy "whytree_messages_owner_all" on public.whytree_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. 90일 플랜 결과 저장
create table if not exists public.nextstep_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  answers jsonb not null,
  personas jsonb not null,
  plan jsonb not null
);
-- 진행 상황 (action별 완료/리뷰 노트). 기존 row에도 추가 가능.
alter table public.nextstep_plans
  add column if not exists progress jsonb not null default '{}'::jsonb;
create index if not exists idx_nextstep_plans_user
  on public.nextstep_plans (user_id, created_at desc);

alter table public.nextstep_plans enable row level security;

drop policy if exists "nextstep_plans_owner_all" on public.nextstep_plans;
create policy "nextstep_plans_owner_all" on public.nextstep_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7. PostgREST 스키마 캐시 강제 새로고침
-- 새 테이블/컬럼/정책이 즉시 anon 키로 접근 가능해지도록.
-- 이게 없으면 마이그레이션 직후 'Could not find the table in the schema cache' 에러가 날 수 있음.
notify pgrst, 'reload schema';
