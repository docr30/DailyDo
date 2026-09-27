import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { fromKey, toKey, MONTH_LABELS_ID, MONTH_LABELS_FULL, DAY_LABELS_ID, today } from "../utils/date.js";

export default function Stats({ tasksApi }) {
  const { tasks } = tasksApi;
  const [statsYear, setStatsYear] = useState(today.getFullYear());
  const [statsMonthIdx, setStatsMonthIdx] = useState(today.getMonth());

  const weeklyData = useMemo(() => {
    const daysInMonth = new Date(statsYear, statsMonthIdx + 1, 0).getDate();
    const weeks = [0, 0, 0, 0, 0];
    tasks.forEach((t) => {
      if (t.status !== "done" || !t.completed_date) return;
      const d = fromKey(t.completed_date);
      if (d.getFullYear() === statsYear && d.getMonth() === statsMonthIdx) {
        weeks[Math.floor((d.getDate() - 1) / 7)] += 1;
      }
    });
    const usedWeeks = Math.ceil(daysInMonth / 7);
    return weeks.slice(0, usedWeeks).map((count, i) => ({ name: `M${i + 1}`, selesai: count }));
  }, [tasks, statsYear, statsMonthIdx]);

  const heatmapData = useMemo(() => {
    const daysInMonth = new Date(statsYear, statsMonthIdx + 1, 0).getDate();
    const firstDow = new Date(statsYear, statsMonthIdx, 1).getDay();
    const counts = {};
    tasks.forEach((t) => {
      const d = fromKey(t.date);
      if (d.getFullYear() === statsYear && d.getMonth() === statsMonthIdx) {
        counts[t.date] = (counts[t.date] || 0) + 1;
      }
    });
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const key = toKey(new Date(statsYear, statsMonthIdx, day));
      cells.push({ day, count: counts[key] || 0, key });
    }
    return cells;
  }, [tasks, statsYear, statsMonthIdx]);

  function heatClass(count) {
    if (count === 0) return "bg-surface-raised dark:bg-surface-dark-raised text-gray-400 dark:text-gray-600 border-border dark:border-border-dark";
    if (count <= 2) return "bg-onGoing/10 dark:bg-onGoing-dark/10 text-onGoing dark:text-onGoing-dark border-onGoing dark:border-onGoing-dark";
    if (count <= 4) return "bg-pending/10 dark:bg-pending-dark/10 text-pending dark:text-pending-dark border-pending dark:border-pending-dark";
    return "bg-danger/10 dark:bg-danger-dark/10 text-danger dark:text-danger-dark border-danger dark:border-danger-dark";
  }

  const cardClass = "rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark";

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-10">
      <div className={`flex items-center justify-between px-4 py-2.5 mb-3 ${cardClass}`}>
        <span className="text-[11px] font-medium tracking-wide text-gray-400 dark:text-gray-500">Filter tahun</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setStatsYear((y) => y - 1)} className="text-gray-500 dark:text-gray-400">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold font-mono w-12 text-center text-accent dark:text-accent-dark">{statsYear}</span>
          <button onClick={() => setStatsYear((y) => y + 1)} className="text-gray-500 dark:text-gray-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={`px-3 py-2.5 mb-5 ${cardClass}`}>
        <span className="block px-1 mb-2 text-[11px] font-medium tracking-wide text-gray-400 dark:text-gray-500">Filter bulan</span>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {MONTH_LABELS_ID.map((m, i) => (
            <button
              key={m}
              onClick={() => setStatsMonthIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 border transition-colors ${
                i === statsMonthIdx
                  ? "bg-accent dark:bg-accent-dark text-white dark:text-[#04141A] border-transparent"
                  : "bg-surface-raised dark:bg-surface-dark-raised text-gray-500 dark:text-gray-400 border-border dark:border-border-dark"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className={`p-4 mb-5 ${cardClass}`}>
        <p className="text-xs font-medium mb-3 text-gray-500 dark:text-gray-400">
          Tugas selesai per minggu &middot; {MONTH_LABELS_FULL[statsMonthIdx]} {statsYear}
        </p>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tw-border-opacity, #DCE3F0)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="selesai" fill="#2DE2E6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {weeklyData.every((w) => w.selesai === 0) && (
          <p className="text-center text-xs mt-2 text-gray-400 dark:text-gray-500">Belum ada data</p>
        )}
      </div>

      <div className={`p-4 ${cardClass}`}>
        <p className="text-xs font-medium mb-3 text-gray-500 dark:text-gray-400">
          Beban kerja bulanan &middot; {MONTH_LABELS_FULL[statsMonthIdx]} {statsYear}
        </p>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {DAY_LABELS_ID.map((d) => (
            <div key={d} className="text-center text-[10px] text-gray-400 dark:text-gray-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {heatmapData.map((cell, i) =>
            cell === null ? (
              <div key={i} />
            ) : (
              <div
                key={i}
                title={`${cell.day}: ${cell.count} tugas`}
                className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium font-mono border ${heatClass(cell.count)}`}
              >
                {cell.day}
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-3 mt-4 text-[10px] text-gray-400 dark:text-gray-500">
          <Legend cls="bg-surface-raised dark:bg-surface-dark-raised border-border dark:border-border-dark" label="0" />
          <Legend cls="bg-onGoing/10 dark:bg-onGoing-dark/10 border-onGoing dark:border-onGoing-dark" label="1-2" />
          <Legend cls="bg-pending/10 dark:bg-pending-dark/10 border-pending dark:border-pending-dark" label="3-4" />
          <Legend cls="bg-danger/10 dark:bg-danger-dark/10 border-danger dark:border-danger-dark" label=">4" />
        </div>
      </div>
    </div>
  );
}

function Legend({ cls, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`w-3 h-3 rounded inline-block border ${cls}`} />
      {label}
    </span>
  );
}
