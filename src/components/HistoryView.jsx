// components/HistoryView.jsx
//
// Lista cronológica de todas las transacciones, agrupadas por fecha.
// Filtros por tipo (todos / gastos / ingresos).
// Solo lectura — no modifica datos.
//
// Props:
//   transactions — historial completo
//   accounts     — para mostrar el nombre del medio de pago en cada fila

import { useState } from "react";
import { EXPENSE_CATS, INCOME_CATS } from "../constants";
import { fmt } from "../utils/format";

export function HistoryView({ transactions, accounts }) {
  const [filter, setFilter] = useState("all");
  const filtered = transactions.filter(t => filter === "all" || t.type === filter).slice(0, 60);
  const groups = {};
  filtered.forEach(t => {
    const d = new Date(t.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    if (!groups[d]) groups[d] = [];
    groups[d].push(t);
  });

  return (
    <div style={{ padding: "24px 20px 0" }}>
      <p style={{ fontSize: 11, letterSpacing: ".15em", color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>HISTORIAL</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["all","Todo"],["expense","Gastos"],["income","Ingresos"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12,
            background: filter === v ? "#1e2a3a" : "none",
            color: filter === v ? "#f1f5f9" : "#4b607a",
            outline: filter === v ? "1px solid #a3e635" : "1px solid #1e2a3a",
            fontFamily: "'DM Mono', monospace", transition: "all .15s",
          }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 && <div style={{ textAlign: "center", color: "#4b607a", padding: 40, fontSize: 13 }}>Sin movimientos aún</div>}

      {Object.entries(groups).map(([date, txs]) => (
        <div key={date} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".08em", marginBottom: 8 }}>{date.toUpperCase()}</p>
          <div style={{ background: "#0f1523", borderRadius: 14, border: "1px solid #1e2a3a", overflow: "hidden" }}>
            {txs.map((t, i) => {
              const acc = accounts.find(a => a.id === t.accountId);
              const cat = [...EXPENSE_CATS, ...INCOME_CATS].find(c => c.id === t.category);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 12, borderBottom: i < txs.length - 1 ? "1px solid #1a2130" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1e2a3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {cat?.icon || "📦"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: "#c4d0e0", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.description}</p>
                    <div style={{ display: "flex", gap: 6, marginTop: 2, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>{acc?.name}</span>
                      {t.installmentInfo?.total > 1 && (
                        <span style={{ fontSize: 10, color: "#f59e0b", fontFamily: "'DM Mono', monospace", background: "#1e2a3a", borderRadius: 4, padding: "1px 5px" }}>
                          {t.installmentInfo.current}/{t.installmentInfo.total}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color: t.type === "income" ? "#a3e635" : "#ef4444", flexShrink: 0 }}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Compras View ─────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  high:   { label: "Urgente",  color: "#f87171", dot: "#ef4444" },
  medium: { label: "Pronto",   color: "#fb923c", dot: "#f97316" },
  low:    { label: "Algún día", color: "#94a3b8", dot: "#64748b" },
};

const CAT_COLORS = ["#38bdf8","#a78bfa","#fb923c","#34d399","#f59e0b","#c084fc","#f472b6","#94a3b8","#4ade80","#60a5fa"];

