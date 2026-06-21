// components/CalendarView.jsx
//
// Vista de calendario a pantalla completa. Junta tres fuentes en una
// sola grilla mensual: movimientos (transactions), vencimientos de
// deudas (debts.dueDate) y vencimientos de servicios (services.dueDay,
// recurrente cada mes mientras esté activo).
//
// Props:
//   transactions — historial completo de movimientos
//   debts        — lista de deudas
//   services     — lista de servicios recurrentes
//   onBack       — función para volver a Inicio

import { useState } from "react";
import { SERVICE_CATS } from "../constants";
import { fmt } from "../utils/format";

const Icon = ({ name, size = 16, style = {} }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: size, ...style }} aria-hidden="true" />
);

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const TYPE_COLOR = { income: "#a3e635", expense: "#f87171", due: "#fb923c" };

function buildMonthEvents(year, month, transactions, debts, services) {
  const events = [];

  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      events.push({
        day: d.getDate(),
        type: t.type, // "income" | "expense"
        label: t.description || (t.type === "income" ? "Ingreso" : "Gasto"),
        amount: t.amount,
        icon: t.type === "income" ? "arrow-down-left" : "shopping-cart",
        paid: true,
      });
    }
  });

  debts.forEach(d => {
    if (!d.dueDate) return;
    const due = new Date(d.dueDate + "T00:00:00");
    if (due.getFullYear() === year && due.getMonth() === month) {
      const remaining = Math.max(0, (d.totalAmount || 0) - (d.paidAmount || 0));
      events.push({
        day: due.getDate(),
        type: "due",
        label: d.name,
        amount: d.monthlyPayment > 0 ? d.monthlyPayment : remaining,
        icon: "credit-card",
        paid: remaining <= 0,
      });
    }
  });

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const lastDay  = new Date(year, month + 1, 0).getDate();
  services.forEach(sv => {
    if (sv.active === false || !sv.dueDay) return;
    const cat = SERVICE_CATS.find(c => c.id === sv.category);
    events.push({
      day: Math.min(sv.dueDay, lastDay),
      type: "due",
      label: sv.name,
      amount: sv.amount,
      icon: cat?.icon || "refresh",
      paid: (sv.payments || []).includes(monthKey),
    });
  });

  return events;
}

export function CalendarView({ transactions, debts, services, onBack }) {
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year   = target.getFullYear();
  const month  = target.getMonth();
  const isCurrentMonth = monthOffset === 0;

  const [selectedDay, setSelectedDay] = useState(isCurrentMonth ? now.getDate() : null);

  const changeMonth = (delta) => {
    const newOffset = monthOffset + delta;
    setMonthOffset(newOffset);
    setSelectedDay(newOffset === 0 ? now.getDate() : null);
  };

  const events     = buildMonthEvents(year, month, transactions, debts, services);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7; // lunes-first

  const monthLabel = target.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const dayEvents  = selectedDay ? events.filter(e => e.day === selectedDay) : [];

  return (
    <div style={{ padding: "24px 20px 0" }}>
      {/* Header con volver */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#4b607a", cursor: "pointer", padding: 4, display: "flex" }}>
          <Icon name="arrow-left" size={20} />
        </button>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>Calendario</p>
      </div>

      <div style={{ background: "#0f1523", borderRadius: 16, border: "1px solid #1e2a3a", padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => changeMonth(-1)} style={{ background: "none", border: "none", color: "#4b607a", cursor: "pointer", padding: 4 }}>
            <Icon name="chevron-left" size={16} />
          </button>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", textTransform: "capitalize" }}>{monthLabel}</p>
          <button onClick={() => changeMonth(1)} style={{ background: "none", border: "none", color: "#4b607a", cursor: "pointer", padding: 4 }}>
            <Icon name="chevron-right" size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
          {WEEKDAYS.map((w, i) => (
            <span key={i} style={{ textAlign: "center", fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>{w}</span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvts = events.filter(e => e.day === day);
            const isToday = isCurrentMonth && day === now.getDate();
            const isSelected = day === selectedDay;
            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  aspectRatio: "1", borderRadius: 8, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12,
                  color: "#c4d0e0", background: isSelected ? "#0c4a6e" : "#131b29",
                  border: `1px solid ${isToday ? "#a3e635" : isSelected ? "#38bdf8" : "transparent"}`,
                  fontWeight: isToday ? 600 : 400, gap: 3,
                }}
              >
                <span>{day}</span>
                <div style={{ display: "flex", gap: 2, height: 5 }}>
                  {dayEvts.slice(0, 3).map((e, idx) => (
                    <div key={idx} style={{ width: 4, height: 4, borderRadius: "50%", background: TYPE_COLOR[e.type], opacity: e.paid && e.type === "due" ? 0.4 : 1 }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {selectedDay && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1a2130" }}>
            <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".08em", marginBottom: 10, textTransform: "capitalize" }}>
              {new Date(year, month, selectedDay).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {dayEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: "#4b607a" }}>Sin movimientos este día</p>
            ) : (
              dayEvents.map((e, idx) => {
                const color = e.paid && e.type === "due" ? "#4b607a" : TYPE_COLOR[e.type];
                const bg    = e.paid && e.type === "due" ? "#1e2a3a" : (e.type === "income" ? "#14532d" : e.type === "expense" ? "#3b0f0f" : "#431407");
                const sign  = e.type === "expense" ? "-" : e.type === "income" ? "+" : "";
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: idx < dayEvents.length - 1 ? "1px solid #1a2130" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={e.paid && e.type === "due" ? "check" : e.icon} size={15} style={{ color }} />
                    </div>
                    <p style={{ flex: 1, fontSize: 13, color: e.paid && e.type === "due" ? "#6b7f96" : "#f1f5f9", textDecoration: e.paid && e.type === "due" ? "line-through" : "none" }}>
                      {e.label}
                    </p>
                    {e.amount > 0 && (
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color }}>{sign}{fmt(e.amount)}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
