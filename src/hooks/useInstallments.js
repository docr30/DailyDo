import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { generateInstallmentSchedule } from "../lib/debtMath";

/**
 * CRUD + generate jadwal untuk tabel `installments`.
 */
export function useInstallments(userId) {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let all = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    let fetchErr = null;
    // Pola yang sama seperti useTransactions: jangan andalkan satu request saja,
    // supaya akun dengan banyak cicilan tidak kena potong oleh batas server.
    while (true) {
      const { data, error: pageErr } = await supabase
        .from("installments")
        .select("*")
        .order("due_date", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (pageErr) { fetchErr = pageErr; break; }
      all = all.concat(data || []);
      if (!data || data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    if (!fetchErr) {
      setInstallments(all);
      setError(null);
    } else {
      setError(fetchErr);
      console.error("Gagal memuat cicilan:", fetchErr);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  /** Generate & simpan jadwal cicilan untuk satu debt sekaligus (bulk insert). */
  async function generateSchedule(debtId, { principal, interestRate, tenor, period, startDate }) {
    const rows = generateInstallmentSchedule({ principal, interestRate, tenor, period, startDate });
    const payload = rows.map((r) => ({ ...r, debt_id: debtId, user_id: userId }));
    const { error: err } = await supabase.from("installments").insert(payload);
    if (!err) await refresh();
    return err;
  }

  async function updateInstallment(id, patch) {
    const { error: err } = await supabase.from("installments").update(patch).eq("id", id);
    if (!err) await refresh();
    return err;
  }

  async function deleteInstallment(id) {
    const { error: err } = await supabase.from("installments").delete().eq("id", id);
    if (!err) await refresh();
    return err;
  }

  async function deleteScheduleForDebt(debtId) {
    const { error: err } = await supabase.from("installments").delete().eq("debt_id", debtId);
    if (!err) await refresh();
    return err;
  }

  /** Tandai semua cicilan yang belum dibayar milik satu debt langsung jadi 'paid'
   * — dipakai saat pengguna menandai utangnya lunas lebih awal (pelunasan sekaligus). */
  async function markScheduleSettledEarly(debtId) {
    const { error: err } = await supabase
      .from("installments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("debt_id", debtId)
      .eq("status", "pending");
    if (!err) await refresh();
    return err;
  }

  return { installments, loading, error, generateSchedule, updateInstallment, deleteInstallment, deleteScheduleForDebt, markScheduleSettledEarly, refresh };
}
