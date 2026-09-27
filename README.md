# FinTrack — Pencatat Keuangan Rumah Tangga

Aplikasi web (React + Vite + Tailwind) dengan backend Supabase (Postgres + Auth).
Fitur: pencatatan transaksi dengan saldo berjalan otomatis, kategori custom,
laporan grafik detail per kategori, dan modul **Budgeting** untuk simulasi
anggaran agenda/kegiatan yang terpisah dari rekap keuangan utama.

## 1. Setup Supabase

1. Buat project baru di https://supabase.com (gratis).
2. Buka **SQL Editor** di dashboard Supabase → New query.
3. Copy-paste seluruh isi file [`supabase/schema.sql`](./supabase/schema.sql) lalu **Run**.
   Ini akan membuat tabel `categories`, `transactions`, `budget_plans`,
   `budget_items`, mengaktifkan Row Level Security (setiap user hanya bisa
   melihat datanya sendiri), dan trigger yang otomatis mengisi 7 kategori
   default setiap kali ada user baru mendaftar.
4. Buka **Project Settings → API**. Salin:
   - `Project URL` → jadi `VITE_SUPABASE_URL`
   - `anon public` key → jadi `VITE_SUPABASE_ANON_KEY`

## 2. Jalankan secara lokal

```bash
npm install
cp .env.example .env
# lalu isi .env dengan URL & anon key dari Supabase
npm run dev
```

Buka `http://localhost:5173`. Daftar akun baru (email + password) — kategori
default akan otomatis muncul.

> Catatan: secara default Supabase mewajibkan verifikasi email sebelum login.
> Untuk testing cepat, bisa dimatikan sementara di
> **Authentication → Providers → Email → Confirm email** (matikan toggle-nya).

## 3. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: FinTrack"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

`.env` sudah masuk `.gitignore` sehingga kredensial Supabase tidak ikut ter-push.

## 4. Deploy ke Netlify

1. Login ke https://app.netlify.com → **Add new site → Import an existing project**.
2. Pilih repo GitHub yang baru dibuat.
3. Build command: `npm run build`, Publish directory: `dist`
   (sudah otomatis terbaca dari `netlify.toml`).
4. Di **Site settings → Environment variables**, tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Setiap `git push` ke `main` selanjutnya akan auto-deploy.

## 5. Ikon aplikasi / shortcut browser

`public/icon.svg` dan `public/manifest.json` sudah disiapkan sehingga saat
situs production di-"Add to Home Screen" dari browser (Android/desktop
Chrome), ikon logomark FinTrack akan muncul sebagai ikon aplikasi/shortcut.

## Struktur proyek

```
src/
  lib/            konstanta, format angka & tanggal, Supabase client
  context/        AuthContext (login/register/logout)
  hooks/          useCategories, useTransactions, useBudgeting (CRUD ke Supabase)
  components/     Layout (sidebar/bottom-nav), CatIcon, modal-modal
  pages/          Dashboard, Transactions, Reports, Categories, Budgeting, Profile
supabase/
  schema.sql      DDL + RLS policies + trigger seed kategori default
```

## Model data

- `categories` — kategori pemasukan/pengeluaran milik masing-masing user.
- `transactions` — transaksi keuangan utama. Saldo berjalan dihitung di
  frontend (bukan disimpan di DB) agar selalu konsisten dengan urutan tanggal.
- `budget_plans` / `budget_items` — agenda budgeting terpisah, murni untuk
  simulasi kalkulasi biaya, tidak memengaruhi saldo/transaksi utama.

Semua tabel dilindungi Row Level Security: query dari client hanya bisa
mengembalikan baris milik `auth.uid()` yang sedang login.

## Modul Utang & Piutang + Cicilan

Tambahan setelah rilis awal. Jalankan `supabase/schema_debts.sql` di SQL Editor
Supabase (setelah `schema.sql`) untuk membuat tabel `debts`, `installments`,
`payments` beserta RLS-nya.

Menu baru "Utang" di navigasi berisi 6 tab: Ringkasan, Utang, Piutang, Cicilan,
Pembayaran, dan Analitik (pie komposisi utang, bar jatuh tempo 6 bulan ke
depan, line tren pembayaran, bar aging piutang, plus insight teks otomatis).

**Catatan scope**: simulasi Snowball/Avalanche/What-if, ekspor CSV/PDF, filter
periode custom di tab Analitik, dan stacked-bar porsi pokok vs bunga belum
diimplementasikan di rilis ini — struktur data & fungsi kalkulasi
(`src/lib/debtMath.js`) sudah disiapkan sehingga bisa ditambahkan menyusul
tanpa perlu mengubah skema database.

Stack aktual proyek ini JavaScript (bukan TypeScript) dan berbasis
state-switch (bukan React Router), jadi modul ini mengikuti pola yang sama:
satu halaman tab (`src/pages/DebtManager.jsx`) didaftarkan sebagai satu entri
menu, bukan route URL terpisah seperti disebut di spesifikasi awal.
