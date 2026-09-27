import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 1000;

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let all = [];
    let from = 0;
    let fetchErr = null;

    // Supabase/PostgREST caps each response at a max-rows setting (default 1000),
    // regardless of the range requested. Loop in pages until a page comes back
    // shorter than PAGE_SIZE, so accounts with 1000+ transactions still load fully.
    while (true) {
      const { data, error: pageErr } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (pageErr) {
        fetchErr = pageErr;
        break;
      }
      all = all.concat(data || []);
      if (!data || data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (!fetchErr) {
      setTransactions(all);
      setError(null);
    } else {
      setError(fetchErr);
      console.error("Gagal memuat transaksi:", fetchErr);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addTransaction(tx) {
    const { error: err } = await supabase.from("transactions").insert([{
      date: tx.date,
      category_id: tx.category_id,
      item: tx.item,
      amount: tx.amount,
      type: tx.type,
      user_id: userId,
    }]);
    if (!err) await refresh();
    return err;
  }

  async function updateTransaction(id, tx) {
    const { error: err } = await supabase
      .from("transactions")
      .update({
        date: tx.date,
        category_id: tx.category_id,
        item: tx.item,
        amount: tx.amount,
        type: tx.type,
      })
      .eq("id", id);
    if (!err) await refresh();
    return err;
  }

  async function deleteTransaction(id) {
    const { error: err } = await supabase.from("transactions").delete().eq("id", id);
    if (!err) await refresh();
    return err;
  }

  return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction, refresh };
}

