import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toKey, today } from "../utils/date";
import { assessPriority } from "../utils/priorityEngine";

// Loads all tasks for the current user, runs a client-side rollover
// fallback (in case the scheduled Edge Function hasn't run yet), and
// exposes CRUD helpers backed by Supabase / PostgREST + RLS.
export function useTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setTasks(data ?? []);
    setLoading(false);
  }, [userId]);

  // Client-side rollover fallback: if the daily scheduled Edge Function
  // (see supabase/functions/rollover-tasks) missed its run, push any
  // overdue non-done tasks to today when the app loads.
  const rolloverIfNeeded = useCallback(async () => {
    if (!userId) return;
    const todayKey = toKey(today);
    const { error } = await supabase
      .from("tasks")
      .update({ date: todayKey })
      .lt("date", todayKey)
      .neq("status", "done");
    if (error) console.warn("Rollover fallback gagal:", error.message);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    rolloverIfNeeded().then(fetchTasks);
  }, [userId, rolloverIfNeeded, fetchTasks]);

  async function addTask({
    description,
    assigner,
    date,
    deadline = null,
    effortEstimate = null,
    impactDone = null,
    impactLate = null,
    strategicFit = null,
    blocksOthers = null,
    blocksWho = "",
    complianceRisk = null,
    delegable = null,
    stakeholders = "",
    concurrentTasks = "",
  }) {
    const assessment = assessPriority({
      description,
      assigner,
      deadline,
      effortEstimate,
      impactDone,
      impactLate,
      strategicFit,
      blocksOthers,
      blocksWho,
      complianceRisk,
      delegable,
      stakeholders,
      concurrentTasks,
    });

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        description,
        assigner: assigner || "Diri Sendiri",
        status: "on_going",
        date,
        original_date: date,
        deadline: deadline || null,
        effort_estimate: effortEstimate || null,
        impact_done: impactDone ?? null,
        impact_late: impactLate ?? null,
        strategic_fit: strategicFit ?? null,
        blocks_others: blocksOthers,
        blocks_who: blocksWho || null,
        compliance_risk: complianceRisk,
        delegable: delegable,
        stakeholders: stakeholders || null,
        concurrent_tasks: concurrentTasks || null,
        priority_score: assessment.priority_score,
        priority_level: assessment.priority_level,
        priority_assessment: assessment,
      })
      .select()
      .single();
    if (error) throw error;
    setTasks((prev) => [data, ...prev]);
    return data;
  }

  async function updateStatus(id, status, dateKeyForCompletion) {
    const patch = {
      status,
      completed_date: status === "done" ? dateKeyForCompletion : null,
    };
    const { data, error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    return data;
  }

  async function deleteTask(id) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return { tasks, loading, error, addTask, updateStatus, deleteTask, refetch: fetchTasks };
}
