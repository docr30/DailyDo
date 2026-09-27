import { useMemo, useState } from "react";
import { Filter, ChevronLeft, ChevronRight, Trash2, Pencil, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { NAVY, GREEN, RED, MONTHS } from "../lib/constants";
import { idr, formatDate } from "../lib/format";
import CatIcon from "../components/CatIcon";
import { TxModal } from "../components/Modals";

function monthHeaderLabel(iso) {
  const [y, m] = iso.slice(0, 7).split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

function FilterChip({ active, onClick, label, color, iconKey }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
      style={{
        background: active ? NAVY : "white",
        color: active ? "white" : "#475569",
        border: active ? "1px solid " + NAVY : "1px solid #E2E8F0",
      }}
    >
      {iconKey && <CatIcon iconKey={iconKey} size={12} color={active ? "white" : color} />}
      {label}
    </button>
  );
}

export default function Transactions({ categories, transactions, onAdd, onUpdate, onDelete, showModal, setShowModal }) {
  const [filterCat, setFilterCat] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [editingTx, setEditingTx] = useState(null);

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

  const balanceById = useMemo(() => {
    const m = {};
    withBalance.forEach((t) => { m[t.id] = t.balance; });
    return m;
  }, [withBalance]);

  // Bulan terbaru tampil di atas, tapi DI DALAM satu bulan urutannya mengikuti
  // urutan input (created_at) bukan urutan tanggal — supaya gampang memindai
  // baris mana yang "loncat" alias belum diinput.
  const byInputOrder = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const ma = a.date.slice(0, 7);
        const mb = b.date.slice(0, 7);
        if (ma !== mb) return mb.localeCompare(ma);
        return (a.created_at || "").localeCompare(b.created_at || "");
      })
      .map((t) => ({ ...t, balance: balanceById[t.id] }));
  }, [transactions, balanceById]);

  const yearOptions = useMemo(() => {
    const s = new Set(transactions.map((t) => t.date.slice(0, 4)));
    return Array.from(s).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return byInputOrder.filter((t) => {
      if (filterCat !== "all" && t.category_id !== filterCat) return false;
      if (filterYear !== "all" && t.date.slice(0, 4) !== filterYear) return false;
      if (filterMonth !== "all" && t.date.slice(5, 7) !== filterMonth) return false;
      if (kw) {
        const catName = (catById[t.category_id]?.name || "").toLowerCase();
        const itemName = (t.item || "").toLowerCase();
        if (!itemName.includes(kw) && !catName.includes(kw)) return false;
      }
      return true;
    });
  }, [byInputOrder, filterCat, filterYear, filterMonth, keyword, catById]);

  const summary = useMemo(() => {
    let income = 0, expense = 0;
    filtered.forEach((t) => (t.type === "income" ? (income += t.amount) : (expense += t.amount)));
    return { income, expense, net: income - expense };
  }, [filtered]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Sisipkan penanda bulan setiap kali bulan berganti di halaman yang sedang tampil,
  // supaya baris yang "loncat urutan input"-nya gampang kelihatan.
  const pagedWithHeaders = useMemo(() => {
    const out = [];
    let lastMonth = null;
    paged.forEach((t) => {
      const mk = t.date.slice(0, 7);
      if (mk !== lastMonth) {
        out.push({ kind: "header", key: "h-" + mk, label: monthHeaderLabel(t.date) });
        lastMonth = mk;
      }
      out.push({ kind: "row", key: t.id, tx: t });
    });
    return out;
  }, [paged]);

  async function handleSave(tx) {
    const err = tx.id ? await onUpdate(tx.id, tx) : await onAdd(tx);
    if (!err) {
      setShowModal(false);
      setEditingTx(null);
    }
    return err;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white" style={{ border: "1px solid #E2E8F0" }}>
        <Search size={15} color="#94A3B8" />
        <input
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          placeholder="Cari item atau kategori..."
          className="w-full text-sm outline-none"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={15} className="text-slate-400 flex-shrink-0" />
        <select
          value={filterYear}
          onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-white"
          style={{ border: "1px solid #E2E8F0", color: "#475569" }}
        >
          <option value="all">Semua tahun</option>
          {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filterMonth}
          onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
          className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-white"
          style={{ border: "1px solid #E2E8F0", color: "#475569" }}
        >
          <option value="all">Semua bulan</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
          ))}
        </select>
        <FilterChip active={filterCat === "all"} onClick={() => { setFilterCat("all"); setPage(1); }} label="Semua kategori" />
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            active={filterCat === c.id}
            onClick={() => { setFilterCat(c.id); setPage(1); }}
            label={c.name}
            color={c.color}
            iconKey={c.icon}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="ft-card bg-white rounded-xl px-4 py-3 flex items-center gap-3 flex-1" style={{ border: "1px solid #E2E8F0" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.1)" }}>
            <ArrowUpRight size={15} color={GREEN} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500">Pemasukan (sesuai filter)</div>
            <div className="ft-num text-sm font-semibold" style={{ color: GREEN }}>{idr(summary.income)}</div>
          </div>
        </div>
        <div className="ft-card bg-white rounded-xl px-4 py-3 flex items-center gap-3 flex-1" style={{ border: "1px solid #E2E8F0" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
            <ArrowDownRight size={15} color={RED} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500">Pengeluaran (sesuai filter)</div>
            <div className="ft-num text-sm font-semibold" style={{ color: RED }}>{idr(summary.expense)}</div>
          </div>
        </div>
        <div className="ft-card bg-white rounded-xl px-4 py-3 flex items-center gap-3 flex-1" style={{ border: "1px solid #E2E8F0" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,41,59,0.06)" }}>
            <Filter size={14} color={NAVY} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500">Selisih</div>
            <div className="ft-num text-sm font-semibold" style={{ color: summary.net >= 0 ? NAVY : RED }}>{idr(summary.net)}</div>
          </div>
        </div>
      </div>


      <div className="hidden lg:block ft-card bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <th className="py-3 pl-5 font-normal">No</th>
              <th className="py-3 font-normal">Tanggal</th>
              <th className="py-3 font-normal">Kategori</th>
              <th className="py-3 font-normal">Item</th>
              <th className="py-3 font-normal text-right">Pemasukan</th>
              <th className="py-3 font-normal text-right">Pengeluaran</th>
              <th className="py-3 pr-5 font-normal text-right">Saldo</th>
              <th className="py-3 pr-5"></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-slate-400">Data tidak ditemukan</td></tr>
            )}
            {pagedWithHeaders.map((row, i) => {
              if (row.kind === "header") {
                return (
                  <tr key={row.key}>
                    <td colSpan={8} className="pt-4 pb-1.5 px-5 text-xs font-medium" style={{ color: "#94A3B8", background: "#FAFBFB" }}>
                      {row.label}
                    </td>
                  </tr>
                );
              }
              const t = row.tx;
              const cat = catById[t.category_id];
              const rowIndex = paged.findIndex((p) => p.id === t.id);
              return (
                <tr key={t.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td className="py-3 pl-5 text-slate-500">{(page - 1) * 10 + rowIndex + 1}</td>
                  <td className="py-3">{formatDate(t.date)}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: (cat?.color || "#999") + "1A" }}>
                        <CatIcon iconKey={cat?.icon} size={12} color={cat?.color} />
                      </span>
                      {cat?.name}
                    </span>
                  </td>
                  <td className="py-3">{t.item}</td>
                  <td className="ft-num py-3 text-right" style={{ color: GREEN }}>{t.type === "income" ? idr(t.amount) : "-"}</td>
                  <td className="ft-num py-3 text-right" style={{ color: RED }}>{t.type === "expense" ? idr(t.amount) : "-"}</td>
                  <td className="ft-num py-3 pr-5 text-right font-medium">{idr(t.balance)}</td>
                  <td className="py-3 pr-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingTx(t); setShowModal(true); }} className="text-slate-400 hover:text-slate-600"><Pencil size={15} /></button>
                      <button onClick={() => onDelete(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-3">
        {paged.length === 0 && <div className="text-center text-slate-400 py-8">Data tidak ditemukan</div>}
        {pagedWithHeaders.map((row) => {
          if (row.kind === "header") {
            return (
              <div key={row.key} className="text-xs font-medium pt-2 px-1" style={{ color: "#94A3B8" }}>
                {row.label}
              </div>
            );
          }
          const t = row.tx;
          const cat = catById[t.category_id];
          const isIncome = t.type === "income";
          return (
            <div key={t.id} className="ft-card bg-white rounded-xl p-4" style={{ border: "1px solid #E2E8F0" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: (cat?.color || "#999") + "1A" }}>
                    <CatIcon iconKey={cat?.icon} size={16} color={cat?.color} />
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: NAVY }}>{t.item}</div>
                    <div className="text-xs text-slate-500">{cat?.name} &middot; {formatDate(t.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => { setEditingTx(t); setShowModal(true); }} className="text-slate-300"><Pencil size={15} /></button>
                  <button onClick={() => onDelete(t.id)} className="text-slate-300"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                <div className="ft-num text-sm font-medium" style={{ color: isIncome ? GREEN : RED }}>
                  {isIncome ? "+" : "-"}{idr(t.amount)}
                </div>
                <div className="ft-num text-xs text-slate-500">Saldo {idr(t.balance)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="disabled:opacity-30"><ChevronLeft size={18} /></button>
          <span className="text-sm text-slate-500">Halaman {page} dari {pageCount}</span>
          <button disabled={page === pageCount} onClick={() => setPage(page + 1)} className="disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      )}

      {showModal && (
        <TxModal
          categories={categories}
          initial={editingTx}
          onClose={() => { setShowModal(false); setEditingTx(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
