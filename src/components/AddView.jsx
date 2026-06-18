// components/AddView.jsx
//
// Pantalla principal: registro rápido de gastos e ingresos.
// Es el componente más usado, por eso es la tab por defecto.
//
// Props:
//   accounts — lista de cuentas/medios de pago (viene de App)
//   onAdd    — función que App le pasa para agregar una transacción al state global

import { useState, useEffect, useRef } from "react";
import { EXPENSE_CATS, INCOME_CATS, INSTALLMENT_OPTIONS } from "../constants";
import { fmt } from "../utils/format";

export function AddView({ accounts, onAdd }) {
  const [mode, setMode]             = useState("expense");
  const [amount, setAmount]         = useState("");
  const [cat, setCat]               = useState(null);
  const [accountId, setAccountId]   = useState(accounts[0]?.id || "");
  const [desc, setDesc]             = useState("");
  const [installments, setInstallments] = useState(1);
  const [shake, setShake]           = useState(false);
  const amountRef = useRef(null);

  const cats = mode === "expense" ? EXPENSE_CATS : INCOME_CATS;
  const selectedAccount = accounts.find(a => a.id === accountId);
  const isCredit = selectedAccount?.type === "credit";

  useEffect(() => { setCat(null); }, [mode]);
  useEffect(() => { if (!isCredit) setInstallments(1); }, [isCredit]);

  const handleSubmit = () => {
    if (!amount || isNaN(parseFloat(amount)) || !cat) {
      setShake(true); setTimeout(() => setShake(false), 500); return;
    }
    const base = parseFloat(amount);
    if (mode === "expense" && isCredit && installments > 1) {
      const groupId = uid();
      for (let i = 1; i <= installments; i++) {
        const d = new Date(); d.setMonth(d.getMonth() + (i - 1));
        onAdd({ type: "expense", amount: base / installments, accountId, category: cat,
          description: desc || cats.find(c => c.id === cat)?.label,
          installmentInfo: { current: i, total: installments, groupId, totalAmount: base },
          date: d.toISOString() });
      }
    } else {
      onAdd({ type: mode, amount: base, accountId, category: cat,
        description: desc || cats.find(c => c.id === cat)?.label,
        installmentInfo: null, date: new Date().toISOString() });
    }
    setAmount(""); setCat(null); setDesc(""); setInstallments(1);
    amountRef.current?.focus();
  };

  return (
    <div style={{ padding: "24px 20px 0" }}>
      <p style={{ fontSize: 11, letterSpacing: ".15em", color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>NUEVO MOVIMIENTO</p>
      <div style={{ display: "flex", background: "#0f1523", borderRadius: 10, padding: 3, marginBottom: 20, width: "fit-content" }}>
        {["expense","income"].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "6px 20px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: mode === m ? (m === "expense" ? "#ef4444" : "#a3e635") : "none",
            color: mode === m ? (m === "expense" ? "#fff" : "#0b0f1a") : "#4b607a", transition: "all .2s",
          }}>{m === "expense" ? "Gasto" : "Ingreso"}</button>
        ))}
      </div>

      <div style={{ background: "#0f1523", borderRadius: 16, padding: "16px 20px", border: `1px solid ${shake ? "#ef4444" : "#1e2a3a"}`, transition: "border .15s", animation: shake ? "shake .4s" : "none", marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", marginBottom: 6 }}>MONTO</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 22, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>$</span>
          <input ref={amountRef} type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0" inputMode="decimal" style={{ flex: 1, background: "none", border: "none", outline: "none",
              fontSize: 36, fontFamily: "'DM Mono', monospace", fontWeight: 500,
              color: mode === "expense" ? "#ef4444" : "#a3e635", width: "100%" }} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, letterSpacing: ".1em", color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>CATEGORÍA</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              background: cat === c.id ? "#1e2a3a" : "#0f1523",
              border: `1px solid ${cat === c.id ? "#a3e635" : "#1e2a3a"}`,
              borderRadius: 10, padding: "10px 6px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all .15s",
            }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <span style={{ fontSize: 11, color: cat === c.id ? "#a3e635" : "#6b7f96", fontFamily: "'DM Mono', monospace" }}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, letterSpacing: ".1em", color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>MEDIO DE PAGO</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {accounts.map(a => (
            <button key={a.id} onClick={() => setAccountId(a.id)} style={{
              padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12,
              background: accountId === a.id ? a.color : "#0f1523",
              color: accountId === a.id ? "#0b0f1a" : "#6b7f96",
              fontWeight: accountId === a.id ? 600 : 400,
              outline: accountId === a.id ? "none" : "1px solid #1e2a3a", transition: "all .15s",
            }}>{a.name}</button>
          ))}
        </div>
      </div>

      {isCredit && mode === "expense" && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, letterSpacing: ".1em", color: "#f59e0b", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>CUOTAS</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {INSTALLMENT_OPTIONS.map(n => (
              <button key={n} onClick={() => setInstallments(n)} style={{
                width: 44, height: 44, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13,
                background: installments === n ? "#f59e0b" : "#0f1523",
                color: installments === n ? "#0b0f1a" : "#6b7f96",
                fontWeight: installments === n ? 700 : 400,
                outline: installments === n ? "none" : "1px solid #1e2a3a",
                fontFamily: "'DM Mono', monospace", transition: "all .15s",
              }}>{n === 1 ? "1×" : `${n}×`}</button>
            ))}
          </div>
          {installments > 1 && amount && (
            <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
              {fmt(parseFloat(amount) / installments)} / mes por {installments} meses
            </p>
          )}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción (opcional)"
          style={{ width: "100%", background: "#0f1523", border: "1px solid #1e2a3a", borderRadius: 10,
            padding: "12px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      </div>

      <button onClick={handleSubmit} style={{
        width: "100%", padding: "16px", borderRadius: 14, border: "none",
        background: mode === "expense" ? "#ef4444" : "#a3e635",
        color: mode === "expense" ? "#fff" : "#0b0f1a",
        fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "opacity .15s", letterSpacing: ".03em",
      }}>Registrar {mode === "expense" ? "gasto" : "ingreso"}</button>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

// ─── Dashboard View ────────────────────────────────────────────────────────
