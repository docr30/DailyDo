import { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NAVY, GREEN, PAPER, SHADOW_LG } from "../lib/constants";
import FinTrackMark from "../components/FinTrackMark";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email || !password) { setError("Email dan kata sandi wajib diisi"); return; }
    if (password.length < 6) { setError("Kata sandi minimal 6 karakter"); return; }
    setLoading(true);
    const { error: err } = mode === "login" ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (mode === "register") setInfo("Akun dibuat. Cek email untuk verifikasi jika diminta, lalu masuk.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: PAPER }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <FinTrackMark size={48} />
          <div className="ft-num text-xl font-semibold mt-3" style={{ color: NAVY }}>FinTrack</div>
          <div className="text-slate-500 text-sm">Keuangan rumah tangga, tercatat rapi</div>
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E2E8F0", boxShadow: SHADOW_LG }}>
          <div className="flex rounded-xl overflow-hidden mb-5" style={{ border: "1px solid #E2E8F0" }}>
            <button
              onClick={() => { setMode("login"); setError(""); setInfo(""); }}
              className="flex-1 py-2 text-sm"
              style={{ background: mode === "login" ? NAVY : "white", color: mode === "login" ? "white" : "#64748B" }}
            >
              Masuk
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); setInfo(""); }}
              className="flex-1 py-2 text-sm"
              style={{ background: mode === "register" ? NAVY : "white", color: mode === "register" ? "white" : "#64748B" }}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Email</label>
              <div className="flex items-center gap-2 px-3 rounded-xl" style={{ border: "1px solid #E2E8F0" }}>
                <Mail size={15} color="#94A3B8" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com" className="w-full py-2.5 text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Kata sandi</label>
              <div className="flex items-center gap-2 px-3 rounded-xl" style={{ border: "1px solid #E2E8F0" }}>
                <Lock size={15} color="#94A3B8" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter" className="w-full py-2.5 text-sm outline-none"
                />
              </div>
            </div>

            {error && <div className="text-xs" style={{ color: "#EF4444" }}>{error}</div>}
            {info && <div className="text-xs" style={{ color: GREEN }}>{info}</div>}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: NAVY }}
            >
              {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Buat akun"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-400 mt-5">
          Data disimpan aman di Supabase, hanya bisa diakses oleh akun Anda sendiri.
        </div>
      </div>
    </div>
  );
}
