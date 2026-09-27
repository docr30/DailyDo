import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useBudgeting(userId) {
  const [plans, setPlans] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [{ data: planData, error: planErr }, { data: itemData, error: itemErr }] = await Promise.all([
      supabase.from("budget_plans").select("*").order("created_at", { ascending: true }),
      supabase.from("budget_items").select("*").order("date", { ascending: true }),
    ]);
    if (!planErr) setPlans(planData || []);
    if (!itemErr) setItems(itemData || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addPlan(plan) {
    const { error } = await supabase
      .from("budget_plans")
      .insert([{ name: plan.name, target_amount: plan.targetAmount, user_id: userId }]);
    if (!error) await refresh();
    return error;
  }

  async function updatePlan(id, patch) {
    const payload = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.targetAmount !== undefined) payload.target_amount = patch.targetAmount;
    const { error } = await supabase.from("budget_plans").update(payload).eq("id", id);
    if (!error) await refresh();
    return error;
  }

  async function deletePlan(id) {
    const { error } = await supabase.from("budget_plans").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  }

  async function addItem(item) {
    const { error } = await supabase.from("budget_items").insert([{
      plan_id: item.planId,
      date: item.date,
      category_id: item.categoryId,
      item: item.item,
      amount: item.amount,
      user_id: userId,
    }]);
    if (!error) await refresh();
    return error;
  }

  async function deleteItem(id) {
    const { error } = await supabase.from("budget_items").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  }

  return { plans, items, loading, addPlan, updatePlan, deletePlan, addItem, deleteItem };
}
