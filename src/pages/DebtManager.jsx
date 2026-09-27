import { useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, CheckCircle2, Wallet, HandCoins, CalendarClock,
  Receipt, Lightbulb,
} from "lucide-react";
import { NAVY, GREEN, RED, PAPER, SHADOW_SM } from "../lib/constants";
import { idr, formatDate } from "../lib/format";
import { DebtForm, InstallmentPaymentModal } from "../components/DebtModals";
import { DebtPieChart, DueDateBarChart, PaymentTrendLineChart, ReceivableAgingChart } from "../components/DebtCharts";
import { buildAnalytics, buildInsights, effectiveStatus, outstandingPrincipal, todayStr } from "../lib/debtMath";

const TABS = [
  { key: "ringkasan", label: "Ringkasan" },
  { key: "utang", label: "Utang" },
  { key: "piutang", label: "Piutang" },
  { key: "cicilan", label: "Cicilan" },
  { key: "pembayaran", label: "Pembayaran" },
  { key: "analitik", label: "Analitik" },
];

function computeMonthlyIncome(transactions) {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const months = new Set();
  let total = 0;
  transactions.forEach((t) => {
    if (t.type !== "income") return;
    if (new Date(t.date + "T00:00:00") >= cutoff) {
      total += Number(t.amount);
      months.add(t.date.slice(0, 7));
    }
  });
  return total / (months.size || 1);
}

