import { useState } from "react";
import { X } from "lucide-react";
import { NAVY, RED, GREEN, COLOR_OPTIONS, ICON_OPTIONS, SHADOW_LG } from "../lib/constants";
import { todayISO } from "../lib/format";
import CatIcon from "./CatIcon";

export function ModalShell({ onClose, children, title }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(15,23,42,0.45)", animation: "ftFadeIn 0.15s ease-out" }}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        style={{ animation: "ftSlideUp 0.2s ease-out", boxShadow: SHADOW_LG }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-base font-medium" style={{ color: NAVY }}>{title}</div>
          <button onClick={onClose} className="text-slate-400"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, error }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {children}
      {error && <div className="text-xs mt-1" style={{ color: RED }}>{error}</div>}
    </div>
  );
}

function friendlyError(err) {
  if (!err) return "";
  const msg = err.message || String(err);
  if (msg.includes("duplicate key") || msg.includes("already exists")) {
    return "Sudah ada data dengan nama yang sama.";
  }
  if (msg.toLowerCase().includes("row-level security") || msg.toLowerCase().includes("policy")) {
    return "Sesi login bermasalah. Coba muat ulang halaman lalu masuk lagi.";
  }
  if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to fetch")) {
    return "Koneksi bermasalah. Periksa internet Anda lalu coba lagi.";
  }
  return "Gagal menyimpan: " + msg;
}

export function TxModal({ categories, initial, onClose, onSave }) {
  const [type, setType] = useState(initial?.type || "expense");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [categoryId, setCategoryId] = useState(initial?.category_id || "");
  const [item, setItem] = useState(initial?.item || "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const options = categories.filter((c) => c.type === type);

  async function submit() {
    const errs = {};
    if (!categoryId) errs.categoryId = "Kategori wajib diisi";
    if (!amount || Number(amount) <= 0) errs.amount = "Nominal harus lebih dari 0";
    if (!item.trim()) errs.item = "Item wajib diisi";
    setErrors(errs);
    setSubmitError("");
    if (Object.keys(errs).length) return;
    setSaving(true);
    const err = await onSave({
      id: initial?.id,
      date,
      category_id: categoryId,
      item: item.trim(),
      amount: Number(amount),
      type,
    });
    setSaving(false);
    if (err) setSubmitError(friendlyError(err));
  }

  return (
    <ModalShell onClose={onClose} title={initial ? "Ubah transaksi" : "Tambah transaksi"}>
      <div className="space-y-4">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
          {["expense", "income"].map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setCategoryId(""); }}
              className="flex-1 py-2 text-sm"
              style={{ background: type === t ? (t === "income" ? GREEN : RED) : "white", color: type === t ? "white" : "#64748B" }}
            >
              {t === "income" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>
        <Field label="Tanggal">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ft-input" />
        </Field>
        <Field label="Kategori" error={errors.categoryId}>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="ft-input">
            <option value="">Pilih kategori</option>
            {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Item" error={errors.item}>
          <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Mis. Belanja bulanan" className="ft-input" />
        </Field>
        <Field label="Nominal" error={errors.amount}>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="ft-input" />
        </Field>
        {submitError && (
          <div className="text-xs rounded-lg px-3 py-2" style={{ color: RED, background: "rgba(239,68,68,0.08)" }}>
            {submitError}
          </div>
        )}
        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60"
          style={{ background: NAVY }}
        >
          {saving ? "Menyimpan..." : initial ? "Simpan perubahan" : "Simpan transaksi"}
        </button>
      </div>
      <style>{`.ft-input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #E2E8F0; font-size: 14px; outline: none; } .ft-input:focus { border-color: ${NAVY}; }`}</style>
    </ModalShell>
  );
}

export function CatModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState(initial?.type || "expense");
  const [color, setColor] = useState(initial?.color || COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState(initial?.icon || ICON_OPTIONS[0]);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) { setError("Nama kategori wajib diisi"); return; }
    setError("");
    setSubmitError("");
    setSaving(true);
    const err = await onSave({ id: initial?.id, name: name.trim(), type, color, icon, locked: initial?.locked || false });
    setSaving(false);
    if (err) setSubmitError(friendlyError(err));
  }

  return (
    <ModalShell onClose={onClose} title={initial ? "Ubah kategori" : "Tambah kategori"}>
      <div className="space-y-4">
        <Field label="Nama kategori" error={error}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mis. Pendidikan" className="ft-input2" />
        </Field>
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
          {["expense", "income"].map((t) => (
            <button
              key={t} onClick={() => setType(t)} disabled={initial?.locked}
              className="flex-1 py-2 text-sm disabled:opacity-50"
              style={{ background: type === t ? NAVY : "white", color: type === t ? "white" : "#64748B" }}
            >
              {t === "income" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-2 block">Ikon</label>
          <div className="flex gap-2 flex-wrap">
            {ICON_OPTIONS.map((k) => (
              <button
                key={k} onClick={() => setIcon(k)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: icon === k ? color + "26" : "#F1F5F9", border: icon === k ? "2px solid " + color : "2px solid transparent" }}
              >
                <CatIcon iconKey={k} size={16} color={icon === k ? color : "#94A3B8"} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-2 block">Warna</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c} onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: c, border: color === c ? "2px solid " + NAVY : "2px solid transparent" }}
              />
            ))}
          </div>
        </div>
        {submitError && (
          <div className="text-xs rounded-lg px-3 py-2" style={{ color: RED, background: "rgba(239,68,68,0.08)" }}>
            {submitError}
          </div>
        )}
        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60"
          style={{ background: NAVY }}
        >
          {saving ? "Menyimpan..." : "Simpan kategori"}
        </button>
      </div>
      <style>{`.ft-input2 { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #E2E8F0; font-size: 14px; outline: none; } .ft-input2:focus { border-color: ${NAVY}; }`}</style>
    </ModalShell>
  );
}
