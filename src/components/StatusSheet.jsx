import React from "react";
import { X, Clock, Hourglass, Check } from "lucide-react";

const OPTIONS = [
  { key: "on_going", label: "On Going", icon: Clock, colorClass: "text-onGoing dark:text-onGoing-dark", borderClass: "border-onGoing dark:border-onGoing-dark", bgClass: "bg-onGoing/10 dark:bg-onGoing-dark/10" },
  { key: "pending", label: "Pending", icon: Hourglass, colorClass: "text-pending dark:text-pending-dark", borderClass: "border-pending dark:border-pending-dark", bgClass: "bg-pending/10 dark:bg-pending-dark/10" },
  { key: "done", label: "Done", icon: Check, colorClass: "text-done dark:text-done-dark", borderClass: "border-done dark:border-done-dark", bgClass: "bg-done/10 dark:bg-done-dark/10" },
];

export default function StatusSheet({ task, onClose, onChange }) {
  if (!task) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/55">
      <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 bg-white dark:bg-surface-dark border border-border dark:border-border-dark">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Ubah Status</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">{task.description}</p>
        <div className="space-y-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isCurrent = task.status === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => onChange(opt.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
                  isCurrent
                    ? `${opt.bgClass} ${opt.borderClass} text-gray-800 dark:text-gray-100`
                    : "border-border dark:border-border-dark text-gray-500 dark:text-gray-400"
                }`}
              >
                <Icon size={16} className={opt.colorClass} />
                <span>{opt.label}</span>
                {isCurrent && <Check size={14} className={`ml-auto ${opt.colorClass}`} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
