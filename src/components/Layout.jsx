import { Home, Receipt, BarChart3, Tags, UserCircle, Sparkles, Plus, ClipboardList, HandCoins } from "lucide-react";
import { NAVY, PAPER, GREEN, SHADOW_SM } from "../lib/constants";
import FinTrackMark from "./FinTrackMark";

const NAV_ITEMS = [
  { key: "dashboard", label: "Beranda", icon: Home },
  { key: "transactions", label: "Transaksi", icon: Receipt },
  { key: "reports", label: "Laporan", icon: BarChart3 },
  { key: "categories", label: "Kategori", icon: Tags },
  { key: "budgeting", label: "Budgeting", icon: ClipboardList },
  { key: "debts", label: "Utang", icon: HandCoins },
  { key: "profile", label: "Profil", icon: UserCircle },
];

export default function Layout({ view, setView, onAddTransaction, children }) {
  const activeLabel = NAV_ITEMS.find((n) => n.key === view)?.label;

  return (
    <div style={{ background: PAPER, minHeight: "100vh", color: NAVY }}>
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64"
        style={{ background: NAVY }}
      >
        <div className="px-6 pt-7 pb-8 flex items-center gap-3">
          <FinTrackMark size={36} />
          <div>
            <div className="ft-num text-white text-lg font-semibold leading-none">FinTrack</div>
            <div className="text-slate-400 text-xs mt-1">Keuangan rumah tangga</div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className="ft-nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: active ? "rgba(16,185,129,0.16)" : "transparent", color: active ? GREEN : "#CBD5E1" }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mx-4 mb-5 p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(255,255,255,0.06)" }}>
          <Sparkles size={14} color="#5EEAD4" />
          <div className="text-[11px] text-slate-400 leading-snug">Terhubung ke Supabase</div>
        </div>
      </aside>

      <div className="lg:hidden flex items-center gap-2.5 px-5 pt-5 pb-1">
        <FinTrackMark size={28} />
        <span className="ft-num text-base font-semibold" style={{ color: NAVY }}>FinTrack</span>
      </div>

      <div className="lg:ml-64 pb-24 lg:pb-8">
        <header className="px-5 pt-3 pb-2 lg:px-10 lg:pt-8 flex items-center justify-between">
          <div>
            <div className="ft-num text-xl font-semibold" style={{ color: NAVY }}>{activeLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            {view === "transactions" && onAddTransaction && (
              <button
                onClick={onAddTransaction}
                className="hidden sm:flex items-center gap-1.5 text-white text-sm px-4 py-2.5 rounded-xl"
                style={{ background: NAVY, boxShadow: SHADOW_SM }}
              >
                <Plus size={16} /> Tambah transaksi
              </button>
            )}
            <div
              className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center flex-shrink-0"
              style={{ background: "white", border: "1px solid #E2E8F0" }}
            >
              <UserCircle size={20} color="#64748B" />
            </div>
          </div>
        </header>
        <main className="px-5 lg:px-10 py-4">{children}</main>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-2"
        style={{ background: "white", borderTop: "1px solid #E2E8F0", boxShadow: "0 -4px 16px rgba(15,23,42,0.05)" }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1"
              style={{ color: active ? GREEN : "#94A3B8" }}
            >
              <Icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {view === "transactions" && onAddTransaction && (
        <button
          onClick={onAddTransaction}
          className="sm:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full flex items-center justify-center text-white z-40"
          style={{ background: NAVY, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 12px 28px -8px rgba(15,23,42,0.14)" }}
          aria-label="Tambah transaksi"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}
