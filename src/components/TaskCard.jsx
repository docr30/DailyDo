import React from "react";
import { Flame, AlertTriangle, Gauge, Leaf, Info } from "lucide-react";

const PRIORITY_META = {
  P0: {
    label: "P0",
    icon: Flame,
    text: "text-priorityP0 dark:text-priorityP0-dark",
    border: "border-priorityP0 dark:border-priorityP0-dark",
    bg: "bg-priorityP0/10 dark:bg-priorityP0-dark/10",
    shadow: "shadow-[-6px_0_16px_-8px_rgba(220,38,38,0.45)] dark:shadow-[-6px_0_16px_-8px_rgba(255,107,107,0.45)]",
  },
  P1: {
    label: "P1",
    icon: AlertTriangle,
    text: "text-priorityP1 dark:text-priorityP1-dark",
    border: "border-priorityP1 dark:border-priorityP1-dark",
    bg: "bg-priorityP1/10 dark:bg-priorityP1-dark/10",
    shadow: "shadow-[-6px_0_16px_-8px_rgba(234,88,12,0.4)] dark:shadow-[-6px_0_16px_-8px_rgba(255,169,77,0.4)]",
  },
  P2: {
    label: "P2",
    icon: Gauge,
    text: "text-priorityP2 dark:text-priorityP2-dark",
    border: "border-priorityP2 dark:border-priorityP2-dark",
    bg: "bg-priorityP2/10 dark:bg-priorityP2-dark/10",
    shadow: "shadow-[-6px_0_16px_-8px_rgba(202,138,4,0.35)] dark:shadow-[-6px_0_16px_-8px_rgba(255,212,59,0.35)]",
  },
  P3: {
    label: "P3",
    icon: Leaf,
    text: "text-priorityP3 dark:text-priorityP3-dark",
    border: "border-priorityP3 dark:border-priorityP3-dark",
    bg: "bg-priorityP3/10 dark:bg-priorityP3-dark/10",
    shadow: "shadow-[-6px_0_16px_-8px_rgba(22,163,74,0.35)] dark:shadow-[-6px_0_16px_-8px_rgba(105,219,124,0.35)]",
  },
};

const STATUS_META = {
  on_going: {
    label: "On Going",
    text: "text-onGoing dark:text-onGoing-dark",
    border: "border-onGoing dark:border-onGoing-dark",
    bg: "bg-onGoing/10 dark:bg-onGoing-dark/10",
  },
  pending: {
    label: "Pending",
    text: "text-pending dark:text-pending-dark",
    border: "border-pending dark:border-pending-dark",
    bg: "bg-pending/10 dark:bg-pending-dark/10",
  },
  done: {
    label: "Done",
    text: "text-done dark:text-done-dark",
    border: "border-done dark:border-done-dark",
    bg: "bg-done/10 dark:bg-done-dark/10",
  },
};

export default function TaskCard({ task, onClick, onInfoClick }) {
  const level = task.priority_level && PRIORITY_META[task.priority_level] ? task.priority_level : "P2";
  const pMeta = PRIORITY_META[level];
  const sMeta = STATUS_META[task.status];
  const PIcon = pMeta.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`w-full text-left rounded-xl px-4 py-3.5 transition-all duration-150 cursor-pointer bg-white dark:bg-surface-dark border-t border-r border-b border-border dark:border-border-dark border-l-4 ${pMeta.border} ${pMeta.shadow}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pMeta.bg} ${pMeta.text} ${pMeta.border}`}
        >
          <PIcon size={11} />
          {pMeta.label}
          {typeof task.priority_score === "number" && (
            <span className="opacity-70 font-mono">· {task.priority_score.toFixed(1)}</span>
          )}
        </span>
        <span
          className={`shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${sMeta.bg} ${sMeta.text} ${sMeta.border}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${task.status === "on_going" ? "pulse-dot" : ""}`}
            style={{ background: "currentColor" }}
          />
          {sMeta.label}
        </span>
      </div>

      <p className="text-sm leading-snug text-gray-800 dark:text-gray-100">{task.description}</p>

      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-gray-400 dark:text-gray-500">dari: {task.assigner}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick?.();
          }}
          className={`flex items-center gap-1 text-[11px] font-medium ${pMeta.text}`}
        >
          <Info size={12} />
          Detail
        </button>
      </div>
    </div>
  );
}
