import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * CRUD untuk tabel `debts` (utang & piutang).
 * @param {string|undefined} userId
 */
export function useDebts(userId) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("debts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!err) {
      setDebts(data || []);
      setError(null);
    } else {
      setError(err);
      console.error("Gagal memuat utang/piutang:", err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  async function addDebt(debt) {
    const { data, error: err } = await supabase
      .from("debts")
      .insert([{
        type: debt.type,
        counterparty: debt.counterparty,
        description: debt.description || null,
        principal: debt.principal,
        interest_rate: debt.interestRate || 0,
        start_date: debt.startDate,
        due_date: debt.dueDate || null,
        status: debt.status || "aktif",
        notes: debt.notes || null,
        user_id: userId,
      }])
      .select()
      .single();
    if (!err) await refresh();
    return { data, error: err };
  }

  async function updateDebt(id, debt) {
    const { error: err } = await supabase
      .from("debts")
      .update({
        type: debt.type,
        counterparty: debt.counterparty,
        description: debt.description || null,
        principal: debt.principal,
        interest_rate: debt.interestRate || 0,
        start_date: debt.startDate,
        due_date: debt.dueDate || null,
        status: debt.status,
        notes: debt.notes || null,
      })
      .eq("id", id);
    if (!err) await refresh();
    return err;
  }

  async function markLunas(id) {
    const { error: err } = await supabase.from("debts").update({ status: "lunas" }).eq("id", id);
    if (!err) await refresh();
    return err;
  }

  async function deleteDebt(id) {
    const { error: err } = await supabase.from("debts").delete().eq("id", id);
    if (!err) await refresh();
    return err;
  }

  return { debts, loading, error, addDebt, updateDebt, markLunas, deleteDebt, refresh };
}
