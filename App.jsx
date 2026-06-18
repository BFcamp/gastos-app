// App.jsx
//
// El "cerebro" de la app. Tiene dos responsabilidades y solo dos:
//
//   1. STATE GLOBAL — datos que múltiples vistas necesitan leer o modificar.
//      Cada dato vive en el nivel más alto que lo necesite. Si solo lo usa
//      un componente, el state va en ese componente, no acá.
//
//   2. ROUTING — decide qué vista mostrar según la tab activa.
//
// App no sabe nada de cómo se ven los botones ni cómo se formatea un número.
// Eso es responsabilidad de cada componente hijo.

import { useState, useEffect } from "react";

// Componentes de cada pantalla
import { AddView }       from "./components/AddView";
import { DashboardView } from "./components/DashboardView";
import { FinanzasView }  from "./components/FinanzasView";
import { ComprasView }   from "./components/ComprasView";
import { HistoryView }   from "./components/HistoryView";

// Datos iniciales y constantes
import { DEFAULT_ACCOUNTS, DEFAULT_WISH_CATS } from "./constants";

// Capa de persistencia (localStorage hoy, Supabase mañana)
import { S } from "./utils/storage";

// uid se usa para crear transacciones
import { uid } from "./utils/format";

// ─── Navegación ───────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "◈", label: "Inicio"    },
  { id: "add",       icon: "＋", label: "Registrar" },
  { id: "finanzas",  icon: "⊟", label: "Finanzas"  },
  { id: "compras",   icon: "◻", label: "Compras"   },
  { id: "history",   icon: "≡", label: "Historial" },
];

// ─── Estilos base ─────────────────────────────────────────────────────────
// Los estilos globales mínimos que aplican a toda la app.
// Los estilos específicos de cada componente viven en su propio archivo.
const BASE_STYLE = {
  background: "#0b0f1a",
  minHeight: "100vh",
  maxWidth: 420,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  fontFamily: "'DM Sans', sans-serif",
  color: "#f1f5f9",
  paddingBottom: 84,
};

// ─── Componente principal ─────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("add");

  // Estado global — solo los datos que cruzan múltiples vistas
  const [accounts,     setAccounts]     = useState(DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState([]);
  const [debts,        setDebts]        = useState([]);
  const [services,     setServices]     = useState([]);
  const [wishlist,     setWishlist]     = useState([]);
  const [wishCats,     setWishCats]     = useState(DEFAULT_WISH_CATS);
  const [loaded,       setLoaded]       = useState(false);

  // ── Carga inicial desde localStorage ──────────────────────────────────
  // Se ejecuta una sola vez al montar el componente (array vacío como dep.)
  useEffect(() => {
    (async () => {
      const a  = await S.get("accounts");
      const t  = await S.get("transactions");
      const d  = await S.get("debts");
      const sv = await S.get("services");
      const wl = await S.get("wishlist");
      const wc = await S.get("wishCats");
      if (a)  setAccounts(a);
      if (t)  setTransactions(t);
      if (d)  setDebts(d);
      if (sv) setServices(sv);
      if (wl) setWishlist(wl);
      if (wc) setWishCats(wc);
      setLoaded(true);
    })();
  }, []);

  // ── Persistencia automática ────────────────────────────────────────────
  // Cada vez que cambia un estado, se guarda. El flag `loaded` evita
  // que se sobreescriban los datos guardados durante la carga inicial.
  useEffect(() => { if (loaded) S.set("accounts",     accounts);     }, [accounts,     loaded]);
  useEffect(() => { if (loaded) S.set("transactions", transactions); }, [transactions, loaded]);
  useEffect(() => { if (loaded) S.set("debts",        debts);        }, [debts,        loaded]);
  useEffect(() => { if (loaded) S.set("services",     services);     }, [services,     loaded]);
  useEffect(() => { if (loaded) S.set("wishlist",     wishlist);     }, [wishlist,     loaded]);
  useEffect(() => { if (loaded) S.set("wishCats",     wishCats);     }, [wishCats,     loaded]);

  // ── Acción: agregar transacción ────────────────────────────────────────
  // Vive en App porque modifica dos estados a la vez: transactions Y accounts.
  // Si viviera en AddView, no podría tocar el state de accounts.
  const addTransaction = (tx) => {
    const newTx = { ...tx, id: uid(), date: tx.date || new Date().toISOString() };
    setTransactions(prev => [newTx, ...prev]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== tx.accountId) return acc;
      const delta = tx.type === "income" ? tx.amount : -tx.amount;
      return { ...acc, balance: (acc.balance || 0) + delta };
    }));
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (!loaded) return (
    <div style={{ ...BASE_STYLE, alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#a3e635", fontFamily: "monospace", fontSize: 14 }}>cargando...</p>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={BASE_STYLE}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Vistas — solo se monta la activa */}
      {tab === "dashboard" && (
        <DashboardView
          accounts={accounts}
          transactions={transactions}
          debts={debts}
          services={services}
        />
      )}
      {tab === "add" && (
        <AddView accounts={accounts} onAdd={addTransaction} />
      )}
      {tab === "finanzas" && (
        <FinanzasView
          debts={debts}       setDebts={setDebts}
          services={services} setServices={setServices}
        />
      )}
      {tab === "compras" && (
        <ComprasView
          wishlist={wishlist}   setWishlist={setWishlist}
          wishCats={wishCats}   setWishCats={setWishCats}
        />
      )}
      {tab === "history" && (
        <HistoryView transactions={transactions} accounts={accounts} />
      )}

      {/* Navegación inferior */}
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 420, background: "#0f1523",
        borderTop: "1px solid #1e2a3a", display: "flex", zIndex: 100,
      }}>
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            style={{
              flex: 1, padding: "9px 0 7px", background: "none", border: "none",
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 2,
              color: tab === n.id ? "#a3e635" : "#4b607a",
              transition: "color .2s",
            }}
          >
            <span style={{ fontSize: n.id === "add" ? 19 : 15 }}>{n.icon}</span>
            <span style={{ fontSize: 8.5, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em" }}>
              {n.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
