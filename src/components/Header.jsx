import React from "react";
import { Sun, Moon, User, LogOut } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Header({ view, setView, onSignOut }) {
  const { mode, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-white/85 dark:bg-[#080B12]/85 border-b border-border dark:border-border-dark">
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 flex items-center justify-center font-semibold text-sm border border-accent dark:border-accent-dark text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10"
            style={{ clipPath: "polygon(20% 0%,80% 0%,100% 20%,100% 80%,80% 100%,20% 100%,0% 80%,0% 20%)" }}
          >
            D
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">DailyDo</span>
            <span className="text-[10px] mt-0.5 text-gray-400 dark:text-gray-500 tracking-wide">task control</span>
          </div>
        </div>

        <nav className="hidden sm:flex items-center gap-1">
          {[
            { key: "today", label: "Hari Ini" },
            { key: "stats", label: "Statistik" },
          ].map((n) => (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                view === n.key
                  ? "bg-accent/10 dark:bg-accent-dark/10 text-accent dark:text-accent-dark border-accent dark:border-accent-dark"
                  : "text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-surface-dark-raised"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Ganti tema"
            className="w-9 h-9 rounded-full flex items-center justify-center border border-border dark:border-border-dark bg-surface-raised dark:bg-surface-dark-raised text-accent dark:text-accent-dark"
          >
            {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={onSignOut}
            aria-label="Keluar"
            className="w-9 h-9 rounded-full flex items-center justify-center border border-border dark:border-border-dark bg-surface-raised dark:bg-surface-dark-raised text-gray-500 dark:text-gray-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
