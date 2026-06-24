// components/DashboardView.jsx
//
// Vista de resumen: balance del mes, saldos por cuenta, top categorías.
// Solo lee datos, no los modifica — es puramente de visualización.
//
// Props:
//   accounts     — estado de cada cuenta con su saldo
//   transactions — historial completo de movimientos
//   debts        — lista de deudas (para mostrar en el resumen)
//   services     — lista de servicios recurrentes

import { useState } from "react";
import { EXPENSE_CATS } from "../constants";
import { fmt } from "../utils/format";

const Icon = ({ name, size = 16, style = {} }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: size, ...style }} aria-hidden="true" />
);

export function DashboardView({ accounts, transactions, debts, services, projectedIncomes, onConfirmProjected, onDeleteProjected, monthOffset, onPrevMonth, onNextMonth, onResetMonth, onOpenCalendar }) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const isCurrentMonth = monthOffset === 0;

  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
  });
  const income  = thisMonth.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = thisMonth.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const liquid  = accounts.filter(a => a.type !== "credit").reduce((s, a) => s + (a.balance || 0), 0);
  const credit  = accounts.find(a => a.type === "credit");
  // Muestra solo lo gastado con tarjeta en el mes que estás viendo.
  // Así las cuotas futuras no inflan el número del mes actual.
  const creditUsed = credit
    ? thisMonth.filter(t => t.accountId === credit.id && t.type === "expense").reduce((s, t) => s + t.amount, 0)
    : 0;

  const byCat = {};
  thisMonth.filter(t => t.type === "expense").forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  const catList = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const totalDebt = debts.reduce((s, d) => s + Math.max(0, (d.totalAmount || 0) - (d.paidAmount || 0)), 0);
  const monthKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;

  // Solo incluir servicios que pertenezcan a este mes:
  // - con dueDate exacta: solo si cae en este mes
  // - sin dueDate (legado dueDay): aparece todos los meses
  const servicesThisMonth = services.filter(sv => {
    if (sv.active === false) return false;
    if (sv.dueDate) {
      const due = new Date(sv.dueDate + "T00:00:00");
      return due.getFullYear() === target.getFullYear() && due.getMonth() === target.getMonth();
    }
    return true;
  });
  const pendingServices = servicesThisMonth.filter(sv => !(sv.payments || []).includes(monthKey));
  const pendingTotal = pendingServices.reduce((s, sv) => s + (sv.amount || 0), 0);
  const monthName = target.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  // ── Saldo proyectado ──
  // Ingresos esperados este mes (todavía no confirmados) + lo que falta
  // pagar este mes (deudas y servicios pendientes) sobre el líquido actual.
  // Líquido siempre es el real de HOY — la proyección parte de ahí, sin
  // importar qué mes estés mirando.
  const [showProjected, setShowProjected] = useState(false);

  const projectedThisMonth = (projectedIncomes || []).filter(p => {
    const d = new Date(p.expectedDate + "T00:00:00");
    return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
  });
  const projectedSum = projectedThisMonth.reduce((s, p) => s + p.amount, 0);

  const debtsDueThisMonth = debts.filter(d => {
    if (!d.dueDate) return false;
    const due = new Date(d.dueDate + "T00:00:00");
    const remaining = Math.max(0, (d.totalAmount || 0) - (d.paidAmount || 0));
    return remaining > 0 && due.getFullYear() === target.getFullYear() && due.getMonth() === target.getMonth();
  });
  const debtsDueSum = debtsDueThisMonth.reduce((s, d) => s + (d.monthlyPayment > 0 ? d.monthlyPayment : Math.max(0, d.totalAmount - d.paidAmount)), 0);
  const monthlyDuesPending = debtsDueSum + pendingTotal;

  const saldoProyectado = liquid + projectedSum - monthlyDuesPending;

  const [showCardDetail, setShowCardDetail] = useState(false);
  const creditTxsThisMonth = credit
    ? thisMonth.filter(t => t.accountId === credit.id && t.type === "expense")
    : [];

  // Desglose de gastos: tarjeta vs resto
  const creditExpense = creditTxsThisMonth.reduce((s, t) => s + t.amount, 0);
  const cashExpense   = expense - creditExpense; // efectivo + débito + billeteras

  return (
    <div style={{ padding: "24px 20px 0" }}>
      <button onClick={onOpenCalendar} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0f1523", border: "1px solid #1e2a3a", borderRadius: 14,
        padding: "14px 16px", marginBottom: 16, cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#14532d", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="calendar" size={17} style={{ color: "#a3e635" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>Calendario</p>
            <p style={{ fontSize: 11, color: "#4b607a" }}>Gastos, ingresos y vencimientos</p>
          </div>
        </div>
        <Icon name="chevron-right" size={16} style={{ color: "#4b607a" }} />
      </button>

      <p style={{ fontSize: 11, letterSpacing: ".15em", color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>RESUMEN</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={onPrevMonth} style={{ background: "none", border: "none", color: "#4b607a", cursor: "pointer", padding: "4px 8px 4px 0", display: "flex" }}>
          <Icon name="chevron-left" size={16} />
        </button>
        <button onClick={onResetMonth} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 13, color: "#c4d0e0", textTransform: "capitalize" }}>{monthName}</span>
          {!isCurrentMonth && (
            <span style={{ fontSize: 10, color: "#38bdf8", fontFamily: "'DM Mono', monospace" }}>volver a hoy</span>
          )}
        </button>
        <button onClick={onNextMonth} style={{ background: "none", border: "none", color: "#4b607a", cursor: "pointer", padding: "4px 0 4px 8px", display: "flex" }}>
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      {/* Balance */}
      <div style={{ background: "#0f1523", borderRadius: 16, padding: 20, marginBottom: 12, border: "1px solid #1e2a3a" }}>
        <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em" }}>BALANCE DEL MES</p>
        <p style={{ fontSize: 32, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: balance >= 0 ? "#a3e635" : "#ef4444", margin: "6px 0 12px" }}>{fmt(balance)}</p>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>INGRESOS</p>
            <p style={{ fontSize: 16, color: "#a3e635", fontFamily: "'DM Mono', monospace" }}>{fmt(income)}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>GASTOS</p>
            <p style={{ fontSize: 16, color: "#ef4444", fontFamily: "'DM Mono', monospace" }}>{fmt(expense)}</p>
          </div>
        </div>

        <button onClick={() => setShowProjected(v => !v)} style={{
          width: "100%", background: "none", border: "none", borderTop: "1px solid #1e2a3a",
          marginTop: 16, paddingTop: 12, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: "#38bdf8", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="chart-line" size={14} /> Saldo proyectado
          </span>
          <Icon name={showProjected ? "chevron-up" : "chevron-down"} size={14} style={{ color: "#4b607a" }} />
        </button>

        {showProjected && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontSize: 12, color: "#c4d0e0" }}>Líquido actual</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#38bdf8" }}>{fmt(liquid)}</span>
            </div>

            {projectedThisMonth.map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 12, color: "#c4d0e0", flex: 1 }}>
                  + {p.description} <span style={{ color: "#4b607a" }}>({new Date(p.expectedDate + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })})</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#a3e635" }}>+{fmt(p.amount)}</span>
                  <button onClick={() => onConfirmProjected(p.id)} title="Ya lo cobré" style={{ background: "#14532d", border: "none", borderRadius: 6, width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="check" size={12} style={{ color: "#a3e635" }} />
                  </button>
                  <button onClick={() => onDeleteProjected(p.id)} title="Eliminar" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                    <Icon name="trash" size={12} style={{ color: "#4b607a" }} />
                  </button>
                </div>
              </div>
            ))}

            {monthlyDuesPending > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ fontSize: 12, color: "#c4d0e0" }}>− Vencimientos pendientes este mes</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#f87171" }}>−{fmt(monthlyDuesPending)}</span>
              </div>
            )}

            {projectedThisMonth.length === 0 && (
              <p style={{ fontSize: 11, color: "#4b607a", padding: "4px 0" }}>Sin ingresos proyectados este mes</p>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e2a3a", marginTop: 8, paddingTop: 10 }}>
              <span style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".08em" }}>PROYECTADO</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 600, color: saldoProyectado >= 0 ? "#a3e635" : "#ef4444" }}>{fmt(saldoProyectado)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Desglose de gastos */}
      {expense > 0 && (
        <div style={{ background: "#0f1523", borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: "1px solid #1e2a3a" }}>
          <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", marginBottom: 12 }}>DESGLOSE DE GASTOS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#c4d0e0", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="wallet" size={13} style={{ color: "#38bdf8" }} /> Efectivo / débito / billetera
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#ef4444" }}>-{fmt(cashExpense)}</span>
            </div>
            {credit && creditExpense > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#c4d0e0", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="credit-card" size={13} style={{ color: "#f59e0b" }} /> Tarjeta (a pagar)
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#f59e0b" }}>-{fmt(creditExpense)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e2a3a", paddingTop: 8, marginTop: 2 }}>
              <span style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".08em" }}>TOTAL GASTOS</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#ef4444", fontWeight: 600 }}>-{fmt(expense)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Liquid + Credit */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, background: "#0f1523", borderRadius: 14, padding: 16, border: "1px solid #1e2a3a" }}>
          <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>LÍQUIDO</p>
          <p style={{ fontSize: 20, fontFamily: "'DM Mono', monospace", color: "#38bdf8", marginTop: 4 }}>{fmt(liquid)}</p>
        </div>
        {credit && (
          <div style={{ flex: 1, background: "#0f1523", borderRadius: 14, border: "1px solid #1e2a3a", overflow: "hidden" }}>
            <button onClick={() => setShowCardDetail(v => !v)} style={{
              width: "100%", background: "none", border: "none", cursor: "pointer", padding: 16, textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>TARJETA</p>
                  <p style={{ fontSize: 20, fontFamily: "'DM Mono', monospace", color: "#f59e0b", marginTop: 4 }}>{fmt(creditUsed)}</p>
                  <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>de {fmt(credit.limit)}</p>
                </div>
                <Icon name={showCardDetail ? "chevron-up" : "chevron-down"} size={14} style={{ color: "#4b607a", marginTop: 2 }} />
              </div>
            </button>
            {showCardDetail && (
              <div style={{ borderTop: "1px solid #1e2a3a" }}>
                {creditTxsThisMonth.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#4b607a", padding: "12px 16px" }}>Sin gastos con tarjeta este mes</p>
                ) : (
                  creditTxsThisMonth.map((t, i) => (
                    <div key={t.id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 16px", borderBottom: i < creditTxsThisMonth.length - 1 ? "1px solid #1a2130" : "none",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: "#c4d0e0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</p>
                        {t.installmentInfo?.total > 1 && (
                          <span style={{ fontSize: 10, color: "#f59e0b", fontFamily: "'DM Mono', monospace" }}>
                            cuota {t.installmentInfo.current}/{t.installmentInfo.total}
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#f59e0b", flexShrink: 0, marginLeft: 8 }}>
                        -{fmt(t.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deudas + Servicios summary */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, background: "#0f1523", borderRadius: 14, padding: 16, border: "1px solid #1e2a3a" }}>
          <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>DEUDA TOTAL</p>
          <p style={{ fontSize: 20, fontFamily: "'DM Mono', monospace", color: totalDebt > 0 ? "#f87171" : "#6b7f96", marginTop: 4 }}>{fmt(totalDebt)}</p>
          <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>{debts.length} deuda{debts.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ flex: 1, background: "#0f1523", borderRadius: 14, padding: 16, border: "1px solid #1e2a3a" }}>
          <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>SERVICIOS PEND.</p>
          <p style={{ fontSize: 20, fontFamily: "'DM Mono', monospace", color: pendingTotal > 0 ? "#c084fc" : "#6b7f96", marginTop: 4 }}>{fmt(pendingTotal)}</p>
          <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>{pendingServices.length} pendiente{pendingServices.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Accounts */}
      <div style={{ background: "#0f1523", borderRadius: 14, padding: 16, border: "1px solid #1e2a3a", marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", marginBottom: 12 }}>CUENTAS</p>
        {accounts.map(a => {
          const isCredit = a.type === "credit";
          const displayBalance = isCredit ? Math.abs(Math.min(0, a.balance || 0)) : (a.balance || 0);
          const balanceColor = isCredit
            ? (displayBalance > 0 ? "#fb923c" : "#f1f5f9")
            : (displayBalance < 0 ? "#ef4444" : "#f1f5f9");
          return (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color }} />
                <span style={{ fontSize: 13, color: "#c4d0e0" }}>{a.name}</span>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: balanceColor }}>
                {isCredit && displayBalance > 0 ? "-" : ""}{fmt(displayBalance)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Top categories */}
      {catList.length > 0 && (
        <div style={{ background: "#0f1523", borderRadius: 14, padding: 16, border: "1px solid #1e2a3a" }}>
          <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", marginBottom: 12 }}>TOP CATEGORÍAS</p>
          {catList.map(([catId, total]) => {
            const c = EXPENSE_CATS.find(c => c.id === catId);
            const pct = expense > 0 ? (total / expense) * 100 : 0;
            return (
              <div key={catId} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#c4d0e0" }}>{c?.icon} {c?.label || catId}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#ef4444" }}>{fmt(total)}</span>
                </div>
                <div style={{ background: "#1e2a3a", borderRadius: 4, height: 4 }}>
                  <div style={{ background: "#ef4444", borderRadius: 4, height: 4, width: `${pct}%`, opacity: 0.7 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

