import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useCategories(userId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) setCategories(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addCategory(cat) {
    const { error } = await supabase.from("categories").insert([{ ...cat, user_id: userId }]);
    if (!error) await refresh();
    return error;
  }

  async function updateCategory(id, patch) {
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (!error) await refresh();
    return error;
  }

  async function deleteCategory(id, fallbackId) {
    if (fallbackId) {
      await supabase.from("transactions").update({ category_id: fallbackId }).eq("category_id", id);
    }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  }

  return { categories, loading, addCategory, updateCategory, deleteCategory, refresh };
}
