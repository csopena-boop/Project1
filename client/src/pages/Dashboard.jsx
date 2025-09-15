// src/pages/Dashboard.jsx
import React from "react";
import { useAuth } from "../context/AuthProvider";


export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 rounded bg-gray-900 text-white hover:opacity-90"
        >
          Cerrar sesión
        </button>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-2">Tu perfil</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(user, null, 2)}
        </pre>
      </section>
    </div>
  );
}
