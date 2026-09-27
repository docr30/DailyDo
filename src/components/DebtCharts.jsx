import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid, LineChart, Line,
} from "recharts";
import { NAVY, RED, GREEN, MONTHS } from "../lib/constants";
import { idr, idrShort } from "../lib/format";

const PALETTE = ["#1E293B", "#EF4444", "#F59E0B", "#8B5CF6", "#3B82F6", "#10B981", "#EC4899", "#64748B"];

function monthLabel(key) {
  const [y, m] = key.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

function EmptyChart({ text }) {
  return <div className="text-center text-slate-400 py-14 text-sm">{text || "Belum ada data"}</div>;
}

export function DebtPieChart({ composition }) {
  if (!composition.length) return <EmptyChart text="Belum ada utang aktif" />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={composition} dataKey="value" nameKey="counterparty" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {composition.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => idr(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DueDateBarChart({ dueByMonth }) {
  const data = dueByMonth.map((r) => ({ label: monthLabel(r.key), total: r.total }));
  const hasData = data.some((d) => d.total > 0);
  if (!hasData) return <EmptyChart text="Tidak ada cicilan jatuh tempo dalam 6 bulan ke depan" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => idrShort(v)} />
        <Tooltip formatter={(v) => idr(v)} />
        <Bar dataKey="total" fill={NAVY} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PaymentTrendLineChart({ paymentTrend }) {
  const data = paymentTrend.map((r) => ({ label: monthLabel(r.key), total: r.total }));
  const hasData = data.some((d) => d.total > 0);
  if (!hasData) return <EmptyChart text="Belum ada riwayat pembayaran" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => idrShort(v)} />
        <Tooltip formatter={(v) => idr(v)} />
        <Line type="monotone" dataKey="total" stroke={GREEN} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ReceivableAgingChart({ agingBuckets }) {
  const data = Object.entries(agingBuckets).map(([bucket, total]) => ({ bucket, total }));
  const hasData = data.some((d) => d.total > 0);
  if (!hasData) return <EmptyChart text="Belum ada piutang outstanding" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => idrShort(v)} />
        <Tooltip formatter={(v) => idr(v)} />
        <Bar dataKey="total" fill={RED} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
