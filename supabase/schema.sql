-- =====================================================================
-- BEAT 주간 리그 · Supabase 데이터베이스
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run.
-- 여러 번 실행해도 안전하게 짰음 (create ... if not exists / or replace).
--
-- 규칙 (앱의 src/lib/league.ts 와 같아야 함)
--   주: 한국 시간 월요일 0시 ~ 일요일 24시
--   리그: 같은 티어끼리 최대 30명. 그 주 첫 포인트를 얻을 때 배정
--   정산: 상위 7명 승급, 하위 5명 강등 (맨 위·맨 아래 티어 제외)
--   티어 id: t1 ~ t6 (이름은 앱에서 정함)
--
-- 보안: 클라이언트는 테이블을 직접 읽고 쓸 수 없고(RLS, 정책 없음),
--       아래 security definer 함수로만 접근한다.
-- =====================================================================

-- ---------- 설정 ----------
create or replace function public.beat_cfg(key text) returns int
language sql immutable as $$
  select case key
    when 'group_size' then 30
    when 'promote'    then 7
    when 'demote'     then 5
    when 'tier_max'   then 6
    when 'event_max'  then 30   -- 이벤트 1건 최대 포인트
    when 'day_max'    then 600  -- 하루 최대 포인트
  end
$$;

-- 이번 주 (한국 시간 월요일 날짜)
create or replace function public.beat_week(at timestamptz default now()) returns date
language sql stable as $$
  select date_trunc('week', at at time zone 'Asia/Seoul')::date
$$;

-- ---------- 테이블 ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text,
  tier       smallint not null default 1 check (tier between 1 and 6),
  created_at timestamptz not null default now()
);

create table if not exists public.league_groups (
  id         bigint generated always as identity primary key,
  week       date not null,
  tier       smallint not null,
  settled    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists league_groups_week_tier on public.league_groups(week, tier);

create table if not exists public.league_members (
  group_id   bigint not null references public.league_groups(id) on delete cascade,
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  week       date   not null,
  points     int    not null default 0,
  updated_at timestamptz not null default now(),
  -- 정산 결과: 1 승급, 0 유지, -1 강등
  result     smallint,
  primary key (group_id, user_id),
  unique (user_id, week)
);

create table if not exists public.point_events (
  id         text primary key,          -- 앱이 만든 id (중복 전송 방지)
  user_id    uuid not null references public.profiles(id) on delete cascade,
  week       date not null,
  pts        int  not null,
  lesson     text,
  created_at timestamptz not null default now()
);
create index if not exists point_events_user_day on public.point_events(user_id, created_at);

alter table public.profiles       enable row level security;
alter table public.league_groups  enable row level security;
alter table public.league_members enable row level security;
alter table public.point_events   enable row level security;

-- ---------- 내부 함수 ----------
create or replace function public.beat_ensure_profile() returns public.profiles
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into profiles(id) values (auth.uid()) on conflict (id) do nothing;
  select * into p from profiles where id = auth.uid();
  return p;
end $$;

-- 이번 주 리그 배정 (없으면 자리 있는 그룹에, 다 차면 새 그룹)
create or replace function public.beat_join(p public.profiles) returns bigint
language plpgsql security definer set search_path = public as $$
declare w date := beat_week(); g bigint;
begin
  select group_id into g from league_members where user_id = p.id and week = w;
  if g is not null then return g; end if;
  -- 같은 티어 그룹 생성/배정이 동시에 일어나지 않게
  perform pg_advisory_xact_lock(hashtext('beat_join'), (extract(epoch from w)::int / 86400) * 10 + p.tier);
  select lg.id into g from league_groups lg
   where lg.week = w and lg.tier = p.tier
     and (select count(*) from league_members m where m.group_id = lg.id) < beat_cfg('group_size')
   order by lg.id limit 1;
  if g is null then
    insert into league_groups(week, tier) values (w, p.tier) returning id into g;
  end if;
  insert into league_members(group_id, user_id, week) values (g, p.id, w);
  return g;
end $$;

-- ---------- 앱이 부르는 함수 ----------

-- 닉네임 정하기 (2~12자)
create or replace function public.beat_set_nickname(name text) returns void
language plpgsql security definer set search_path = public as $$
declare n text := btrim(name);
begin
  perform beat_ensure_profile();
  if char_length(n) < 2 or char_length(n) > 12 then raise exception 'nickname length'; end if;
  update profiles set nickname = n where id = auth.uid();
end $$;

-- 포인트 보내기. events = [{"id": "...", "pts": 15, "lesson": "quarter"}, ...]
-- 이미 받은 id는 무시. 이번 주 포인트로만 인정. 저장된 id 목록을 돌려준다.
create or replace function public.beat_add_points(events jsonb) returns text[]
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles := beat_ensure_profile();
  w date := beat_week();
  e jsonb; g bigint; added int := 0; ok text[] := '{}';
  today_sum int; v int;
begin
  select coalesce(sum(pts), 0) into today_sum from point_events
   where user_id = p.id and created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
  for e in select * from jsonb_array_elements(coalesce(events, '[]'::jsonb)) loop
    v := least(greatest(coalesce((e->>'pts')::int, 0), 0), beat_cfg('event_max'));
    v := least(v, greatest(beat_cfg('day_max') - today_sum, 0));
    insert into point_events(id, user_id, week, pts, lesson)
      values (e->>'id', p.id, w, v, left(e->>'lesson', 40))
      on conflict (id) do nothing;
    if found then added := added + v; today_sum := today_sum + v; end if;
    ok := ok || (e->>'id');
  end loop;
  if added > 0 then
    g := beat_join(p);
    update league_members set points = points + added, updated_at = now()
     where group_id = g and user_id = p.id;
  end if;
  return ok;
end $$;

-- 내 리그 보기
create or replace function public.beat_my_league() returns jsonb
language plpgsql security definer set search_path = public as $$
declare p public.profiles := beat_ensure_profile(); w date := beat_week(); g bigint; last jsonb;
begin
  select group_id into g from league_members where user_id = p.id and week = w;
  -- 지난주 결과 (승급/강등 알림용)
  select jsonb_build_object('week', m.week, 'result', m.result, 'points', m.points) into last
    from league_members m where m.user_id = p.id and m.week = w - 7;
  return jsonb_build_object(
    'week', w,
    'tier', p.tier,
    'nickname', p.nickname,
    'me', p.id,
    'last', last,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.user_id, 'nickname', coalesce(pr.nickname, '드러머'), 'points', m.points)
             order by m.points desc, m.updated_at asc)
        from league_members m join profiles pr on pr.id = m.user_id
       where m.group_id = g), '[]'::jsonb)
  );
