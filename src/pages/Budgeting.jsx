import { useMemo, useState } from "react";
import { ClipboardList, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { NAVY, GREEN, RED } from "../lib/constants";
import { idr, formatDate } from "../lib/format";
import CatIcon from "../components/CatIcon";
import { BudgetPlanModal, BudgetItemModal } from "../components/BudgetModals";

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "#F6F7F6" }}>
      <div className="text-[11px] text-slate-500 mb-0.5">{label}</div>
      <div className="ft-num text-xs font-medium" style={{ color: NAVY }}>{value}</div>
    </div>
  );
}

function BudgetPlanDetail({ plan, catById, onBack, onEditPlan, onDeletePlan, onAddItemClick, onDeleteItem }) {
  const pct = plan.target_amount ? Math.min(100, Math.round((plan.total / plan.target_amount) * 100)) : null;
  const over = plan.target_amount && plan.total > plan.target_amount;
  const remaining = plan.target_amount != null ? plan.target_amount - plan.total : null;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500">
        <ArrowLeft size={15} /> Kembali ke daftar agenda
      </button>

      <div className="ft-card bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-base font-medium" style={{ color: NAVY }}>{plan.name}</div>
            <div className="text-xs text-slate-500">{plan.items.length} item direncanakan</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEditPlan} className="text-slate-400 hover:text-slate-600"><Pencil size={15} /></button>
            <button onClick={onDeletePlan} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Total estimasi" value={idr(plan.total)} />
          <MiniStat label="Target anggaran" value={plan.target_amount ? idr(plan.target_amount) : "Tidak diset"} />
          <MiniStat label={over ? "Melebihi target" : "Sisa anggaran"} value={remaining !== null ? idr(Math.abs(remaining)) : "-"} />
        </div>
        {plan.target_amount ? (
          <div className="mt-4">
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
              <div className="h-full rounded-full" style={{ width: pct + "%", background: over ? RED : GREEN }} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium" style={{ color: NAVY }}>Rincian item</div>
        <button onClick={onAddItemClick} className="flex items-center gap-1.5 text-white text-xs px-3 py-2 rounded-lg" style={{ background: NAVY }}>
          <Plus size={14} /> Tambah item
        </button>
      </div>

      <div className="space-y-3">
        {plan.items.length === 0 && (
          <div className="ft-card bg-white rounded-2xl p-8 text-center text-slate-400 text-sm" style={{ border: "1px solid #E2E8F0" }}>
            Belum ada item di agenda ini
          </div>
        )}
        {plan.items.map((it) => {
          const cat = catById[it.category_id];
          return (
            <div key={it.id} className="ft-card bg-white rounded-xl p-4 flex items-center justify-between" style={{ border: "1px solid #E2E8F0" }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: (cat?.color || "#94A3B8") + "1A" }}>
                  <CatIcon iconKey={cat?.icon} size={16} color={cat?.color} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm truncate" style={{ color: NAVY }}>{it.item}</div>
                  <div className="text-xs text-slate-500">{cat?.name} &middot; {formatDate(it.date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="ft-num text-sm font-medium" style={{ color: NAVY }}>{idr(it.amount)}</div>
                <button onClick={() => onDeleteItem(it.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Budgeting({ categories, plans, items, onAddPlan, onUpdatePlan, onDeletePlan, onAddItem, onDeleteItem }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const catById = useMemo(() => {
    const m = {};
    categories.forEach((c) => (m[c.id] = c));
    return m;
  }, [categories]);

  const expenseCats = categories.filter((c) => c.type === "expense");

  const planStats = useMemo(() => {
    return plans.map((p) => {
      const planItems = items.filter((i) => i.plan_id === p.id).sort((a, b) => a.date.localeCompare(b.date));
      const total = planItems.reduce((s, i) => s + i.amount, 0);
      return { ...p, items: planItems, total };
    });
  }, [plans, items]);

  const selected = planStats.find((p) => p.id === selectedId) || null;

  return (
    <div>
      {!selected && (
        <div className="space-y-4">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <p className="text-sm text-slate-500 max-w-md">
              Rencanakan anggaran untuk agenda atau kegiatan tertentu &mdash; terpisah dari catatan keuangan utama, murni untuk simulasi biaya.
            </p>
            <button
              onClick={() => { setEditingPlan(null); setShowPlanModal(true); }}
              className="flex items-center gap-1.5 text-white text-sm px-4 py-2.5 rounded-xl flex-shrink-0 w-full sm:w-auto justify-center"
              style={{ background: NAVY }}
            >
              <Plus size={16} /> Agenda baru
            </button>
          </div>

          {planStats.length === 0 && (
            <div className="ft-card bg-white rounded-2xl p-10 text-center" style={{ border: "1px solid #E2E8F0" }}>
              <ClipboardList size={28} style={{ margin: "0 auto 8px", display: "block" }} color="#CBD5E1" />
              <div className="text-sm text-slate-400">Belum ada agenda budgeting</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {planStats.map((p) => {
              const pct = p.target_amount ? Math.min(100, Math.round((p.total / p.target_amount) * 100)) : null;
              const over = p.target_amount && p.total > p.target_amount;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="ft-card text-left bg-white rounded-2xl p-5"
                  style={{ border: "1px solid #E2E8F0" }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,41,59,0.06)" }}>
                      <ClipboardList size={18} color={NAVY} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: NAVY }}>{p.name}</div>
                      <div className="text-xs text-slate-500">{p.items.length} item</div>
                    </div>
                  </div>
                  <div className="ft-num text-xl font-semibold mb-2" style={{ color: NAVY }}>{idr(p.total)}</div>
                  {p.target_amount ? (
                    <div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "#F1F5F9" }}>
                        <div className="h-full rounded-full" style={{ width: pct + "%", background: over ? RED : GREEN }} />
                      </div>
                      <div className="text-xs" style={{ color: over ? RED : "#64748B" }}>
                        {over ? "Melebihi" : "Dari"} target {idr(p.target_amount)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">Tanpa target anggaran</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected && (
        <BudgetPlanDetail
          plan={selected}
          catById={catById}
          onBack={() => setSelectedId(null)}
          onEditPlan={() => { setEditingPlan(selected); setShowPlanModal(true); }}
          onDeletePlan={() => { onDeletePlan(selected.id); setSelectedId(null); }}
          onAddItemClick={() => setShowItemModal(true)}
          onDeleteItem={onDeleteItem}
        />
      )}

      {showPlanModal && (
        <BudgetPlanModal
          initial={editingPlan}
          onClose={() => setShowPlanModal(false)}
          onSave={async (plan) => {
            if (plan.id) await onUpdatePlan(plan.id, plan);
            else await onAddPlan(plan);
            setShowPlanModal(false);
          }}
        />
      )}

      {showItemModal && selected && (
        <BudgetItemModal
          categories={expenseCats}
          onClose={() => setShowItemModal(false)}
          onSave={async (item) => { await onAddItem({ ...item, planId: selected.id }); setShowItemModal(false); }}
        />
      )}
    </div>
  );
}
