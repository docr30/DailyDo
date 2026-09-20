-- =========================================================
-- DailyDo — Supabase schema
-- Jalankan ini di Supabase Dashboard > SQL Editor (sekali saja)
-- =========================================================

-- 1. Tabel tasks -------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null check (char_length(description) <= 500),
  assigner varchar(100) default 'Diri Sendiri',
  status varchar(20) not null default 'on_going'
    check (status in ('on_going', 'pending', 'done')),
  date date not null,
  original_date date not null,
  completed_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tasks_user_date_status
  on public.tasks (user_id, date, status);

-- 1b. Kolom penilaian prioritas (Task Priority Assessor) ------------
-- Aman dijalankan ulang di project yang sudah ada (ADD COLUMN IF NOT EXISTS).
alter table public.tasks add column if not exists deadline date;
alter table public.tasks add column if not exists effort_estimate varchar(20);
alter table public.tasks add column if not exists impact_done smallint check (impact_done between 1 and 5);
alter table public.tasks add column if not exists impact_late smallint check (impact_late between 1 and 5);
alter table public.tasks add column if not exists strategic_fit smallint check (strategic_fit between 1 and 5);
alter table public.tasks add column if not exists blocks_others boolean;
alter table public.tasks add column if not exists blocks_who varchar(200);
alter table public.tasks add column if not exists compliance_risk boolean;
alter table public.tasks add column if not exists delegable boolean;
alter table public.tasks add column if not exists stakeholders varchar(300);
alter table public.tasks add column if not exists concurrent_tasks text;
alter table public.tasks add column if not exists priority_score numeric(3,2);
alter table public.tasks add column if not exists priority_level varchar(2)
  check (priority_level in ('P0','P1','P2','P3'));
alter table public.tasks add column if not exists priority_assessment jsonb;

create index if not exists idx_tasks_user_priority
  on public.tasks (user_id, date, priority_score desc);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- 2. Row Level Security -------------------------------------------
alter table public.tasks enable row level security;

drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- 3. RPC: statistik mingguan --------------------------------------
create or replace function public.get_weekly_completed(p_month int, p_year int)
returns table(week_number int, completed_count bigint)
language sql
security invoker
as $$
  select
    ((extract(day from completed_date)::int - 1) / 7) + 1 as week_number,
    count(*) as completed_count
  from public.tasks
  where user_id = auth.uid()
    and status = 'done'
    and completed_date is not null
    and extract(month from completed_date) = p_month
    and extract(year from completed_date) = p_year
  group by week_number
  order by week_number;
$$;

-- 4. RPC: beban kerja bulanan (heatmap) -----------------------------
create or replace function public.get_monthly_workload(p_month int, p_year int)
returns table(task_date date, task_count bigint)
language sql
security invoker
as $$
  select date as task_date, count(*) as task_count
  from public.tasks
  where user_id = auth.uid()
    and extract(month from date) = p_month
    and extract(year from date) = p_year
  group by date
  order by date;
$$;

-- 5. Rollover function (dipanggil oleh Edge Function terjadwal) -----
-- Catatan: ini berjalan lintas-user dengan service role key,
-- jadi TIDAK dibatasi RLS (dipanggil dari Edge Function, bukan client).
create or replace function public.rollover_overdue_tasks()
returns void
language sql
security definer
as $$
  update public.tasks
  set date = current_date
  where status <> 'done'
    and date < current_date;
$$;
