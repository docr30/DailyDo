// Supabase Edge Function: rollover-tasks
// Dijadwalkan (Cron) untuk berjalan tiap hari jam 00:00 waktu setempat.
// Memindahkan semua tugas yang belum "done" dan tanggalnya < hari ini
// menjadi tanggal hari ini, lewat fungsi SQL rollover_overdue_tasks().
//
// Deploy:
//   supabase functions deploy rollover-tasks
// Jadwalkan lewat Supabase Dashboard > Edge Functions > rollover-tasks > Cron,
// atau lewat SQL (pg_cron + pg_net), lihat README.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase.rpc("rollover_overdue_tasks");

  if (error) {
    console.error("Rollover gagal:", error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
