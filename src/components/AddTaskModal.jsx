import React, { useMemo, useState } from "react";
import { X, ChevronDown, Flame, AlertTriangle, Gauge, Leaf } from "lucide-react";
import { assessPriority, EFFORT_OPTIONS, SCALE_LABELS } from "../utils/priorityEngine.js";

const PREVIEW_META = {
  P0: { label: "P0 · Critical", icon: Flame, text: "text-priorityP0 dark:text-priorityP0-dark", bg: "bg-priorityP0/10 dark:bg-priorityP0-dark/10", border: "border-priorityP0 dark:border-priorityP0-dark" },
  P1: { label: "P1 · High", icon: AlertTriangle, text: "text-priorityP1 dark:text-priorityP1-dark", bg: "bg-priorityP1/10 dark:bg-priorityP1-dark/10", border: "border-priorityP1 dark:border-priorityP1-dark" },
  P2: { label: "P2 · Medium", icon: Gauge, text: "text-priorityP2 dark:text-priorityP2-dark", bg: "bg-priorityP2/10 dark:bg-priorityP2-dark/10", border: "border-priorityP2 dark:border-priorityP2-dark" },
  P3: { label: "P3 · Low", icon: Leaf, text: "text-priorityP3 dark:text-priorityP3-dark", bg: "bg-priorityP3/10 dark:bg-priorityP3-dark/10", border: "border-priorityP3 dark:border-priorityP3-dark" },
};

const inputClass =
  "w-full rounded-lg px-3 py-2 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:focus:ring-accent-dark/40 bg-surface-raised dark:bg-surface-dark-raised border border-border dark:border-border-dark text-gray-800 dark:text-gray-100";
const labelClass = "block text-xs font-medium mb-1 mt-3 text-gray-500 dark:text-gray-400";

function TriToggle({ value, onChange }) {
  const opts = [
    { v: null, label: "Belum tahu" },
    { v: true, label: "Ya" },
    { v: false, label: "Tidak" },
  ];
  return (
    <div className="flex gap-1.5">
      {opts.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            value === o.v
              ? "bg-accent dark:bg-accent-dark text-white dark:text-[#04141A] border-transparent"
              : "border-border dark:border-border-dark text-gray-500 dark:text-gray-400"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ScaleSelect({ value, onChange, placeholder }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={inputClass}
    >
      <option value="">{placeholder || "Belum tahu / lewati"}</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n} — {SCALE_LABELS[n]}
        </option>
      ))}
    </select>
  );
}