end $$;

-- ---------- 주간 정산 (매주 월요일 0시 5분 KST 자동 실행) ----------
create or replace function public.beat_settle() returns int
language plpgsql security definer set search_path = public as $$
declare grp record; n int; cnt int := 0;
begin
  for grp in select * from league_groups where week < beat_week() and not settled order by id for update loop
    select count(*) into n from league_members where group_id = grp.id;
    with ranked as (
      select user_id, points,
             row_number() over (order by points desc, updated_at asc) as rk
        from league_members where group_id = grp.id
    )
    update league_members m set result = case
        when r.points > 0 and r.rk <= beat_cfg('promote') and grp.tier < beat_cfg('tier_max') then 1
        when r.rk > greatest(n - beat_cfg('demote'), beat_cfg('promote')) and grp.tier > 1 then -1
        else 0 end
      from ranked r
     where m.group_id = grp.id and m.user_id = r.user_id;
    update profiles pr set tier = pr.tier + m.result
      from league_members m
     where m.group_id = grp.id and m.user_id = pr.id and m.result <> 0;
    update league_groups set settled = true where id = grp.id;
    cnt := cnt + 1;
  end loop;
  return cnt;
end $$;

-- ---------- 권한 ----------
revoke all on all tables in schema public from anon, authenticated;
revoke execute on function public.beat_ensure_profile(), public.beat_join(public.profiles), public.beat_settle() from public, anon, authenticated;
grant execute on function public.beat_set_nickname(text), public.beat_add_points(jsonb), public.beat_my_league() to authenticated;

-- ---------- 자동 정산 예약 (pg_cron) ----------
-- 월요일 00:05 KST = 일요일 15:05 UTC
create extension if not exists pg_cron;
select cron.unschedule('beat-weekly-settle') where exists (select 1 from cron.job where jobname = 'beat-weekly-settle');
select cron.schedule('beat-weekly-settle', '5 15 * * 0', $$select public.beat_settle()$$);

-- API가 새 함수를 바로 알아보게
notify pgrst, 'reload schema';
