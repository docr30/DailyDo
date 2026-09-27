import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { NAVY, SHADOW_SM } from "../lib/constants";
import CatIcon from "../components/CatIcon";
import { CatModal } from "../components/Modals";

export default function Categories({ categories, onAdd, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const fallback = categories.find((c) => c.name === "Lainnya");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-1.5 text-white text-sm px-4 py-2.5 rounded-xl"
          style={{ background: NAVY, boxShadow: SHADOW_SM }}
        >
          <Plus size={16} /> Kategori
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((c) => (
          <div key={c.id} className="ft-card bg-white rounded-xl p-4 flex items-center justify-between" style={{ border: "1px solid #E2E8F0" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: c.color + "1A" }}>
                <CatIcon iconKey={c.icon} size={18} color={c.color} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: NAVY }}>{c.name}</div>
                <div className="text-xs text-slate-500">{c.type === "income" ? "Pemasukan" : "Pengeluaran"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditing(c); setShowModal(true); }} className="text-slate-400 hover:text-slate-600"><Pencil size={15} /></button>
              {!c.locked && (
                <button onClick={() => onDelete(c.id, fallback?.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <CatModal
          initial={editing}
          onClose={() => setShowModal(false)}
          onSave={async (cat) => {
            const err = cat.id ? await onUpdate(cat.id, cat) : await onAdd(cat);
            if (!err) setShowModal(false);
            return err;
          }}
        />
      )}
    </div>
  );
}
