import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";

const STATUS_LABEL = { on_going: "On Going", pending: "Pending", done: "Done" };

export default function ReminderModal({ onClose, activeTasks, dateLabel }) {
  const [copied, setCopied] = useState(false);

  const text = [
    `*Daftar Tugas - ${dateLabel}*`,
    ...activeTasks.map(
      (t, i) => `${i + 1}. [${STATUS_LABEL[t.status]}] ${t.description} (dari: ${t.assigner})`
    ),
  ].join("\n");

  function copy() {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/55">
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto bg-white dark:bg-surface-dark border border-border dark:border-border-dark">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Reminder WA</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400">
            <X size={18} />
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm rounded-lg p-3 font-sans bg-surface-raised dark:bg-surface-dark-raised border border-border dark:border-border-dark text-gray-600 dark:text-gray-300">
          {text}
        </pre>
        <button
          onClick={copy}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-accent dark:bg-accent-dark text-white dark:text-[#04141A]"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Tersalin" : "Salin Teks"}
        </button>
      </div>
    </div>
  );
}
