-- FinTrack: modul Utang & Piutang + Cicilan
-- Jalankan setelah schema.sql. Aman di-run ulang (idempotent).

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. debts — utang saya (utang) & piutang saya (piutang)
-- =========================================================
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('utang','piutang')),
  counterparty text not null,
  description text,
  principal numeric not null check (principal > 0),
  interest_rate numeric not null default 0,
  start_date date not null,
  due_date date,
  status text not null default 'aktif' check (status in ('aktif','lunas','overdue')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists debts_user_idx on public.debts (user_id);
create index if not exists debts_user_type_idx on public.debts (user_id, type);

-- =========================================================
-- 2. installments — jadwal cicilan per debt
-- =========================================================
create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid references public.debts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  installment_number int not null,
  due_date date not null,
  amount numeric not null check (amount > 0),
  principal_portion numeric not null default 0,
  interest_portion numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','paid','overdue')),
  paid_at timestamptz,
  payment_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists installments_debt_idx on public.installments (debt_id);
create index if not exists installments_user_due_idx on public.installments (user_id, due_date);

-- =========================================================
-- 3. payments — riwayat pembayaran (cicilan maupun langsung ke debt)
-- =========================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid references public.debts(id) on delete cascade not null,
  installment_id uuid references public.installments(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  paid_at timestamptz not null default now(),
  method text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_debt_idx on public.payments (debt_id);
create index if not exists payments_user_idx on public.payments (user_id);

-- =========================================================
-- updated_at auto-touch untuk debts
-- =========================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists debts_touch_updated_at on public.debts;
create trigger debts_touch_updated_at
  before update on public.debts
  for each row execute procedure public.touch_updated_at();

-- =========================================================
-- Row Level Security — semua tabel: hanya pemilik data
-- =========================================================
alter table public.debts enable row level security;
alter table public.installments enable row level security;
alter table public.payments enable row level security;

drop policy if exists "debts_select_own" on public.debts;
drop policy if exists "debts_insert_own" on public.debts;
drop policy if exists "debts_update_own" on public.debts;
drop policy if exists "debts_delete_own" on public.debts;
create policy "debts_select_own" on public.debts for select using (auth.uid() = user_id);
create policy "debts_insert_own" on public.debts for insert with check (auth.uid() = user_id);
create policy "debts_update_own" on public.debts for update using (auth.uid() = user_id);
create policy "debts_delete_own" on public.debts for delete using (auth.uid() = user_id);

drop policy if exists "installments_select_own" on public.installments;
drop policy if exists "installments_insert_own" on public.installments;
drop policy if exists "installments_update_own" on public.installments;
drop policy if exists "installments_delete_own" on public.installments;
create policy "installments_select_own" on public.installments for select using (auth.uid() = user_id);
create policy "installments_insert_own" on public.installments for insert with check (auth.uid() = user_id);
create policy "installments_update_own" on public.installments for update using (auth.uid() = user_id);
create policy "installments_delete_own" on public.installments for delete using (auth.uid() = user_id);

drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_insert_own" on public.payments;
drop policy if exists "payments_update_own" on public.payments;
drop policy if exists "payments_delete_own" on public.payments;
create policy "payments_select_own" on public.payments for select using (auth.uid() = user_id);
create policy "payments_insert_own" on public.payments for insert with check (auth.uid() = user_id);
create policy "payments_update_own" on public.payments for update using (auth.uid() = user_id);
create policy "payments_delete_own" on public.payments for delete using (auth.uid() = user_id);
