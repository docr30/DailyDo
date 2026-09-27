import { useState } from "react";
import { NAVY, RED, GREEN } from "../lib/constants";
import { idr } from "../lib/format";
import { ModalShell, Field } from "./Modals";
import { todayStr } from "../lib/debtMath";

function friendlyError(err) {
  if (!err) return "";
  const msg = err.message || String(err);
  if (msg.toLowerCase().includes("row-level security") || msg.toLowerCase().includes("policy")) {
    return "Sesi login bermasalah. Muat ulang halaman lalu masuk lagi.";
  }
  if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to fetch")) {
    return "Koneksi bermasalah. Periksa internet Anda lalu coba lagi.";
  }
  return "Gagal menyimpan: " + msg;
}

/**
 * Form tambah/ubah utang atau piutang. Saat menambah BARU (bukan edit) dan
 * jenisnya 'utang', pengguna bisa menyalakan opsi "Buat jadwal cicilan" untuk
 * langsung generate installments lewat onGenerateSchedule.
 */
export function DebtForm({ type, initial, onClose, onSave, onGenerateSchedule }) {
  const [counterparty, setCounterparty] = useState(initial?.counterparty || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [principal, setPrincipal] = useState(initial?.principal ?? "");
  const [interestRate, setInterestRate] = useState(initial?.interest_rate ?? 0);
  const [startDate, setStartDate] = useState(initial?.start_date || todayStr());
  const [dueDate, setDueDate] = useState(initial?.due_date || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [useSchedule, setUseSchedule] = useState(false);
  const [tenor, setTenor] = useState(12);
  const [period, setPeriod] = useState("bulanan");

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const label = type === "utang" ? "Utang" : "Piutang";
  const isEdit = !!initial?.id;

  async function submit() {
    const errs = {};
    if (!counterparty.trim()) errs.counterparty = "Nama wajib diisi";
    if (!principal || Number(principal) <= 0) errs.principal = "Nominal pokok harus lebih dari 0";
    if (!startDate) errs.startDate = "Tanggal mulai wajib diisi";
    if (useSchedule && (!tenor || Number(tenor) <= 0)) errs.tenor = "Tenor harus lebih dari 0";
    setErrors(errs);
    setSubmitError("");
    if (Object.keys(errs).length) return;

    setSaving(true);
    const payload = {
      id: initial?.id,
      type,
      counterparty: counterparty.trim(),
      description: description.trim(),
      principal: Number(principal),
      interestRate: Number(interestRate) || 0,
      startDate,
      dueDate: dueDate || null,
      notes: notes.trim(),
      status: initial?.status || "aktif",
    };
    const { data, error } = await onSave(payload);
    if (error) {
      setSaving(false);
      setSubmitError(friendlyError(error));
      return;
    }
    if (!isEdit && useSchedule && onGenerateSchedule) {
      const debtId = data?.id;
      if (debtId) {
        const genErr = await onGenerateSchedule(debtId, {
          principal: Number(principal),
          interestRate: Number(interestRate) || 0,
          tenor: Number(tenor),
          period,
          startDate,
        });
        if (genErr) {
          setSaving(false);
          setSubmitError("Data " + label.toLowerCase() + " tersimpan, tapi jadwal cicilan gagal dibuat: " + friendlyError(genErr));
          return;
        }
      }
    }
    setSaving(false);
    onClose();
  }

  return (
    <ModalShell onClose={onClose} title={isEdit ? `Ubah ${label.toLowerCase()}` : `Tambah ${label.toLowerCase()}`}>
      <div className="space-y-4">
        <Field label={type === "utang" ? "Nama pemberi utang" : "Nama penghutang"} error={errors.counterparty}>
          <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Mis. Budi / Bank ABC" className="ft-input-debt" />
        </Field>
        <Field label="Keterangan (opsional)">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mis. Pinjaman modal usaha" className="ft-input-debt" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pokok" error={errors.principal}>
            <input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="0" className="ft-input-debt" />
          </Field>
          <Field label="Bunga per tahun (%)">
            <input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="0" className="ft-input-debt" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal mulai" error={errors.startDate}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ft-input-debt" />
          </Field>
          <Field label="Jatuh tempo (opsional)">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="ft-input-debt" />
          </Field>
        </div>
        <Field label="Catatan (opsional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="ft-input-debt" />
        </Field>

        {!isEdit && (
          <div className="rounded-xl p-3" style={{ background: "#F6F7F6" }}>
            <label className="flex items-center gap-2 text-sm" style={{ color: NAVY }}>
              <input type="checkbox" checked={useSchedule} onChange={(e) => setUseSchedule(e.target.checked)} />
              Buat jadwal cicilan otomatis
            </label>
            {useSchedule && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Jumlah cicilan (tenor)" error={errors.tenor}>
                  <input type="number" value={tenor} onChange={(e) => setTenor(e.target.value)} className="ft-input-debt" />
                </Field>
                <Field label="Periode">
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="ft-input-debt">
                    <option value="bulanan">Bulanan</option>
                    <option value="mingguan">Mingguan</option>
                  </select>
                </Field>
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="text-xs rounded-lg px-3 py-2" style={{ color: RED, background: "rgba(239,68,68,0.08)" }}>{submitError}</div>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60"
          style={{ background: NAVY }}
        >
          {saving ? "Menyimpan..." : isEdit ? "Simpan perubahan" : `Simpan ${label.toLowerCase()}`}
        </button>
      </div>
      <style>{`.ft-input-debt { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #E2E8F0; font-size: 14px; outline: none; } .ft-input-debt:focus { border-color: ${NAVY}; }`}</style>
    </ModalShell>
  );
}

/** Form catat pembayaran untuk satu baris cicilan. */
export function InstallmentPaymentModal({ installment, onClose, onSave }) {
  const [amount, setAmount] = useState(installment.amount);
  const [paidAt, setPaidAt] = useState(todayStr());
  const [method, setMethod] = useState("Transfer");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!amount || Number(amount) <= 0) { setError("Nominal harus lebih dari 0"); return; }
    setError("");
    setSaving(true);
    const err = await onSave({ amount: Number(amount), paidAt, method, notes: notes.trim() });
    setSaving(false);
    if (err) setError(err.message || String(err));
    else onClose();
  }

  return (
    <ModalShell onClose={onClose} title={`Bayar cicilan #${installment.installment_number}`}>
      <div className="space-y-4">
        <div className="rounded-xl p-3 text-xs" style={{ background: "#F6F7F6", color: "#64748B" }}>
          Jatuh tempo {installment.due_date} &middot; tagihan {idr(installment.amount)}
        </div>
        <Field label="Nominal dibayar" error={error}>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="ft-input-pay" />
        </Field>
        <Field label="Tanggal bayar">
          <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="ft-input-pay" />
        </Field>
        <Field label="Metode">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="ft-input-pay">
            <option>Transfer</option>
            <option>Tunai</option>
            <option>E-wallet</option>
            <option>Lainnya</option>
          </select>
        </Field>
        <Field label="Catatan (opsional)">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="ft-input-pay" />
        </Field>
        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60"
          style={{ background: GREEN }}
        >
          {saving ? "Menyimpan..." : "Catat pembayaran"}
        </button>
      </div>
      <style>{`.ft-input-pay { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid #E2E8F0; font-size: 14px; outline: none; } .ft-input-pay:focus { border-color: ${NAVY}; }`}</style>
    </ModalShell>
  );
}