function StatusBadge({ status }) {
  const map = {
    aktif: { bg: "rgba(30,41,59,0.08)", color: NAVY, label: "Aktif" },
    lunas: { bg: "rgba(16,185,129,0.1)", color: GREEN, label: "Lunas" },
    overdue: { bg: "rgba(239,68,68,0.1)", color: RED, label: "Jatuh tempo" },
    pending: { bg: "rgba(245,158,11,0.12)", color: "#B45309", label: "Menunggu" },
    paid: { bg: "rgba(16,185,129,0.1)", color: GREEN, label: "Dibayar" },
  };
  const s = map[status] || map.aktif;
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function MiniStat({ label, value, tone }) {
  const color = tone === "bad" ? RED : tone === "good" ? GREEN : NAVY;
  return (
    <div className="ft-card bg-white rounded-2xl p-4" style={{ border: "1px solid #E2E8F0" }}>
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <div className="ft-num text-lg font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

export default function DebtManager({ debtsApi, installmentsApi, paymentsApi, transactions }) {
  const [tab, setTab] = useState("ringkasan");
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [debtFormType, setDebtFormType] = useState("utang");
  const [editingDebt, setEditingDebt] = useState(null);
  const [payingInstallment, setPayingInstallment] = useState(null);
  const [manualIncome, setManualIncome] = useState("");

  const { debts, addDebt, updateDebt, markLunas, deleteDebt } = debtsApi;
  const { installments, generateSchedule, deleteInstallment, markScheduleSettledEarly } = installmentsApi;
  const { payments, payInstallment, deletePayment } = paymentsApi;

  const debtById = useMemo(() => {
    const m = {};
    debts.forEach((d) => (m[d.id] = d));
    return m;
  }, [debts]);

  const autoIncome = useMemo(() => computeMonthlyIncome(transactions), [transactions]);
  const monthlyIncome = manualIncome !== "" ? Number(manualIncome) : autoIncome;

  const analytics = useMemo(
    () => buildAnalytics({ debts, installments, payments, monthlyIncome }),
    [debts, installments, payments, monthlyIncome]
  );
  const insights = useMemo(() => buildInsights(analytics, debts, payments), [analytics, debts, payments]);

  const utangList = debts.filter((d) => d.type === "utang");
  const piutangList = debts.filter((d) => d.type === "piutang");

  function openAddDebt(type) {
    setDebtFormType(type);
    setEditingDebt(null);
    setShowDebtForm(true);
  }
  function openEditDebt(debt) {
    setDebtFormType(debt.type);
    setEditingDebt(debt);
    setShowDebtForm(true);
  }

  async function handleSaveDebt(payload) {
    if (payload.id) {
      const err = await updateDebt(payload.id, payload);
      return { data: { id: payload.id }, error: err };
    }
    return addDebt(payload);
  }

  async function handleMarkLunasEarly(debt) {
    await markLunas(debt.id);
    await markScheduleSettledEarly(debt.id);
  }

  async function handlePayInstallment(payload) {
    const inst = payingInstallment;
    const err = await payInstallment({
      debtId: inst.debt_id,
      installmentId: inst.id,
      amount: payload.amount,
      paidAt: payload.paidAt,
      method: payload.method,
      notes: payload.notes,
    });
    // payInstallment menulis ke tabel installments juga, tapi array `installments`
    // di sini dikelola oleh hook terpisah (installmentsApi) — refresh manual supaya
    // tab Cicilan langsung menunjukkan status "Dibayar" tanpa perlu reload halaman.
    if (!err) await installmentsApi.refresh();
    return err;
  }

  async function handleDeletePayment(id) {
    const err = await deletePayment(id);
    if (!err) await installmentsApi.refresh();
    return err;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-shrink-0 text-sm px-4 py-2 rounded-xl"
            style={{
              background: tab === t.key ? NAVY : "white",
              color: tab === t.key ? "white" : "#475569",
              border: tab === t.key ? "1px solid " + NAVY : "1px solid #E2E8F0",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ringkasan" && (
        <RingkasanTab analytics={analytics} insights={insights} monthlyIncome={monthlyIncome} manualIncome={manualIncome} setManualIncome={setManualIncome} autoIncome={autoIncome} />
      )}

      {tab === "utang" && (
        <DebtListTab
          type="utang"
          list={utangList}
          payments={payments}
          onAdd={() => openAddDebt("utang")}
          onEdit={openEditDebt}
          onMarkLunas={handleMarkLunasEarly}
          onDelete={deleteDebt}
        />
      )}

      {tab === "piutang" && (
        <DebtListTab
          type="piutang"
          list={piutangList}
          payments={payments}
          onAdd={() => openAddDebt("piutang")}
          onEdit={openEditDebt}
          onMarkLunas={handleMarkLunasEarly}
          onDelete={deleteDebt}
        />
      )}

      {tab === "cicilan" && (
        <CicilanTab
          installments={installments}
          debtById={debtById}
          onPay={(inst) => setPayingInstallment(inst)}
          onDelete={deleteInstallment}
        />
      )}

      {tab === "pembayaran" && (
        <PembayaranTab payments={payments} installments={installments} debtById={debtById} onDelete={handleDeletePayment} />
      )}

      {tab === "analitik" && <AnalitikTab analytics={analytics} insights={insights} />}

      {showDebtForm && (
        <DebtForm
          type={debtFormType}
          initial={editingDebt}
          onClose={() => setShowDebtForm(false)}
          onSave={handleSaveDebt}
          onGenerateSchedule={generateSchedule}
        />
      )}

      {payingInstallment && (
        <InstallmentPaymentModal
          installment={payingInstallment}
          onClose={() => setPayingInstallment(null)}
          onSave={handlePayInstallment}
        />
      )}
    </div>
  );
}

function RingkasanTab({ analytics, insights, monthlyIncome, manualIncome, setManualIncome, autoIncome }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Utang" value={idr(analytics.totalUtang)} tone="bad" />
        <MiniStat label="Total Piutang" value={idr(analytics.totalPiutang)} tone="good" />
        <MiniStat label="Net Debt" value={idr(analytics.netDebt)} tone={analytics.netDebt > 0 ? "bad" : "good"} />
        <MiniStat label="Progres Pelunasan" value={Math.round(analytics.progress) + "%"} />
        <MiniStat label="Jatuh Tempo 7 Hari" value={idr(analytics.upcoming7)} />
        <MiniStat label="Jatuh Tempo 30 Hari" value={idr(analytics.upcoming30)} />
        <MiniStat label={`Overdue (${analytics.overdueCount})`} value={idr(analytics.overdueAmount)} tone={analytics.overdueAmount > 0 ? "bad" : undefined} />
        <MiniStat label="Cicilan Bulan Ini" value={idr(analytics.cicilanBulanIni)} />
      </div>

      <div className="ft-card bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium" style={{ color: NAVY }}>Rasio Utang terhadap Pendapatan</div>
          <span className="ft-num text-lg font-semibold" style={{ color: NAVY }}>
            {analytics.debtToIncome !== null ? Math.round(analytics.debtToIncome) + "%" : "-"}
          </span>
        </div>
        <div className="text-xs text-slate-500 mb-2">
          Estimasi pendapatan bulanan: {idr(monthlyIncome)} {manualIncome === "" ? "(otomatis dari transaksi 3 bulan terakhir)" : "(input manual)"}
        </div>
        <input
          type="number"
          value={manualIncome}
          onChange={(e) => setManualIncome(e.target.value)}
          placeholder={`Override manual, mis. ${Math.round(autoIncome)}`}
          className="w-full text-sm px-3 py-2 rounded-lg"
          style={{ border: "1px solid #E2E8F0" }}
        />
      </div>

      <InsightList insights={insights} />
    </div>
  );
}

function InsightList({ insights }) {
  return (
    <div className="ft-card bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={15} color="#B45309" />
        <div className="text-sm font-medium" style={{ color: NAVY }}>Insight otomatis</div>
      </div>
      <ul className="space-y-2">
        {insights.map((text, i) => (
          <li key={i} className="text-sm text-slate-600 flex gap-2">
            <span style={{ color: "#B45309" }}>&bull;</span> {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DebtListTab({ type, list, payments, onAdd, onEdit, onMarkLunas, onDelete }) {
  const Icon = type === "utang" ? Wallet : HandCoins;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-1.5 text-white text-sm px-4 py-2.5 rounded-xl" style={{ background: NAVY, boxShadow: SHADOW_SM }}>
          <Plus size={16} /> Tambah {type}
        </button>
      </div>

      {list.length === 0 && (
        <div className="ft-card bg-white rounded-2xl p-10 text-center" style={{ border: "1px solid #E2E8F0" }}>
          <Icon size={26} style={{ margin: "0 auto 8px", display: "block" }} color="#CBD5E1" />
          <div className="text-sm text-slate-400">Belum ada data {type}</div>
        </div>
      )}

      <div className="space-y-3">
        {list.map((d) => {
          const outstanding = d.status === "lunas" ? 0 : outstandingPrincipal(d, payments);
          const status = effectiveStatus(d);
          return (
            <div key={d.id} className="ft-card bg-white rounded-2xl p-4" style={{ border: "1px solid #E2E8F0" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate" style={{ color: NAVY }}>{d.counterparty}</div>
                    <StatusBadge status={status} />
                  </div>
                  {d.description && <div className="text-xs text-slate-500 mt-0.5">{d.description}</div>}
                  <div className="text-xs text-slate-500 mt-1">
                    Mulai {formatDate(d.start_date)}{d.due_date ? ` \u00b7 jatuh tempo ${formatDate(d.due_date)}` : ""}
                    {Number(d.interest_rate) > 0 ? ` \u00b7 bunga ${d.interest_rate}%/tahun` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => onEdit(d)} className="text-slate-400 hover:text-slate-600"><Pencil size={15} /></button>
                  <button onClick={() => onDelete(d.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                <div>
                  <div className="text-[11px] text-slate-500">Sisa pokok</div>
                  <div className="ft-num text-base font-semibold" style={{ color: type === "utang" ? RED : GREEN }}>{idr(outstanding)}</div>
                </div>
                {status !== "lunas" && (
                  <button
                    onClick={() => onMarkLunas(d)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg"
                    style={{ color: GREEN, border: "1px solid #A7F3D0", background: "rgba(16,185,129,0.06)" }}
                  >
                    <CheckCircle2 size={14} /> Tandai lunas
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CicilanTab({ installments, debtById, onPay, onDelete }) {
  const sorted = [...installments].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const today = todayStr();

  if (sorted.length === 0) {
    return (
      <div className="ft-card bg-white rounded-2xl p-10 text-center" style={{ border: "1px solid #E2E8F0" }}>
        <CalendarClock size={26} style={{ margin: "0 auto 8px", display: "block" }} color="#CBD5E1" />
        <div className="text-sm text-slate-400">Belum ada jadwal cicilan. Buat lewat form tambah utang.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((inst) => {
        const debt = debtById[inst.debt_id];
        const displayStatus = inst.status === "pending" && inst.due_date < today ? "overdue" : inst.status;
        return (
          <div key={inst.id} className="ft-card bg-white rounded-xl p-4 flex items-center justify-between gap-3" style={{ border: "1px solid #E2E8F0" }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium truncate" style={{ color: NAVY }}>
                  {debt?.counterparty || "-"} &middot; cicilan #{inst.installment_number}
                </div>
                <StatusBadge status={displayStatus} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Jatuh tempo {formatDate(inst.due_date)} &middot; pokok {idr(inst.principal_portion)} + bunga {idr(inst.interest_portion)}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="ft-num text-sm font-semibold" style={{ color: NAVY }}>{idr(inst.amount)}</div>
              {inst.status === "pending" ? (
                <button onClick={() => onPay(inst)} className="text-xs px-3 py-2 rounded-lg text-white" style={{ background: GREEN }}>
                  Bayar
                </button>
              ) : (
                <span className="text-xs text-slate-400">{inst.paid_at ? formatDate(String(inst.paid_at).slice(0, 10)) : ""}</span>
              )}
              <button
                onClick={() => { if (window.confirm("Hapus cicilan ini?")) onDelete(inst.id); }}
                className="text-slate-300 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PembayaranTab({ payments, installments, debtById, onDelete }) {
  const instById = useMemo(() => {
    const m = {};
    installments.forEach((i) => (m[i.id] = i));
    return m;
  }, [installments]);

  const sorted = [...payments].sort((a, b) => String(b.paid_at).localeCompare(String(a.paid_at)));

  if (sorted.length === 0) {
    return (
      <div className="ft-card bg-white rounded-2xl p-10 text-center" style={{ border: "1px solid #E2E8F0" }}>
        <Receipt size={26} style={{ margin: "0 auto 8px", display: "block" }} color="#CBD5E1" />
        <div className="text-sm text-slate-400">Belum ada riwayat pembayaran</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((p) => {
        const debt = debtById[p.debt_id];
        const inst = p.installment_id ? instById[p.installment_id] : null;
        return (
          <div key={p.id} className="ft-card bg-white rounded-xl p-4 flex items-center justify-between gap-3" style={{ border: "1px solid #E2E8F0" }}>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: NAVY }}>
                {debt?.counterparty || "-"}{inst ? ` \u00b7 cicilan #${inst.installment_number}` : " \u00b7 pembayaran langsung"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {formatDate(String(p.paid_at).slice(0, 10))} &middot; {p.method || "-"}{p.notes ? ` \u00b7 ${p.notes}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="ft-num text-sm font-semibold" style={{ color: GREEN }}>{idr(p.amount)}</div>
              <button
                onClick={() => { if (window.confirm("Hapus riwayat pembayaran ini?")) onDelete(p.id); }}
                className="text-slate-300 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="ft-card bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
      <div className="text-sm font-medium mb-3" style={{ color: NAVY }}>{title}</div>
      {children}
    </div>
  );
}

function AnalitikTab({ analytics, insights }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Utang" value={idr(analytics.totalUtang)} tone="bad" />
        <MiniStat label="Total Piutang" value={idr(analytics.totalPiutang)} tone="good" />
        <MiniStat label="Net Debt" value={idr(analytics.netDebt)} tone={analytics.netDebt > 0 ? "bad" : "good"} />
        <MiniStat label="Progres Pelunasan" value={Math.round(analytics.progress) + "%"} />
      </div>

      <ChartCard title="Komposisi utang per pemberi utang">
        <DebtPieChart composition={analytics.composition} />
      </ChartCard>

      <ChartCard title="Jatuh tempo cicilan per bulan (6 bulan ke depan)">
        <DueDateBarChart dueByMonth={analytics.dueByMonth} />
      </ChartCard>

      <ChartCard title="Tren pembayaran cicilan per bulan">
        <PaymentTrendLineChart paymentTrend={analytics.paymentTrend} />
      </ChartCard>

      <ChartCard title="Aging piutang (umur sejak tanggal mulai)">
        <ReceivableAgingChart agingBuckets={analytics.agingBuckets} />
      </ChartCard>

      <InsightList insights={insights} />

      <div className="text-xs text-slate-400 px-1">
        Simulasi Snowball/Avalanche/What-if dan ekspor CSV/PDF belum tersedia di versi ini — bisa ditambahkan menyusul bila diperlukan.
      </div>
    </div>
  );
}