export default function AddTaskModal({ onClose, onSave, dateLabel }) {
  const [description, setDescription] = useState("");
  const [assigner, setAssigner] = useState("");
  const [deadline, setDeadline] = useState("");
  const [effortEstimate, setEffortEstimate] = useState(null);
  const [impactDone, setImpactDone] = useState(null);
  const [impactLate, setImpactLate] = useState(null);
  const [strategicFit, setStrategicFit] = useState(null);
  const [blocksOthers, setBlocksOthers] = useState(null);
  const [blocksWho, setBlocksWho] = useState("");
  const [complianceRisk, setComplianceRisk] = useState(null);
  const [delegable, setDelegable] = useState(null);
  const [stakeholders, setStakeholders] = useState("");
  const [concurrentTasks, setConcurrentTasks] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(true);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const preview = useMemo(
    () =>
      assessPriority({
        description: description || "(tugas belum diberi nama)",
        assigner,
        deadline: deadline || null,
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
      }),
    [description, assigner, deadline, effortEstimate, impactDone, impactLate, strategicFit, blocksOthers, blocksWho, complianceRisk, delegable, stakeholders, concurrentTasks]
  );
  const meta = PREVIEW_META[preview.priority_level];
  const PIcon = meta.icon;

  async function handleSave() {
    if (!description.trim()) {
      setError("Deskripsi tugas tidak boleh kosong");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        description: description.trim(),
        assigner: assigner.trim(),
        deadline: deadline || null,
        effortEstimate,
        impactDone,
        impactLate,
        strategicFit,
        blocksOthers,
        blocksWho: blocksWho.trim(),
        complianceRisk,
        delegable,
        stakeholders: stakeholders.trim(),
        concurrentTasks: concurrentTasks.trim(),
      });
    } catch (e) {
      setError(e.message || "Gagal menyimpan tugas");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/55">
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto bg-white dark:bg-surface-dark border border-border dark:border-border-dark">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Tambah Tugas</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs mb-4 text-gray-400 dark:text-gray-500">Untuk tanggal {dateLabel}</p>

        <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">Deskripsi tugas</label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (error) setError("");
          }}
          maxLength={500}
          rows={3}
          placeholder="Misal: Menyusun laporan mingguan"
          className={inputClass}
        />
        {error && <p className="text-xs mb-2 text-danger dark:text-danger-dark">{error}</p>}

        <label className={labelClass}>Diberikan oleh (opsional)</label>
        <input
          value={assigner}
          onChange={(e) => setAssigner(e.target.value)}
          maxLength={100}
          placeholder="Diri Sendiri"
          className={inputClass}
        />

        <label className={labelClass}>Deadline (opsional)</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />

        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="w-full flex items-center justify-between mt-4 mb-1 text-xs font-medium text-accent dark:text-accent-dark"
        >
          <span>Penilaian prioritas (isi untuk hasil lebih akurat)</span>
          <ChevronDown size={14} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </button>

        {showAdvanced && (
          <div className="mt-1">
            <label className={labelClass}>Estimasi effort</label>
            <select
              value={effortEstimate ?? ""}
              onChange={(e) => setEffortEstimate(e.target.value || null)}
              className={inputClass}
            >
              <option value="">Belum tahu / lewati</option>
              {EFFORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className={labelClass}>Dampak jika tugas ini selesai</label>
            <ScaleSelect value={impactDone} onChange={setImpactDone} />

            <label className={labelClass}>Dampak / konsekuensi jika terlambat</label>
            <ScaleSelect value={impactLate} onChange={setImpactLate} />

            <label className={labelClass}>Kesesuaian dengan prioritas strategis</label>
            <ScaleSelect value={strategicFit} onChange={setStrategicFit} />

            <label className={labelClass}>Apakah tugas ini menghambat pekerjaan orang lain?</label>
            <TriToggle value={blocksOthers} onChange={setBlocksOthers} />
            {blocksOthers === true && (
              <input
                value={blocksWho}
                onChange={(e) => setBlocksWho(e.target.value)}
                placeholder="Siapa yang terhambat?"
                maxLength={200}
                className={`${inputClass} mt-2`}
              />
            )}

            <label className={labelClass}>Apakah ada risiko legal / keamanan / audit?</label>
            <TriToggle value={complianceRisk} onChange={setComplianceRisk} />

            <label className={labelClass}>Apakah tugas ini bisa didelegasikan?</label>
            <TriToggle value={delegable} onChange={setDelegable} />

            <label className={labelClass}>Stakeholder yang menunggu (opsional)</label>
            <input
              value={stakeholders}
              onChange={(e) => setStakeholders(e.target.value)}
              maxLength={300}
              placeholder="Misal: atasan, klien A"
              className={inputClass}
            />

            <label className={labelClass}>Tugas lain yang sedang dikerjakan bersamaan (opsional)</label>
            <textarea
              value={concurrentTasks}
              onChange={(e) => setConcurrentTasks(e.target.value)}
              rows={2}
              placeholder="Misal: revisi proposal, rapat mingguan"
              className={inputClass}
            />
          </div>
        )}

        <div className={`flex items-center gap-2 mt-4 mb-4 px-3 py-2 rounded-lg border ${meta.bg} ${meta.border}`}>
          <PIcon size={16} className={meta.text} />
          <span className={`text-sm font-semibold ${meta.text}`}>
            Perkiraan: {meta.label} &middot; Skor {preview.priority_score.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-accent dark:bg-accent-dark text-white dark:text-[#04141A] disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan tugas"}
        </button>
      </div>
    </div>
  );
}
