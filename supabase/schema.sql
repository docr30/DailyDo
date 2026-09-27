-- FinTrack schema for Supabase (Postgres)
-- Run this once in Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income','expense')),
  color text not null default '#64748B',
  icon text not null default 'more',
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  category_id uuid references public.categories(id) on delete set null,
  item text not null,
  amount bigint not null check (amount > 0),
  type text not null check (type in ('income','expense')),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists transactions_user_category_idx on public.transactions (user_id, category_id);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;

create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_own" on public.transactions;
drop policy if exists "transactions_update_own" on public.transactions;
drop policy if exists "transactions_delete_own" on public.transactions;

create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);

-- Seed default categories automatically whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, color, icon, locked) values
    (new.id, 'Gaji', 'income', '#10B981', 'wallet', false),
    (new.id, 'Bonus', 'income', '#34D399', 'gift', false),
    (new.id, 'Belanja Bulanan', 'expense', '#EF4444', 'shopping', false),
    (new.id, 'Transport', 'expense', '#F59E0B', 'car', false),
    (new.id, 'Hiburan', 'expense', '#8B5CF6', 'film', false),
    (new.id, 'Kesehatan', 'expense', '#3B82F6', 'heart', false),
    (new.id, 'Lainnya', 'expense', '#64748B', 'more', true);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Budgeting: separate planning tool, independent from transactions/saldo
create table if not exists public.budget_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id uuid references public.budget_plans(id) on delete cascade not null,
  date date not null,
  category_id uuid references public.categories(id) on delete set null,
  item text not null,
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists budget_items_plan_idx on public.budget_items (plan_id);
create index if not exists budget_plans_user_idx on public.budget_plans (user_id);

alter table public.budget_plans enable row level security;
alter table public.budget_items enable row level security;

drop policy if exists "budget_plans_select_own" on public.budget_plans;
drop policy if exists "budget_plans_insert_own" on public.budget_plans;
drop policy if exists "budget_plans_update_own" on public.budget_plans;
drop policy if exists "budget_plans_delete_own" on public.budget_plans;

create policy "budget_plans_select_own" on public.budget_plans for select using (auth.uid() = user_id);
create policy "budget_plans_insert_own" on public.budget_plans for insert with check (auth.uid() = user_id);
create policy "budget_plans_update_own" on public.budget_plans for update using (auth.uid() = user_id);
create policy "budget_plans_delete_own" on public.budget_plans for delete using (auth.uid() = user_id);

drop policy if exists "budget_items_select_own" on public.budget_items;
drop policy if exists "budget_items_insert_own" on public.budget_items;
drop policy if exists "budget_items_update_own" on public.budget_items;
drop policy if exists "budget_items_delete_own" on public.budget_items;

create policy "budget_items_select_own" on public.budget_items for select using (auth.uid() = user_id);
create policy "budget_items_insert_own" on public.budget_items for insert with check (auth.uid() = user_id);
create policy "budget_items_update_own" on public.budget_items for update using (auth.uid() = user_id);
create policy "budget_items_delete_own" on public.budget_items for delete using (auth.uid() = user_id);
