import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email tidak valid";
    if (password.length < 8) return "Password minimal 8 karakter";
    if (mode === "register" && !/[A-Z]/.test(password)) return "Password harus mengandung huruf besar";
    if (mode === "register" && !/[0-9]/.test(password)) return "Password harus mengandung angka";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    const v = validate();
    if (v) return setError(v);

    setLoading(true);
    const { error } =
      mode === "login" ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setError("Email sudah digunakan");
      } else if (error.message.toLowerCase().includes("invalid login")) {
        setError("Email atau password salah");
      } else {
        setError(error.message);
      }
      return;
    }
    if (mode === "register") {
      setInfo("Pendaftaran berhasil. Cek email untuk verifikasi (jika diaktifkan), lalu masuk.");
      setMode("login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark px-4">
      <div className="grid-overlay" />
      <div className="relative w-full max-w-sm bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div
            className="w-9 h-9 flex items-center justify-center font-semibold text-sm border border-accent dark:border-accent-dark text-accent dark:text-accent-dark bg-accent/10 dark:bg-accent-dark/10"
            style={{ clipPath: "polygon(20% 0%,80% 0%,100% 20%,100% 80%,80% 100%,20% 100%,0% 80%,0% 20%)" }}
          >
            D
          </div>
          <span className="font-semibold text-gray-800 dark:text-gray-100">DailyDo</span>
        </div>

        <h1 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-100">
          {mode === "login" ? "Masuk" : "Daftar akun"}
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
          {mode === "login" ? "Kelola tugas harianmu." : "Mulai kelola tugas harianmu."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-lg px-3 py-2 text-sm bg-surface-raised dark:bg-surface-dark-raised border border-border dark:border-border-dark text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:focus:ring-accent-dark/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full rounded-lg px-3 py-2 text-sm bg-surface-raised dark:bg-surface-dark-raised border border-border dark:border-border-dark text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:focus:ring-accent-dark/40"
            />
          </div>

          {error && <p className="text-xs text-danger dark:text-danger-dark">{error}</p>}
          {info && <p className="text-xs text-done dark:text-done-dark">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-accent dark:bg-accent-dark text-white dark:text-[#04141A] disabled:opacity-60"
          >
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setInfo("");
          }}
          className="w-full text-center text-xs mt-4 text-accent dark:text-accent-dark"
        >
          {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </div>
  );
}
