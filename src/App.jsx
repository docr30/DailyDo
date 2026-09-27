import React, { useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useTasks } from "./hooks/useTasks.js";
import Login from "./pages/Login.jsx";
import Today from "./pages/Today.jsx";
import Stats from "./pages/Stats.jsx";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState("today");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark text-gray-400 dark:text-gray-500 text-sm">
        Memuat...
      </div>
    );
  }

  if (!user) return <Login />;

  return <AuthedApp userId={user.id} view={view} setView={setView} signOut={signOut} />;
}

function AuthedApp({ userId, view, setView, signOut }) {
  const tasksApi = useTasks(userId);

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark pb-20 relative">
      <div className="grid-overlay" />
      <div className="relative z-10">
        <Header view={view} setView={setView} onSignOut={signOut} />
        {tasksApi.loading ? (
          <div className="text-center py-16 text-sm text-gray-400 dark:text-gray-500">Memuat tugas...</div>
        ) : view === "today" ? (
          <Today tasksApi={tasksApi} />
        ) : (
          <Stats tasksApi={tasksApi} />
        )}
        <BottomNav view={view} setView={setView} />
      </div>
    </div>
  );
}
