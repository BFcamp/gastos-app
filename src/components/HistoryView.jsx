// components/HistoryView.jsx
//
// Lista cronológica de todas las transacciones, agrupadas por fecha.
// Filtros por tipo (todos / gastos / ingresos).
// Permite editar monto, descripción y categoría — corrige el saldo
// de la cuenta automáticamente al guardar.
//
// Props:
//   transactions    — historial completo
//   accounts        — para mostrar el nombre del medio de pago
//   onEditTx        — (id, changes, accountId, oldAmount) => void

import { useState } from "react";
import { EXPENSE_CATS, INCOME_CATS } from "../constants";
import { fmt } from "../utils/format";

const Icon = ({ name, size = 14, style = {} }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: size, ...style }} aria-hidden="true" />
);

export function HistoryView({ transactions, accounts, onEditTx, onDeleteTx }) {
  const [filter, setFilter]   = useState("all");
  const [editId, setEditId]   = useState(null);
  const [editData, setEditData] = useState({});

  const filtered = transactions.filter(t => filter === "all" || t.type === filter).slice(0, 60);
  const groups = {};
  filtered.forEach(t => {
    const d = new Date(t.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    if (!groups[d]) groups[d] = [];
    groups[d].push(t);
  });

  const startEdit = (t) => {
    setEditId(t.id);
    setEditData({ amount: t.amount, description: t.description, category: t.category });
  };

  const saveEdit = (t) => {
    const newAmount = parseFloat(editData.amount);
    if (!newAmount || isNaN(newAmount)) return;
    onEditTx(t.id, { ...editData, amount: newAmount }, t.accountId, t.amount, t.type);
    setEditId(null);
  };

  const cats = (type) => type === "income" ? INCOME_CATS : EXPENSE_CATS;

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
              const acc     = accounts.find(a => a.id === t.accountId);
              const cat     = [...EXPENSE_CATS, ...INCOME_CATS].find(c => c.id === t.category);
              const isEdit  = editId === t.id;
              return (
                <div key={t.id} style={{ borderBottom: i < txs.length - 1 ? "1px solid #1a2130" : "none" }}>
                  {/* Fila normal */}
                  <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 12 }}>
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
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => isEdit ? setEditId(null) : startEdit(t)} style={{ background: "none", border: "none", cursor: "pointer", color: isEdit ? "#a3e635" : "#4b607a", padding: 0 }}>
                        <Icon name={isEdit ? "x" : "pencil"} size={14} />
                      </button>
                      <button onClick={() => onDeleteTx(t.id, t.accountId, t.amount, t.type)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Panel de edición inline */}
                  {isEdit && (
                    <div style={{ background: "#0b0f1a", borderTop: "1px solid #1e2a3a", padding: 14 }}>
                      <p style={{ fontSize: 10, color: "#38bdf8", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", marginBottom: 12 }}>EDITAR MOVIMIENTO</p>

                      <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>MONTO ($)</p>
                      <input
                        type="number"
                        value={editData.amount}
                        onChange={e => setEditData(p => ({ ...p, amount: e.target.value }))}
                        style={{ width: "100%", background: "#0f1523", border: "1px solid #1e2a3a", borderRadius: 9, padding: "10px 12px", color: "#f1f5f9", fontSize: 16, fontFamily: "'DM Mono', monospace", outline: "none", boxSizing: "border-box", marginBottom: 10 }}
                      />

                      <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>DESCRIPCIÓN</p>
                      <input
                        type="text"
                        value={editData.description}
                        onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
                        style={{ width: "100%", background: "#0f1523", border: "1px solid #1e2a3a", borderRadius: 9, padding: "10px 12px", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 }}
                      />

                      <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>CATEGORÍA</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {cats(t.type).map(c => (
                          <button key={c.id} onClick={() => setEditData(p => ({ ...p, category: c.id }))} style={{
                            padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
                            background: editData.category === c.id ? "#1e2a3a" : "#0f1523",
                            color: editData.category === c.id ? "#a3e635" : "#4b607a",
                            outline: editData.category === c.id ? "1px solid #a3e635" : "1px solid #1e2a3a",
                          }}>{c.icon} {c.label}</button>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditId(null)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #1e2a3a", background: "none", color: "#6b7f96", cursor: "pointer", fontSize: 13 }}>
                          Cancelar
                        </button>
                        <button onClick={() => saveEdit(t)} style={{ flex: 2, padding: "9px", borderRadius: 10, border: "none", background: "#a3e635", color: "#0b0f1a", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Guardar cambios
                        </button>
                      </div>
                    </div>
                  )}
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

