import React from "react";
import { CalendarDays, BarChart2, User } from "lucide-react";

export default function BottomNav({ view, setView }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 sm:hidden flex justify-around py-2 z-20 bg-white dark:bg-surface-dark border-t border-border dark:border-border-dark">
      {[
        { key: "today", label: "Hari Ini", Icon: CalendarDays },
        { key: "stats", label: "Statistik", Icon: BarChart2 },
      ].map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setView(key)}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 ${
            view === key ? "text-accent dark:text-accent-dark" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          <Icon size={20} />
          <span className="text-[11px]">{label}</span>
        </button>
      ))}
      <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400 dark:text-gray-500">
        <User size={20} />
        <span className="text-[11px]">Profil</span>
      </button>
    </nav>
  );
}
