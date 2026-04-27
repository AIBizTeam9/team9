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
