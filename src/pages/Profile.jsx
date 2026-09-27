import { UserCircle, ChevronRight, LogOut } from "lucide-react";
import { NAVY, RED } from "../lib/constants";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-md space-y-4">
      <div className="ft-card bg-white rounded-2xl p-5 flex items-center gap-4" style={{ border: "1px solid #E2E8F0" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: NAVY }}>
          <UserCircle size={30} color="white" />
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: NAVY }}>Akun FinTrack</div>
          <div className="text-xs text-slate-500">{user?.email}</div>
        </div>
      </div>
      <div className="ft-card bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
        {["Preferensi tampilan", "Ekspor data", "Tentang FinTrack"].map((label, i, arr) => (
          <div key={label} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
            <span className="text-sm" style={{ color: NAVY }}>{label}</span>
            <ChevronRight size={16} color="#94A3B8" />
          </div>
        ))}
      </div>
      <button
        onClick={() => signOut()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
        style={{ color: RED, border: "1px solid #FECACA", background: "white" }}
      >
        <LogOut size={16} /> Keluar
      </button>
    </div>
  );
}
