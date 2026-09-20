# DailyDo

To-do list harian dengan kartu status, pergeseran otomatis tugas belum selesai,
reminder WhatsApp, dan statistik beban kerja bulanan. Dibangun dengan
React + Vite + Tailwind, Supabase (auth, database, edge function), dan
di-deploy ke Netlify sebagai PWA.

## 1. Jalankan secara lokal

```bash
npm install
cp .env.example .env
# isi .env dengan URL & anon key Supabase kamu (lihat langkah 2)
npm run dev
```

## 2. Setup Supabase (auth + database)

1. Buat project baru di https://supabase.com/dashboard.
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu jalankan (Run).
   Ini akan membuat:
   - tabel `tasks` + index
   - Row Level Security (setiap user hanya bisa akses tugas miliknya sendiri)
   - fungsi RPC `get_weekly_completed`, `get_monthly_workload`
   - fungsi `rollover_overdue_tasks` (dipakai oleh Edge Function)
3. Buka **Project Settings > API**, salin:
   - `Project URL` → isi ke `VITE_SUPABASE_URL`
   - `anon public key` → isi ke `VITE_SUPABASE_ANON_KEY`
   di file `.env` kamu.
4. (Opsional tapi disarankan) Di **Authentication > Providers**, pastikan
   Email/Password aktif. Kamu juga bisa matikan "Confirm email" saat masih
   development supaya tidak perlu verifikasi email tiap daftar akun baru.

## 3. Deploy Edge Function untuk rollover harian

Aplikasi sudah punya *fallback* rollover di sisi client (jalan tiap kali app
dibuka), tapi supaya tugas tetap "geser" ke hari ini walau user tidak buka
app, deploy scheduled Edge Function berikut:

```bash
npm install -g supabase
supabase login
supabase link --project-ref xxxxxxxxxxxx   # project ref ada di URL dashboard
supabase functions deploy rollover-tasks
```

Lalu jadwalkan cron-nya lewat salah satu cara:

**Cara A — Dashboard (paling mudah):**
Buka **Edge Functions > rollover-tasks > Cron**, atur jadwal `0 0 * * *`
(tiap hari jam 00:00 UTC — sesuaikan offset dengan zona waktu targetmu).

**Cara B — SQL (pg_cron + pg_net):**
```sql
select cron.schedule(
  'dailydo-rollover',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://xxxxxxxxxxxx.functions.supabase.co/rollover-tasks',
    headers := jsonb_build_object('Authorization', 'Bearer SERVICE_ROLE_KEY')
  );
  $$
);
```

## 4. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: DailyDo MVP"
gh repo create dailydo --private --source=. --remote=origin
git push -u origin main
```

(Ganti `gh repo create` dengan langkah manual di github.com jika kamu tidak
pakai GitHub CLI: buat repo kosong di web, lalu `git remote add origin <url>`
dan `git push -u origin main`.)

## 5. Deploy ke Netlify

**Lewat dashboard Netlify (disarankan):**
1. Login ke https://app.netlify.com, klik **Add new site > Import an existing project**.
2. Pilih repo GitHub `dailydo` yang baru dibuat.
3. Build settings sudah otomatis terbaca dari `netlify.toml`
   (`npm run build`, publish folder `dist`).
4. Di **Site settings > Environment variables**, tambahkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Klik **Deploy site**. Setiap push ke branch `main` akan auto-deploy.

**Lewat CLI (alternatif):**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set VITE_SUPABASE_URL "https://xxxxxxxxxxxx.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
netlify deploy --prod
```

## 6. Install sebagai PWA

Setelah live di Netlify (harus HTTPS), buka URL-nya di HP:
- **Android/Chrome**: menu ⋮ > "Add to Home screen" / "Install app".
- **iOS/Safari**: tombol Share > "Add to Home Screen".

## Struktur project

```
dailydo/
  src/
    lib/supabaseClient.js      # koneksi Supabase
    hooks/useAuth.js           # sign up / sign in / sign out
    hooks/useTasks.js          # CRUD tasks + rollover fallback
    context/ThemeContext.jsx   # dark/light mode
    components/                # TaskCard, modals, header, bottom nav
    pages/                     # Login, Today, Stats
  supabase/
    schema.sql                 # tabel, RLS, RPC statistik, fungsi rollover
    functions/rollover-tasks/  # Edge Function terjadwal (Deno)
  netlify.toml                 # konfigurasi build & redirect Netlify
  vite.config.js               # termasuk plugin PWA
```

## Fitur Penilaian Prioritas (Task Priority Assessor)

Saat menambah tugas, form "Penilaian prioritas" (bisa dilipat) meminta data
tambahan: deadline, estimasi effort, dampak jika selesai/terlambat,
kesesuaian strategis, apakah menghambat orang lain, risiko legal/compliance,
apakah bisa didelegasikan, dan stakeholder yang menunggu.

Data ini diproses oleh `src/utils/priorityEngine.js` menggunakan 9 kriteria
berbobot (Dampak 20%, Urgensi 15%, Konsekuensi Keterlambatan 15%, Kesesuaian
Strategis 15%, Dependensi 10%, Risiko/Compliance 10%, Effort vs Value 5%,
Delegability 5%, Stakeholder 5%) untuk menghasilkan skor 1.00–5.00 dan level
**P0 Critical / P1 High / P2 Medium / P3 Low**. Field yang tidak diisi tidak
"dikarang" — akan dicatat sebagai asumsi eksplisit beserta tingkat
keyakinan (confidence).

- Kartu tugas di halaman "Hari ini" diberi warna sesuai level prioritas
  (merah P0, oranye P1, kuning P2, hijau P3) dan otomatis diurutkan dari
  prioritas tertinggi.
- Tombol **Detail** pada tiap kartu membuka breakdown skor per kriteria,
  alasan, asumsi, rekomendasi aksi, dan saran delegasi.
- Kolom baru (`deadline`, `impact_done`, `priority_score`,
  `priority_assessment`, dll.) sudah ditambahkan ke `supabase/schema.sql`
  lewat `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, jadi aman dijalankan
  ulang di project Supabase yang sudah ada.

- Tombol **Edit** pada tiap kartu (atau tombol "Edit tugas ini" di layar
  Detail Prioritas) membuka form yang sama dengan "Tambah Tugas", terisi
  otomatis dengan data tugas tersebut. Ubah deskripsi, deadline, atau kriteria
  penilaian apa pun, lalu simpan — skor & level prioritas dihitung ulang
  otomatis. Tugas yang sudah **Selesai** juga bisa diklik untuk diedit. Ada
  juga tombol **Hapus tugas** (dengan konfirmasi) di form edit.

## Catatan

- Ikon PWA (`public/icon-192.png`, `public/icon-512.png`) belum disertakan —
  tambahkan logo kamu sendiri di folder `public/` dengan nama tersebut
  sebelum build produksi, atau ubah referensinya di `vite.config.js`.
- Reminder WA hanya men-generate teks siap salin (sesuai asumsi PRD), belum
  mengirim otomatis ke WhatsApp — itu butuh integrasi WhatsApp Business API
  terpisah kalau mau dikembangkan lebih lanjut.
