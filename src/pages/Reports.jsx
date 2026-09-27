import { useMemo, useState } from "react";
import { ShoppingBag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid, ComposedChart, Line, ReferenceLine,
} from "recharts";
import { NAVY, GREEN, RED, PAPER, MONTHS } from "../lib/constants";
import { idr, idrShort } from "../lib/format";
import CatIcon from "../components/CatIcon";

function ChartCard({ title, Icon, children }) {
  return (
    <div className="ft-card bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={15} color="#64748B" />}
        <div className="text-sm font-medium" style={{ color: NAVY }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <div className="text-center text-slate-400 py-16 text-sm">Belum ada data untuk periode ini</div>;
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: PAPER }}>
      <div className="text-[11px] text-slate-500 mb-0.5">{label}</div>
      <div className="ft-num text-xs font-medium" style={{ color: NAVY }}>{value}</div>
    </div>
  );
}

export default function Reports({ categories, transactions }) {
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const catById = useMemo(() => {
    const m = {};
    categories.forEach((c) => (m[c.id] = c));
    return m;
  }, [categories]);

  const years = useMemo(() => {
    const s = new Set(transactions.map((t) => t.date.slice(0, 4)));
    s.add(year);
    return Array.from(s).sort();
  }, [transactions, year]);

  const inYear = transactions.filter((t) => t.date.startsWith(year));

  const pieData = useMemo(() => {
    const sums = {};
    inYear.filter((t) => t.type === "expense").forEach((t) => {
      sums[t.category_id] = (sums[t.category_id] || 0) + t.amount;
    });
    return Object.entries(sums).map(([id, value]) => ({ name: catById[id]?.name, value, color: catById[id]?.color }));
  }, [inYear, catById]);

  const monthlyOverview = useMemo(() => {
    const arr = MONTHS.map((m) => ({ month: m, income: 0, expense: 0 }));
    inYear.forEach((t) => {
      const mi = parseInt(t.date.slice(5, 7), 10) - 1;
      arr[mi][t.type] += t.amount;
    });
    return arr;
  }, [inYear]);

  const perCategory = useMemo(() => {
    return categories
      .map((c) => {
        const monthly = MONTHS.map((m) => ({ month: m, amount: 0 }));
        inYear.filter((t) => t.category_id === c.id).forEach((t) => {
          const mi = parseInt(t.date.slice(5, 7), 10) - 1;
          monthly[mi].amount += t.amount;
        });
        let cum = 0;
        monthly.forEach((row) => { cum += row.amount; row.cumulative = cum; });
        const total = cum;
        const average = total / 12;
        const maxRow = monthly.reduce((a, b) => (b.amount > a.amount ? b : a), monthly[0]);
        return { cat: c, monthly, total, average, maxRow };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [inYear, categories]);

  const grandTotal = perCategory.reduce((s, r) => s + (r.cat.type === "expense" ? r.total : 0), 0);

  return (
    <div className="space-y-5">
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="text-sm px-3 py-2 rounded-xl bg-white"
        style={{ border: "1px solid #E2E8F0", color: NAVY }}
      >
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>

      <ChartCard title="Pengeluaran terbesar per kategori" Icon={ShoppingBag}>
        {pieData.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => idr(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Pemasukan per bulan" Icon={ArrowUpRight}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyOverview}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => idrShort(v)} />
            <Tooltip formatter={(v) => idr(v)} />
            <Bar dataKey="income" fill={GREEN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Pengeluaran per bulan" Icon={ArrowDownRight}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyOverview}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => idrShort(v)} />
            <Tooltip formatter={(v) => idr(v)} />
            <Bar dataKey="expense" fill={RED} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div>
        <div className="text-sm font-medium mb-3 mt-2" style={{ color: NAVY }}>Detail per kategori &middot; tren bulanan</div>
        <div className="space-y-4">
          {perCategory.length === 0 && (
            <div className="ft-card bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}><EmptyChart /></div>
          )}
          {perCategory.map(({ cat, monthly, total, average, maxRow }) => {
            const share = cat.type === "expense" && grandTotal > 0 ? Math.round((total / grandTotal) * 100) : null;
            return (
              <div key={cat.id} className="ft-card bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: cat.color + "1A" }}>
                      <CatIcon iconKey={cat.icon} size={16} color={cat.color} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: NAVY }}>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {share !== null && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "#64748B", background: "#F1F5F9" }}>
                        {share}% dari total keluar
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        color: cat.type === "income" ? GREEN : RED,
                        background: cat.type === "income" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      }}
                    >
                      {cat.type === "income" ? "Pemasukan" : "Pengeluaran"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <MiniStat label="Total tahun ini" value={idr(total)} />
                  <MiniStat label="Rata-rata / bulan" value={idr(average)} />
                  <MiniStat label="Bulan tertinggi" value={`${maxRow.month} \u00b7 ${idr(maxRow.amount)}`} />
                </div>

                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={monthly} margin={{ left: 0, right: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => idrShort(v)} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => idrShort(v)} />
                    <Tooltip formatter={(v) => idr(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine
                      yAxisId="left" y={average} stroke="#94A3B8" strokeDasharray="4 4"
                      label={{ value: "Rata-rata", position: "insideTopLeft", fontSize: 10, fill: "#94A3B8" }}
                    />
                    <Bar yAxisId="left" dataKey="amount" name="Per bulan" fill={cat.color} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" dataKey="cumulative" name="Kumulatif" stroke={NAVY} strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
