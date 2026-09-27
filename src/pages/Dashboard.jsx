import { useMemo } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { NAVY, GREEN, RED, SHADOW_LG, MONTHS } from "../lib/constants";
import { idr, idrShort, formatDate, monthKey } from "../lib/format";
import CatIcon from "../components/CatIcon";

function StatCard({ label, value, Icon, tone, delta }) {
  const color = tone === "income" ? GREEN : tone === "expense" ? RED : NAVY;
  const bg = tone === "income" ? "rgba(16,185,129,0.1)" : tone === "expense" ? "rgba(239,68,68,0.1)" : "rgba(30,41,59,0.06)";
  return (
    <div className="ft-card bg-white rounded-2xl p-5 flex-1 min-w-[150px]" style={{ border: "1px solid #E2E8F0" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: bg }}>
          <Icon size={16} style={{ color }} />
        </div>
        {delta && (
          <span
            className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full"
            style={{ color: delta.good ? GREEN : RED, background: delta.good ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}
          >
            {delta.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta.pct}%
          </span>
        )}
      </div>
      <div className="text-slate-500 text-sm mb-1">{label}</div>
      <div className="ft-num text-2xl font-semibold" style={{ color }}>{idr(value)}</div>
    </div>
  );
}

export default function Dashboard({ categories, transactions }) {
  const catById = useMemo(() => {
    const m = {};
    categories.forEach((c) => (m[c.id] = c));
    return m;
  }, [categories]);

  const withBalance = useMemo(() => {
    const asc = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    let running = 0;
    return asc.map((t) => {
      running += t.type === "income" ? t.amount : -t.amount;
      return { ...t, balance: running };
    });
  }, [transactions]);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    transactions.forEach((t) => (t.type === "income" ? (income += t.amount) : (expense += t.amount)));
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const recent = useMemo(() => [...withBalance].reverse().slice(0, 5), [withBalance]);

  const monthly = useMemo(() => {
    const m = {};
    transactions.forEach((t) => {
      const k = monthKey(t.date);
      if (!m[k]) m[k] = { income: 0, expense: 0 };
      m[k][t.type] += t.amount;
    });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ key: k, ...v }));
  }, [transactions]);

  function computeDelta(field, goodWhenUp) {
    if (monthly.length < 2) return null;
    const cur = monthly[monthly.length - 1][field];
    const prev = monthly[monthly.length - 2][field];
    if (prev === 0) return null;
    const pct = Math.round(Math.abs((cur - prev) / prev) * 100);
    const up = cur >= prev;
    return { pct, up, good: up === goodWhenUp };
  }

  const sparkline = useMemo(() => {
    const seen = {};
    withBalance.forEach((t) => { seen[monthKey(t.date)] = t.balance; });
    return Object.entries(seen).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([k, v]) => ({
      month: MONTHS[parseInt(k.slice(5, 7), 10) - 1], balance: v,
    }));
  }, [withBalance]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: NAVY, boxShadow: SHADOW_LG }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
              <Wallet size={15} /> Saldo akhir
            </div>
            <div className="ft-num text-4xl font-semibold text-white">{idr(totals.balance)}</div>
          </div>
          <div className="w-28 h-16 flex-shrink-0 hidden sm:block">
            {sparkline.length > 1 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkline}>
                  <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5EEAD4" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#5EEAD4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="balance" stroke="#5EEAD4" strokeWidth={2} fill="url(#sparkFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full" style={{ background: GREEN }} /> Masuk {idrShort(totals.income)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full" style={{ background: RED }} /> Keluar {idrShort(totals.expense)}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <StatCard label="Total pemasukan" value={totals.income} Icon={ArrowUpRight} tone="income" delta={computeDelta("income", true)} />
        <StatCard label="Total pengeluaran" value={totals.expense} Icon={ArrowDownRight} tone="expense" delta={computeDelta("expense", false)} />
      </div>

      <div className="ft-card bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
        <div className="text-sm font-medium mb-3" style={{ color: NAVY }}>Transaksi terbaru</div>
        {recent.length === 0 && <div className="text-sm text-slate-400 py-4 text-center">Belum ada transaksi</div>}
        <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
          {recent.map((t) => {
            const cat = catById[t.category_id];
            const isIncome = t.type === "income";
            return (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: (cat?.color || "#999") + "1A" }}>
                    <CatIcon iconKey={cat?.icon} size={16} color={cat?.color} />
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: NAVY }}>{t.item}</div>
                    <div className="text-xs text-slate-500">{cat?.name} &middot; {formatDate(t.date)}</div>
                  </div>
                </div>
                <div className="ft-num text-sm font-medium" style={{ color: isIncome ? GREEN : RED }}>
                  {isIncome ? "+" : "-"}{idr(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
