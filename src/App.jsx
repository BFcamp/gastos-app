// App.jsx — estado global + routing

import { useState, useEffect } from "react";
import { AddView }       from "./components/AddView";
import { DashboardView } from "./components/DashboardView";
import { FinanzasView }  from "./components/FinanzasView";
import { ComprasView }   from "./components/ComprasView";
import { HistoryView }   from "./components/HistoryView";
import { CalendarView }  from "./components/CalendarView";
import { DEFAULT_ACCOUNTS, DEFAULT_WISH_CATS } from "./constants";
import { S } from "./utils/storage";
import { uid } from "./utils/format";

const NAV = [
  { id: "dashboard", icon: "home",          label: "Inicio"    },
  { id: "add",       icon: "plus",          label: "Registrar" },
  { id: "finanzas",  icon: "chart-pie",     label: "Finanzas"  },
  { id: "compras",   icon: "shopping-cart", label: "Compras"   },
  { id: "history",   icon: "list",          label: "Historial" },
];

const BASE_STYLE = {
  background: "#0b0f1a", minHeight: "100vh", maxWidth: 420,
  margin: "0 auto", display: "flex", flexDirection: "column",
  fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9", paddingBottom: 84,
};

export default function App() {
  const [tab, setTab] = useState("add");
  const [monthOffset, setMonthOffset] = useState(0); // mes que se está viendo, compartido entre Inicio y Calendario
  const changeMonth = (delta) => setMonthOffset(o => o + delta);
  const resetMonth  = () => setMonthOffset(0);

  const [accounts,     setAccounts]     = useState(DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState([]);
  const [debts,        setDebts]        = useState([]);
  const [services,     setServices]     = useState([]);
  const [wishlist,     setWishlist]     = useState([]);
  const [wishCats,     setWishCats]     = useState(DEFAULT_WISH_CATS);
  const [jars,         setJars]         = useState([]);
  const [projectedIncomes, setProjectedIncomes] = useState([]);
  const [loaded,       setLoaded]       = useState(false);

  useEffect(() => {
    (async () => {
      const a  = await S.get("accounts");
      const t  = await S.get("transactions");
      const d  = await S.get("debts");
      const sv = await S.get("services");
      const wl = await S.get("wishlist");
      const wc = await S.get("wishCats");
      const jr = await S.get("jars");
      const pi = await S.get("projectedIncomes");
      if (a)  setAccounts(a);
      if (t)  setTransactions(t);
      if (d)  setDebts(d);
      if (sv) setServices(sv);
      if (wl) setWishlist(wl);
      if (wc) setWishCats(wc);
      if (jr) setJars(jr);
      if (pi) setProjectedIncomes(pi);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) S.set("accounts",     accounts);     }, [accounts,     loaded]);
  useEffect(() => { if (loaded) S.set("transactions", transactions); }, [transactions, loaded]);
  useEffect(() => { if (loaded) S.set("debts",        debts);        }, [debts,        loaded]);
  useEffect(() => { if (loaded) S.set("services",     services);     }, [services,     loaded]);
  useEffect(() => { if (loaded) S.set("wishlist",     wishlist);     }, [wishlist,     loaded]);
  useEffect(() => { if (loaded) S.set("wishCats",     wishCats);     }, [wishCats,     loaded]);
  useEffect(() => { if (loaded) S.set("jars",         jars);         }, [jars,         loaded]);
  useEffect(() => { if (loaded) S.set("projectedIncomes", projectedIncomes); }, [projectedIncomes, loaded]);

  const addTransaction = (tx) => {
    const newTx = { ...tx, id: uid(), date: tx.date || new Date().toISOString() };
    setTransactions(prev => [newTx, ...prev]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== tx.accountId) return acc;
      const delta = tx.type === "income" ? tx.amount : -tx.amount;
      return { ...acc, balance: (acc.balance || 0) + delta };
    }));
  };

  // Guarda un ingreso esperado a futuro. NO toca transactions ni accounts —
  // recién se vuelve "real" cuando se confirma.
  const addProjectedIncome = (data) => {
    setProjectedIncomes(prev => [...prev, { ...data, id: uid() }]);
  };

  // El ingreso proyectado llegó de verdad: se convierte en transacción real
  // (afecta el saldo) y desaparece de la lista de proyecciones.
  const confirmProjectedIncome = (id) => {
    const p = projectedIncomes.find(x => x.id === id);
    if (!p) return;
    addTransaction({
      type: "income", amount: p.amount, accountId: p.accountId,
      category: p.category, description: p.description, installmentInfo: null,
      date: new Date().toISOString(),
    });
    setProjectedIncomes(prev => prev.filter(x => x.id !== id));
  };

  const deleteProjectedIncome = (id) => {
    setProjectedIncomes(prev => prev.filter(x => x.id !== id));
  };

  if (!loaded) return (
    <div style={{ ...BASE_STYLE, alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#a3e635", fontFamily: "monospace", fontSize: 14 }}>cargando...</p>
    </div>
  );

  return (
    <div style={BASE_STYLE}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {tab === "dashboard" && <DashboardView accounts={accounts} transactions={transactions} debts={debts} services={services} projectedIncomes={projectedIncomes} onConfirmProjected={confirmProjectedIncome} onDeleteProjected={deleteProjectedIncome} monthOffset={monthOffset} onPrevMonth={() => changeMonth(-1)} onNextMonth={() => changeMonth(1)} onResetMonth={resetMonth} onOpenCalendar={() => setTab("calendar")} />}
      {tab === "add"       && <AddView accounts={accounts} onAdd={addTransaction} onAddProjected={addProjectedIncome} />}
      {tab === "finanzas"  && <FinanzasView debts={debts} setDebts={setDebts} services={services} setServices={setServices} jars={jars} setJars={setJars} />}
      {tab === "compras"   && <ComprasView wishlist={wishlist} setWishlist={setWishlist} wishCats={wishCats} setWishCats={setWishCats} />}
      {tab === "history"   && <HistoryView transactions={transactions} accounts={accounts} />}
      {tab === "calendar"  && <CalendarView transactions={transactions} debts={debts} services={services} projectedIncomes={projectedIncomes} monthOffset={monthOffset} onPrevMonth={() => changeMonth(-1)} onNextMonth={() => changeMonth(1)} onBack={() => setTab("dashboard")} />}

      {tab !== "calendar" && (
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 420, background: "#0f1523",
        borderTop: "1px solid #1e2a3a", display: "flex", zIndex: 100,
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{
            flex: 1, padding: "9px 0 7px", background: "none", border: "none",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2,
            color: tab === n.id ? "#a3e635" : "#4b607a", transition: "color .2s",
          }}>
            <i className={`ti ti-${n.icon}`} style={{ fontSize: n.id === "add" ? 20 : 16 }} />
            <span style={{ fontSize: 8.5, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em" }}>
              {n.label}
            </span>
          </button>
        ))}
      </nav>
      )}
    </div>
  );
}
