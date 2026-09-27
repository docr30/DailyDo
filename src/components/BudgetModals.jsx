import { useState } from "react";
import { NAVY } from "../lib/constants";
import { todayISO } from "../lib/format";
import { ModalShell, Field } from "./Modals";

export function BudgetPlanModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [targetAmount, setTargetAmount] = useState(initial?.target_amount ?? initial?.targetAmount ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) { setError("Nama agenda wajib diisi"); return; }
    setSaving(true);
    await onSave({
      id: initial?.id,
      name: name.trim(),
      targetAmount: targetAmount ? Number(targetAmount) : null,
    });
    setSaving(false);
  }

  return (
    <ModalShell onClose={onClose} title={initial ? "Ubah agenda" : "Agenda budgeting baru"}>
      <div className="space-y-4">
        <Field label="Nama agenda" error={error}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mis. Liburan ke Luar Kota" className="ft-input-budget" />
        </Field>
        <Field label="Target anggaran (opsional)">
          <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="Mis. 5000000" className="ft-input-budget" />
        </Field>
        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60"
          style={{ background: NAVY }}
        >
          {saving ? "Menyimpan..." : "Simpan agenda"}
        </button>
      </div>
      <style>{`.ft-input-budget { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #E2E8F0; font-size: 14px; outline: none; } .ft-input-budget:focus { border-color: ${NAVY}; }`}</style>
    </ModalShell>
  );
}

export function BudgetItemModal({ categories, onClose, onSave }) {
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function submit() {
    const errs = {};
    if (!categoryId) errs.categoryId = "Kategori wajib diisi";
    if (!amount || Number(amount) <= 0) errs.amount = "Biaya harus lebih dari 0";
    if (!item.trim()) errs.item = "Item wajib diisi";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    await onSave({ date, categoryId, item: item.trim(), amount: Number(amount) });
    setSaving(false);
  }

  return (
    <ModalShell onClose={onClose} title="Tambah item budgeting">
      <div className="space-y-4">
        <Field label="Tanggal">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ft-input-bitem" />
        </Field>
        <Field label="Kategori" error={errors.categoryId}>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="ft-input-bitem">
            <option value="">Pilih kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Item" error={errors.item}>
          <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Mis. Tiket kereta" className="ft-input-bitem" />
        </Field>
        <Field label="Estimasi biaya" error={errors.amount}>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="ft-input-bitem" />
        </Field>
        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60"
          style={{ background: NAVY }}
        >
          {saving ? "Menyimpan..." : "Simpan item"}
        </button>
      </div>
      <style>{`.ft-input-bitem { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #E2E8F0; font-size: 14px; outline: none; } .ft-input-bitem:focus { border-color: ${NAVY}; }`}</style>
    </ModalShell>
  );
}
