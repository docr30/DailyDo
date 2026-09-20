import React from "react";
import { X, Flame, AlertTriangle, Gauge, Leaf } from "lucide-react";
import { CRITERIA_LABELS } from "../utils/priorityEngine.js";

const LEVEL_META = {
  P0: {
    label: "P0 · Critical",
    icon: Flame,
    text: "text-priorityP0 dark:text-priorityP0-dark",
    bg: "bg-priorityP0/10 dark:bg-priorityP0-dark/10",
    border: "border-priorityP0 dark:border-priorityP0-dark",
    solid: "bg-priorityP0 dark:bg-priorityP0-dark",
  },
  P1: {
    label: "P1 · High",
    icon: AlertTriangle,
    text: "text-priorityP1 dark:text-priorityP1-dark",
    bg: "bg-priorityP1/10 dark:bg-priorityP1-dark/10",
    border: "border-priorityP1 dark:border-priorityP1-dark",
    solid: "bg-priorityP1 dark:bg-priorityP1-dark",
  },
  P2: {
    label: "P2 · Medium",
    icon: Gauge,
    text: "text-priorityP2 dark:text-priorityP2-dark",
    bg: "bg-priorityP2/10 dark:bg-priorityP2-dark/10",
    border: "border-priorityP2 dark:border-priorityP2-dark",
    solid: "bg-priorityP2 dark:bg-priorityP2-dark",
  },
  P3: {
    label: "P3 · Low",
    icon: Leaf,
    text: "text-priorityP3 dark:text-priorityP3-dark",
    bg: "bg-priorityP3/10 dark:bg-priorityP3-dark/10",
    border: "border-priorityP3 dark:border-priorityP3-dark",
    solid: "bg-priorityP3 dark:bg-priorityP3-dark",
  },
};

function Section({ title, children }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">{title}</p>
      {children}
    </div>
  );
}

export default function PriorityDetailSheet({ task, onClose }) {
  if (!task) return null;
  const a = task.priority_assessment;
  const meta = LEVEL_META[task.priority_level] || LEVEL_META.P2;
  const PIcon = meta.icon;

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/55">
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto bg-white dark:bg-surface-dark border border-border dark:border-border-dark">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Detail Prioritas</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm mb-3 text-gray-500 dark:text-gray-400">{task.description}</p>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold mb-4 ${meta.bg} ${meta.border} ${meta.text}`}>
          <PIcon size={15} />
          {meta.label} &middot; Skor {Number(task.priority_score ?? 0).toFixed(2)}
        </div>

        {!a ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Tugas ini belum memiliki penilaian prioritas rinci (dibuat sebelum fitur ini aktif).
          </p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {Object.entries(a.kriteria_scores || {}).map(([key, val]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{CRITERIA_LABELS[key]}</span>
                    <span className="font-mono text-gray-700 dark:text-gray-200">{val}/5</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-raised dark:bg-surface-dark-raised overflow-hidden">
                    <div className={`h-full ${meta.solid}`} style={{ width: `${(val / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <Section title="Alasan">
              <p className="text-sm text-gray-700 dark:text-gray-200">{a.alasan}</p>
            </Section>

            {a.asumsi?.length > 0 && (
              <Section title="Asumsi yang digunakan">
                <ul className="list-disc pl-4 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  {a.asumsi.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Rekomendasi Aksi">
              <p className="text-sm text-gray-700 dark:text-gray-200">{a.rekomendasi_aksi}</p>
            </Section>

            <Section title="Saran Delegasi">
              <p className="text-sm text-gray-700 dark:text-gray-200">{a.saran_delegasi}</p>
            </Section>

            <p className="text-xs mt-3 text-gray-400 dark:text-gray-500">
              Tingkat keyakinan (confidence):{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">{a.confidence}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
