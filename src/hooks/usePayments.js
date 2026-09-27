import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * CRUD untuk tabel `payments`. Membayar cicilan = insert payment lalu
 * update status installment terkait jadi 'paid' (dua langkah, dibungkus di sini
 * supaya komponen tidak perlu tahu detail keduanya).
 */
export function usePayments(userId) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("payments")
      .select("*")
      .order("paid_at", { ascending: false });
    if (!err) {
      setPayments(data || []);
      setError(null);
    } else {
      setError(err);
      console.error("Gagal memuat riwayat pembayaran:", err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  /** Bayar cicilan tertentu: catat payment + tandai installment paid. */
  async function payInstallment({ debtId, installmentId, amount, paidAt, method, notes }) {
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .insert([{ debt_id: debtId, installment_id: installmentId, amount, paid_at: paidAt, method: method || null, notes: notes || null, user_id: userId }])
      .select()
      .single();
    if (payErr) return payErr;

    const { error: instErr } = await supabase
      .from("installments")
      .update({ status: "paid", paid_at: paidAt, payment_id: payment.id })
      .eq("id", installmentId);
    if (instErr) return instErr;

    await refresh();
    return null;
  }

  /** Bayar langsung ke debt tanpa cicilan terjadwal (mis. pelunasan sebagian/penuh). */
  async function payDebtDirect({ debtId, amount, paidAt, method, notes }) {
    const { error: err } = await supabase
      .from("payments")
      .insert([{ debt_id: debtId, installment_id: null, amount, paid_at: paidAt, method: method || null, notes: notes || null, user_id: userId }]);
    if (!err) await refresh();
    return err;
  }

  /** Hapus riwayat pembayaran. Kalau payment ini terkait ke satu installment,
   * kembalikan status installment itu ke 'pending' supaya bisa dibayar ulang
   * dan tidak nyangkut menunjuk ke payment yang sudah tidak ada. */
  async function deletePayment(id) {
    const { data: existing } = await supabase.from("payments").select("installment_id").eq("id", id).single();
    const { error: err } = await supabase.from("payments").delete().eq("id", id);
    if (!err && existing?.installment_id) {
      await supabase
        .from("installments")
        .update({ status: "pending", paid_at: null, payment_id: null })
        .eq("id", existing.installment_id);
    }
    if (!err) await refresh();
    return err;
  }

  return { payments, loading, error, payInstallment, payDebtDirect, deletePayment, refresh };
}
