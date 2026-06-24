// components/FinanzasView.jsx

import { useState } from "react";
import { SERVICE_CATS, ACCOUNT_TYPES } from "../constants";
import { fmt, uid } from "../utils/format";
import { FormCard } from "./shared/FormCard";
import { InputRow } from "./shared/InputRow";
import { FormActions } from "./shared/FormActions";

const Icon = ({ name, size = 16, style = {} }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: size, ...style }} aria-hidden="true" />
);

// Calcula días hasta el vencimiento y devuelve texto + color según urgencia
function dueDateInfo(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  const label = due.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

  if (diffDays < 0)  return { text: `Vencido (${label})`, color: "#f87171" };
  if (diffDays === 0) return { text: `Vence hoy`, color: "#f87171" };
  if (diffDays <= 5)  return { text: `Vence en ${diffDays} día${diffDays === 1 ? "" : "s"} (${label})`, color: "#fb923c" };
  return { text: `Vence ${label}`, color: "#4b607a" };
}

const JAR_TYPES = [
  { id: "fisico",   label: "Físico",       icon: "building-bank",  color: "#a3e635", bg: "#14532d" },
  { id: "mp",       label: "Mercado Pago", icon: "wallet",         color: "#38bdf8", bg: "#0c4a6e" },
  { id: "naranja",  label: "Naranja X",    icon: "credit-card",    color: "#fb923c", bg: "#431407" },
  { id: "brubank",  label: "Brubank",      icon: "device-mobile",  color: "#a78bfa", bg: "#2e1065" },
  { id: "uala",     label: "Ualá",         icon: "cash",           color: "#c084fc", bg: "#3b0764" },
  { id: "otra_app", label: "Otra app",     icon: "apps",           color: "#94a3b8", bg: "#1e293b" },
];

export function FinanzasView({ debts, setDebts, services, setServices, jars, setJars, accounts, onAddAccount, onUpdateAccount, onDeleteAccount, onPayDebt, onPayService, onUnmarkServicePaid, onPayCreditCard, monthOffset, onPrevMonth, onNextMonth, onResetMonth }) {
  const [section, setSection]               = useState("debts");
  const [showDebtForm, setShowDebtForm]     = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editDebt, setEditDebt]             = useState(null);
  const [editService, setEditService]       = useState(null);
  const [payDebtId, setPayDebtId]           = useState(null);
  const [payServiceId, setPayServiceId]     = useState(null);

  const now    = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + (monthOffset || 0), 1);
  const isCurrentMonth = (monthOffset || 0) === 0;
  const monthKey   = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = target.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const totalDebt       = debts.reduce((s, d) => s + Math.max(0, d.totalAmount - d.paidAmount), 0);
  const monthlyDebts    = debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0);
  const activeServices  = services.filter(s => s.active !== false);
  const monthlyServices = activeServices.reduce((s, sv) => s + (sv.amount || 0), 0);
  const totalMonthly    = monthlyDebts + monthlyServices;

  const servicesPaidThisMonth    = activeServices.filter(sv => sv.payments?.includes(monthKey));
  const servicesPendingThisMonth = activeServices.filter(sv => !sv.payments?.includes(monthKey));

  const deleteDebt    = (id) => setDebts(prev => prev.filter(d => d.id !== id));
  const deleteService = (id) => setServices(prev => prev.filter(s => s.id !== id));

  const SECTION_TABS = [
    { id: "debts",    label: "Deudas",    icon: "credit-card" },
    { id: "services", label: "Servicios", icon: "refresh" },
    { id: "jars",     label: "Frascos",   icon: "bucket" },
    { id: "cuentas",  label: "Cuentas",   icon: "wallet" },
  ];

  return (
    <div style={{ padding: "24px 20px 0" }}>
      <p style={{ fontSize: 11, letterSpacing: ".15em", color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>FINANZAS</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onPrevMonth} style={{ background: "none", border: "none", color: "#4b607a", cursor: "pointer", padding: "4px 8px 4px 0", display: "flex" }}>
          <Icon name="chevron-left" size={16} />
        </button>
        <button onClick={onResetMonth} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 13, color: "#c4d0e0", textTransform: "capitalize" }}>{monthLabel}</span>
          {!isCurrentMonth && (
            <span style={{ fontSize: 10, color: "#38bdf8", fontFamily: "'DM Mono', monospace" }}>volver a hoy</span>
          )}
        </button>
        <button onClick={onNextMonth} style={{ background: "none", border: "none", color: "#4b607a", cursor: "pointer", padding: "4px 0 4px 8px", display: "flex" }}>
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      {/* Summary card */}
      <div style={{ background: "#0f1c2e", borderRadius: 16, padding: 18, marginBottom: 18, border: "1px solid #1e2a3a" }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".12em", marginBottom: 10 }}>OBLIGACIONES MENSUALES</p>
        <p style={{ fontSize: 28, fontFamily: "'DM Mono', monospace", color: "#f1f5f9", margin: "0 0 12px" }}>{fmt(totalMonthly)}</p>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>DEUDAS</p>
            <p style={{ fontSize: 15, color: "#f87171", fontFamily: "'DM Mono', monospace" }}>{fmt(monthlyDebts)}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>SERVICIOS</p>
            <p style={{ fontSize: 15, color: "#38bdf8", fontFamily: "'DM Mono', monospace" }}>{fmt(monthlyServices)}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>DEUDA TOTAL</p>
            <p style={{ fontSize: 15, color: "#fb923c", fontFamily: "'DM Mono', monospace" }}>{fmt(totalDebt)}</p>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", background: "#0f1523", borderRadius: 10, padding: 3, marginBottom: 20 }}>
        {SECTION_TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setSection(id)} style={{
            flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 500, transition: "all .2s", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 5,
            background: section === id ? "#1e2a3a" : "none",
            color: section === id ? "#f1f5f9" : "#4b607a",
          }}>
            <Icon name={icon} size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── DEUDAS ── */}
      {section === "debts" && (
        <>
          {debts.length === 0 && !showDebtForm && (
            <p style={{ textAlign: "center", color: "#4b607a", fontSize: 13, padding: "20px 0" }}>Sin deudas registradas</p>
          )}
          {debts.map(d => {
            const remaining = Math.max(0, d.totalAmount - d.paidAmount);
            const pct       = d.totalAmount > 0 ? Math.min(100, (d.paidAmount / d.totalAmount) * 100) : 0;
            const isEditing = editDebt?.id === d.id;
            const due       = dueDateInfo(d.dueDate);
            return (
              <div key={d.id} style={{ background: "#0f1523", borderRadius: 14, border: "1px solid #1e2a3a", marginBottom: 10, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, color: "#f1f5f9", fontWeight: 500, margin: 0 }}>{d.name}</p>
                      {due && (
                        <p style={{ fontSize: 11, color: due.color, fontFamily: "'DM Mono', monospace", margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                          <Icon name="calendar-event" size={11} /> {due.text}
                        </p>
                      )}
                      {d.notes && <p style={{ fontSize: 11, color: "#4b607a", margin: "2px 0 0" }}>{d.notes}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setEditDebt(isEditing ? null : { ...d })} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                        <Icon name="pencil" size={15} />
                      </button>
                      <button onClick={() => deleteDebt(d.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                  <div style={{ background: "#1e2a3a", borderRadius: 4, height: 5, marginBottom: 8 }}>
                    <div style={{ background: pct >= 100 ? "#a3e635" : "#fb923c", borderRadius: 4, height: 5, width: `${pct}%`, transition: "width .4s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>PAGADO</p>
                      <p style={{ fontSize: 13, color: "#a3e635", fontFamily: "'DM Mono', monospace" }}>{fmt(d.paidAmount)}</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>CUOTA</p>
                      <p style={{ fontSize: 13, color: "#38bdf8", fontFamily: "'DM Mono', monospace" }}>{fmt(d.monthlyPayment)}/mes</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>RESTA</p>
                      <p style={{ fontSize: 13, color: remaining > 0 ? "#f87171" : "#a3e635", fontFamily: "'DM Mono', monospace" }}>{fmt(remaining)}</p>
                    </div>
                  </div>
                  {remaining > 0 && (
                    <button onClick={() => setPayDebtId(payDebtId === d.id ? null : d.id)} style={{
                      width: "100%", marginTop: 12, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                      background: payDebtId === d.id ? "#0c4a6e" : "#1e2a3a", color: "#38bdf8", fontSize: 12, fontWeight: 500,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}>
                      <Icon name="cash" size={13} /> Registrar pago
                    </button>
                  )}
                </div>
                {payDebtId === d.id && (
                  <PayPanel
                    accounts={accounts}
                    defaultAmount={d.monthlyPayment > 0 ? d.monthlyPayment : remaining}
                    onConfirm={(amount, accountId) => { onPayDebt(d.id, amount, accountId); setPayDebtId(null); }}
                    onCancel={() => setPayDebtId(null)}
                  />
                )}
                {isEditing && (
                  <DebtEditPanel
                    debt={editDebt}
                    onChange={setEditDebt}
                    onSave={() => { setDebts(prev => prev.map(d => d.id === editDebt.id ? editDebt : d)); setEditDebt(null); }}
                    onCancel={() => setEditDebt(null)}
                  />
                )}
              </div>
            );
          })}
          {showDebtForm && (
            <DebtForm
              onSave={(d) => { setDebts(prev => [...prev, { ...d, id: uid(), paidAmount: d.paidAmount || 0 }]); setShowDebtForm(false); }}
              onCancel={() => setShowDebtForm(false)}
            />
          )}
          {!showDebtForm && (
            <button onClick={() => setShowDebtForm(true)} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "1px dashed #1e2a3a", background: "none", color: "#4b607a", cursor: "pointer", fontSize: 13, marginTop: 4 }}>
              + Agregar deuda
            </button>
          )}
        </>
      )}

      {/* ── SERVICIOS ── */}
      {section === "services" && (
        <>
          {activeServices.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                { label: "PENDIENTES", value: servicesPendingThisMonth.length, color: "#f87171" },
                { label: "PAGADOS",    value: servicesPaidThisMonth.length,    color: "#a3e635" },
                { label: "POR PAGAR",  value: fmt(servicesPendingThisMonth.reduce((s, sv) => s + sv.amount, 0)), color: "#38bdf8" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, background: "#0f1523", borderRadius: 10, padding: "10px 14px", border: "1px solid #1e2a3a" }}>
                  <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>{label}</p>
                  <p style={{ fontSize: 18, color, fontFamily: "'DM Mono', monospace" }}>{value}</p>
                </div>
              ))}
            </div>
          )}
          {services.length === 0 && !showServiceForm && (
            <p style={{ textAlign: "center", color: "#4b607a", fontSize: 13, padding: "20px 0" }}>Sin servicios registrados</p>
          )}
          <div style={{ background: "#0f1523", borderRadius: 14, border: "1px solid #1e2a3a", overflow: "hidden", marginBottom: 10 }}>
            {services.map((sv, i) => {
              const cat       = SERVICE_CATS.find(c => c.id === sv.category);
              const isPaid    = sv.payments?.includes(monthKey);
              const isEditing = editService?.id === sv.id;
              const due       = dueDateInfo(sv.dueDate);
              return (
                <div key={sv.id}>
                  <div style={{
                    display: "flex", alignItems: "center", padding: "13px 16px", gap: 12,
                    borderBottom: i < services.length - 1 && !isEditing ? "1px solid #1a2130" : "none",
                    opacity: sv.active === false ? 0.45 : 1,
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1e2a3a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={cat?.icon || "package"} size={18} style={{ color: "#6b7f96" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "#c4d0e0", margin: 0 }}>{sv.name}</p>
                      <p style={{ fontSize: 11, color: due ? due.color : "#4b607a", fontFamily: "'DM Mono', monospace", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                        {fmt(sv.amount)}/mes
                        {due && <> · <Icon name="calendar-event" size={10} /> {due.text}</>}
                        {!due && sv.dueDay && ` · vence día ${sv.dueDay} (aprox.)`}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => setEditService(isEditing ? null : { ...sv })} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                        <Icon name="pencil" size={14} />
                      </button>
                      <button onClick={() => deleteService(sv.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                        <Icon name="trash" size={14} />
                      </button>
                      <button onClick={() => isPaid ? onUnmarkServicePaid(sv.id, monthOffset) : setPayServiceId(payServiceId === sv.id ? null : sv.id)} style={{
                        padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11,
                        background: isPaid ? "#14532d" : (payServiceId === sv.id ? "#0c4a6e" : "#1e2a3a"),
                        color: isPaid ? "#a3e635" : "#4b607a",
                        fontFamily: "'DM Mono', monospace", transition: "all .2s",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        {isPaid && <Icon name="check" size={11} />}
                        {isPaid ? "pago" : "pendiente"}
                      </button>
                    </div>
                  </div>
                  {payServiceId === sv.id && (
                    <PayPanel
                      accounts={accounts}
                      defaultAmount={sv.amount}
                      onConfirm={(amount, accountId) => { onPayService(sv.id, amount, accountId, monthOffset); setPayServiceId(null); }}
                      onCancel={() => setPayServiceId(null)}
                    />
                  )}
                  {isEditing && (
                    <ServiceEditPanel
                      service={editService}
                      onChange={setEditService}
                      onSave={() => { setServices(prev => prev.map(s => s.id === editService.id ? editService : s)); setEditService(null); }}
                      onCancel={() => setEditService(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {showServiceForm && (
            <ServiceForm
              onSave={(sv) => { setServices(prev => [...prev, { ...sv, id: uid(), payments: [] }]); setShowServiceForm(false); }}
              onCancel={() => setShowServiceForm(false)}
            />
          )}
          {!showServiceForm && (
            <button onClick={() => setShowServiceForm(true)} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "1px dashed #1e2a3a", background: "none", color: "#4b607a", cursor: "pointer", fontSize: 13 }}>
              + Agregar servicio
            </button>
          )}
        </>
      )}

      {/* ── FRASCOS ── */}
      {section === "jars" && (
        <JarsSection jars={jars} setJars={setJars} />
      )}

      {/* ── CUENTAS ── */}
      {section === "cuentas" && (
        <CuentasSection accounts={accounts} debts={debts} onAdd={onAddAccount} onUpdate={onUpdateAccount} onDelete={onDeleteAccount} onPayCard={onPayCreditCard} />
      )}
    </div>
  );
}

// ── Debt forms ─────────────────────────────────────────────────────────────
function DebtForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: "", totalAmount: "", paidAmount: "", monthlyPayment: "", dueDate: "", notes: "" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name && f.totalAmount;
  return (
    <FormCard title="Nueva deuda">
      <InputRow label="Nombre"             value={f.name}           onChange={v => set("name", v)}          placeholder="ej. Préstamo banco" />
      <InputRow label="Total adeudado ($)" value={f.totalAmount}    onChange={v => set("totalAmount", v)}   placeholder="0" type="number" />
      <InputRow label="Ya pagado ($)"      value={f.paidAmount}     onChange={v => set("paidAmount", v)}    placeholder="0" type="number" />
      <InputRow label="Cuota mensual ($)"  value={f.monthlyPayment} onChange={v => set("monthlyPayment", v)} placeholder="0" type="number" />
      <InputRow label="Próximo vencimiento" value={f.dueDate}       onChange={v => set("dueDate", v)}       type="date" />
      <InputRow label="Notas (opcional)"   value={f.notes}          onChange={v => set("notes", v)}         placeholder="" />
      <FormActions
        onSave={() => valid && onSave({ ...f, totalAmount: +f.totalAmount, paidAmount: +(f.paidAmount || 0), monthlyPayment: +(f.monthlyPayment || 0) })}
        onCancel={onCancel}
        disabled={!valid}
      />
    </FormCard>
  );
}

function DebtEditPanel({ debt, onChange, onSave, onCancel }) {
  const set = (k, v) => onChange(p => ({ ...p, [k]: v }));
  return (
    <FormCard title="Editar deuda" nested>
      <InputRow label="Nombre"             value={debt.name}          onChange={v => set("name", v)} />
      <InputRow label="Total adeudado ($)" value={debt.totalAmount}   onChange={v => set("totalAmount", +v)}    type="number" />
      <InputRow label="Ya pagado ($)"      value={debt.paidAmount}    onChange={v => set("paidAmount", +v)}     type="number" />
      <InputRow label="Cuota mensual ($)"  value={debt.monthlyPayment} onChange={v => set("monthlyPayment", +v)} type="number" />
      <InputRow label="Próximo vencimiento" value={debt.dueDate || ""} onChange={v => set("dueDate", v)}        type="date" />
      <InputRow label="Notas"              value={debt.notes}         onChange={v => set("notes", v)} />
      <FormActions onSave={onSave} onCancel={onCancel} saveLabel="Guardar" />
    </FormCard>
  );
}

// ── Service forms ──────────────────────────────────────────────────────────
function ServiceForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: "", amount: "", dueDate: "", category: "other", active: true });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name && f.amount;
  return (
    <FormCard title="Nuevo servicio">
      <InputRow label="Nombre"            value={f.name}   onChange={v => set("name", v)}   placeholder="ej. Spotify" />
      <InputRow label="Monto mensual ($)" value={f.amount} onChange={v => set("amount", v)} placeholder="0" type="number" />
      <InputRow label="Próximo vencimiento" value={f.dueDate} onChange={v => set("dueDate", v)} type="date" />
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>CATEGORÍA</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SERVICE_CATS.map(c => (
            <button key={c.id} onClick={() => set("category", c.id)} style={{
              padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
              background: f.category === c.id ? "#1e2a3a" : "#0b0f1a",
              color: f.category === c.id ? "#a3e635" : "#4b607a",
              outline: f.category === c.id ? "1px solid #a3e635" : "1px solid #1e2a3a",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <Icon name={c.icon} size={13} /> {c.label}
            </button>
          ))}
        </div>
      </div>
      <FormActions
        onSave={() => valid && onSave({ ...f, amount: +f.amount, dueDate: f.dueDate || null })}
        onCancel={onCancel}
        disabled={!valid}
      />
    </FormCard>
  );
}

function ServiceEditPanel({ service, onChange, onSave, onCancel }) {
  const set = (k, v) => onChange(p => ({ ...p, [k]: v }));
  return (
    <FormCard title="Editar servicio" nested>
      <InputRow label="Nombre"             value={service.name}        onChange={v => set("name", v)} />
      <InputRow label="Monto mensual ($)"  value={service.amount}      onChange={v => set("amount", +v)}  type="number" />
      <InputRow label="Próximo vencimiento" value={service.dueDate || ""} onChange={v => set("dueDate", v)} type="date" />
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>CATEGORÍA</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SERVICE_CATS.map(c => (
            <button key={c.id} onClick={() => set("category", c.id)} style={{
              padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
              background: service.category === c.id ? "#1e2a3a" : "#0b0f1a",
              color: service.category === c.id ? "#a3e635" : "#4b607a",
              outline: service.category === c.id ? "1px solid #a3e635" : "1px solid #1e2a3a",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <Icon name={c.icon} size={13} /> {c.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>ACTIVO</p>
        <button onClick={() => set("active", !service.active)} style={{
          padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
          background: service.active !== false ? "#14532d" : "#1e2a3a",
          color: service.active !== false ? "#a3e635" : "#4b607a",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {service.active !== false && <Icon name="check" size={12} />}
          {service.active !== false ? "Activo" : "Pausado"}
        </button>
      </div>
      <FormActions onSave={onSave} onCancel={onCancel} saveLabel="Guardar" />
    </FormCard>
  );
}

// ── Frascos ────────────────────────────────────────────────────────────────
function JarsSection({ jars, setJars }) {
  const [showForm, setShowForm] = useState(false);
  const [editJar, setEditJar]   = useState(null);
  const [moveJar, setMoveJar]   = useState(null);

  const totalSaved = jars.reduce((s, j) => s + (j.balance || 0), 0);

  const deleteJar = (id) => setJars(prev => prev.filter(j => j.id !== id));

  const saveJar = (data) => {
    if (editJar) {
      setJars(prev => prev.map(j => j.id === editJar.id ? { ...j, ...data } : j));
      setEditJar(null);
    } else {
      setJars(prev => [...prev, { ...data, id: uid(), balance: 0, history: [] }]);
    }
    setShowForm(false);
  };

  const applyMove = (jarId, amount, type, note) => {
    setJars(prev => prev.map(j => {
      if (j.id !== jarId) return j;
      const delta = type === "add" ? amount : -amount;
      const entry = { id: uid(), type, amount, note: note || (type === "add" ? "Depósito" : "Retiro"), date: new Date().toISOString() };
      return { ...j, balance: (j.balance || 0) + delta, history: [entry, ...(j.history || [])] };
    }));
    setMoveJar(null);
  };

  return (
    <>
      {jars.length > 0 && (
        <div style={{ background: "#0f1523", borderRadius: 14, padding: "14px 18px", border: "1px solid #1e2a3a", marginBottom: 14 }}>
          <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em" }}>TOTAL AHORRADO</p>
          <p style={{ fontSize: 26, fontFamily: "'DM Mono', monospace", color: "#a3e635", margin: "4px 0 0" }}>{fmt(totalSaved)}</p>
        </div>
      )}

      {jars.length === 0 && !showForm && (
        <p style={{ textAlign: "center", color: "#4b607a", fontSize: 13, padding: "20px 0" }}>Todavía no tenés frascos</p>
      )}

      {jars.map(jar => {
        const type      = JAR_TYPES.find(t => t.id === jar.type) || JAR_TYPES[0];
        const pct       = jar.goal > 0 ? Math.min(100, ((jar.balance || 0) / jar.goal) * 100) : null;
        const isMoving  = moveJar?.id === jar.id;
        const isEditing = editJar?.id === jar.id;

        return (
          <div key={jar.id} style={{
            background: "#0f1523", borderRadius: 14,
            border: `1px solid ${isMoving ? type.color + "60" : "#1e2a3a"}`,
            marginBottom: 10, overflow: "hidden", transition: "border .2s",
          }}>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: type.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={type.icon} size={18} style={{ color: type.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: "#f1f5f9", fontWeight: 500, margin: 0 }}>{jar.name}</p>
                    <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: type.color, background: type.bg, padding: "1px 6px", borderRadius: 4 }}>
                      {type.label}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setEditJar(jar); setShowForm(true); setMoveJar(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                    <Icon name="pencil" size={15} />
                  </button>
                  <button onClick={() => deleteJar(jar.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 26, fontFamily: "'DM Mono', monospace", color: type.color, margin: `0 0 ${jar.goal > 0 ? "4px" : "10px"}` }}>
                {fmt(jar.balance || 0)}
              </p>

              {jar.goal > 0 && (
                <>
                  <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
                    meta: {fmt(jar.goal)} · {pct?.toFixed(0)}%
                  </p>
                  <div style={{ background: "#1e2a3a", borderRadius: 4, height: 5, marginBottom: 10 }}>
                    <div style={{ background: pct >= 100 ? "#a3e635" : type.color, borderRadius: 4, height: 5, width: `${pct}%`, transition: "width .4s" }} />
                  </div>
                </>
              )}

              {jar.notes && <p style={{ fontSize: 11, color: "#4b607a", marginBottom: 10 }}>{jar.notes}</p>}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setMoveJar(isMoving && moveJar?._action === "add" ? null : { ...jar, _action: "add" })} style={{
                  flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: isMoving && moveJar?._action === "add" ? "#14532d" : "#1e2a3a",
                  color: "#a3e635", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <Icon name="plus" size={13} /> Ingresar
                </button>
                <button onClick={() => setMoveJar(isMoving && moveJar?._action === "remove" ? null : { ...jar, _action: "remove" })} style={{
                  flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: isMoving && moveJar?._action === "remove" ? "#3b0f0f" : "#1e2a3a",
                  color: "#f87171", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <Icon name="minus" size={13} /> Retirar
                </button>
              </div>
            </div>

            {isMoving && (
              <JarMovePanel
                action={moveJar._action}
                onConfirm={(amount, note) => applyMove(jar.id, amount, moveJar._action, note)}
                onCancel={() => setMoveJar(null)}
              />
            )}

            {isEditing && !isMoving && (
              <JarForm initial={editJar} onSave={saveJar} onCancel={() => { setEditJar(null); setShowForm(false); }} nested />
            )}
          </div>
        );
      })}

      {showForm && !editJar && (
        <JarForm onSave={saveJar} onCancel={() => setShowForm(false)} />
      )}

      {!showForm && (
        <button onClick={() => { setShowForm(true); setEditJar(null); }} style={{
          width: "100%", padding: "13px", borderRadius: 12, border: "1px dashed #1e2a3a",
          background: "none", color: "#4b607a", cursor: "pointer", fontSize: 13, marginTop: 4,
        }}>
          + Nuevo frasco
        </button>
      )}
    </>
  );
}

function JarForm({ initial, onSave, onCancel, nested }) {
  const [name,  setName]  = useState(initial?.name  || "");
  const [type,  setType]  = useState(initial?.type  || "fisico");
  const [goal,  setGoal]  = useState(initial?.goal  || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const valid = name.trim().length > 0;

  return (
    <FormCard title={initial ? "Editar frasco" : "Nuevo frasco"} nested={nested}>
      <InputRow label="Nombre" value={name} onChange={setName} placeholder="ej. Vacaciones, Fondo emergencia" />
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>TIPO</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {JAR_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
              background: type === t.id ? t.bg : "#0b0f1a",
              color: type === t.id ? t.color : "#4b607a",
              outline: type === t.id ? `1px solid ${t.color}` : "1px solid #1e2a3a",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <Icon name={t.icon} size={13} /> {t.label}
            </button>
          ))}
        </div>
      </div>
      <InputRow label="Meta de ahorro (opcional $)" value={goal}  onChange={setGoal}  placeholder="ej. 100000" type="number" />
      <InputRow label="Notas (opcional)"            value={notes} onChange={setNotes} placeholder="ej. Para el viaje de diciembre" />
      <FormActions
        onSave={() => valid && onSave({ name: name.trim(), type, goal: goal ? +goal : 0, notes })}
        onCancel={onCancel}
        saveLabel={initial ? "Guardar" : "Crear frasco"}
        disabled={!valid}
      />
    </FormCard>
  );
}

function JarMovePanel({ action, onConfirm, onCancel }) {
  const [amount, setAmount] = useState("");
  const [note,   setNote]   = useState("");
  const valid = amount && parseFloat(amount) > 0;
  const isAdd = action === "add";

  return (
    <div style={{ background: "#0b0f1a", borderTop: `1px solid ${isAdd ? "#14532d" : "#3b0f0f"}`, padding: 16 }}>
      <p style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", marginBottom: 12, color: isAdd ? "#a3e635" : "#f87171" }}>
        {isAdd ? "INGRESAR AL FRASCO" : "RETIRAR DEL FRASCO"}
      </p>
      <InputRow label="Monto ($)"       value={amount} onChange={setAmount} placeholder="0" type="number" />
      <InputRow label="Nota (opcional)" value={note}   onChange={setNote}   placeholder={isAdd ? "ej. Sueldo" : "ej. Gasto imprevisto"} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #1e2a3a", background: "none", color: "#6b7f96", cursor: "pointer", fontSize: 13 }}>
          Cancelar
        </button>
        <button onClick={() => valid && onConfirm(parseFloat(amount), note)} disabled={!valid} style={{
          flex: 2, padding: "9px", borderRadius: 10, border: "none",
          cursor: valid ? "pointer" : "not-allowed",
          background: valid ? (isAdd ? "#a3e635" : "#ef4444") : "#1e2a3a",
          color: valid ? "#0b0f1a" : "#4b607a", fontSize: 13, fontWeight: 600,
        }}>
          Confirmar
        </button>
      </div>
    </div>
  );
}

// ── Panel de pago (compartido por Deudas y Servicios) ──────────────────────
// Elegís de qué cuenta sale la plata y el monto. Al confirmar, crea una
// transacción real (descuenta de la cuenta) y se sincroniza con el origen.
function PayPanel({ accounts, defaultAmount, onConfirm, onCancel }) {
  const [amount, setAmount]       = useState(defaultAmount > 0 ? String(defaultAmount) : "");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const valid = amount && parseFloat(amount) > 0 && accountId;

  return (
    <div style={{ background: "#0b0f1a", borderTop: "1px solid #0c4a6e", padding: 16 }}>
      <p style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", marginBottom: 12, color: "#38bdf8" }}>
        REGISTRAR PAGO
      </p>
      <InputRow label="Monto ($)" value={amount} onChange={setAmount} placeholder="0" type="number" />
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>DESDE QUÉ CUENTA</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {accounts.map(a => (
            <button key={a.id} onClick={() => setAccountId(a.id)} style={{
              padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12,
              background: accountId === a.id ? a.color : "#1e2a3a",
              color: accountId === a.id ? "#0b0f1a" : "#6b7f96",
              fontWeight: accountId === a.id ? 600 : 400,
            }}>{a.name}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #1e2a3a", background: "none", color: "#6b7f96", cursor: "pointer", fontSize: 13 }}>
          Cancelar
        </button>
        <button onClick={() => valid && onConfirm(parseFloat(amount), accountId)} disabled={!valid} style={{
          flex: 2, padding: "9px", borderRadius: 10, border: "none", cursor: valid ? "pointer" : "not-allowed",
          background: valid ? "#38bdf8" : "#1e2a3a", color: valid ? "#0b0f1a" : "#4b607a", fontSize: 13, fontWeight: 600,
        }}>
          Confirmar pago
        </button>
      </div>
    </div>
  );
}

// ── Cuentas / billeteras ─────────────────────────────────────────────────
function CuentasSection({ accounts, debts, onAdd, onUpdate, onDelete, onPayCard }) {
  const [showForm, setShowForm]     = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [payCardId, setPayCardId]   = useState(null);
  const [linkingId, setLinkingId]   = useState(null);  // cuenta que está eligiendo a qué deuda vincularse
  const [showCombined, setShowCombined] = useState({}); // { [accountId]: boolean }

  const totalLiquid = accounts.filter(a => a.type !== "credit").reduce((s, a) => s + (a.balance || 0), 0);

  const saveAccount = (data) => {
    if (editAccount) {
      onUpdate(editAccount.id, data);
      setEditAccount(null);
    } else {
      onAdd(data);
    }
    setShowForm(false);
  };

  return (
    <>
      {accounts.length > 0 && (
        <div style={{ background: "#0f1523", borderRadius: 14, padding: "14px 18px", border: "1px solid #1e2a3a", marginBottom: 14 }}>
          <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em" }}>LÍQUIDO TOTAL</p>
          <p style={{ fontSize: 26, fontFamily: "'DM Mono', monospace", color: "#38bdf8", margin: "4px 0 0" }}>{fmt(totalLiquid)}</p>
        </div>
      )}

      {accounts.map(a => {
        const type = ACCOUNT_TYPES.find(t => t.id === a.type) || ACCOUNT_TYPES[4];
        const isEditing = editAccount?.id === a.id;
        const isCredit  = a.type === "credit";
        const used      = isCredit ? Math.abs(Math.min(0, a.balance || 0)) : 0;
        const otherAccounts = accounts.filter(acc => acc.id !== a.id && acc.type !== "credit");
        const linkedDebt = isCredit && a.linkedDebtId ? debts.find(d => d.id === a.linkedDebtId) : null;
        const linkedRemaining = linkedDebt ? Math.max(0, (linkedDebt.totalAmount || 0) - (linkedDebt.paidAmount || 0)) : 0;
        const combined = used + linkedRemaining;
        return (
          <div key={a.id} style={{ background: "#0f1523", borderRadius: 14, border: "1px solid #1e2a3a", marginBottom: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "13px 16px", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1e2a3a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={type.icon} size={17} style={{ color: a.color || type.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, color: "#f1f5f9", fontWeight: 500, margin: 0 }}>{a.name}</p>
                <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", margin: "2px 0 0" }}>
                  {type.label}{isCredit && a.limit ? ` · límite ${fmt(a.limit)}` : ""}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: isCredit ? (used > 0 ? "#fb923c" : "#f1f5f9") : "#f1f5f9" }}>
                  {isCredit ? fmt(used) : fmt(a.balance || 0)}
                </p>
                {isCredit && a.limit > 0 && (
                  <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>de {fmt(a.limit)}</p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 4 }}>
                <button onClick={() => setEditAccount(isEditing ? null : { ...a })} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                  <Icon name="pencil" size={14} />
                </button>
                <button onClick={() => onDelete(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>

            {isCredit && (
              <div style={{ padding: "0 16px 14px" }}>
                {/* Vínculo con una deuda existente */}
                {linkedDebt ? (
                  <div style={{ background: "#131b29", borderRadius: 9, padding: "8px 12px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#6b7f96" }}>
                      Vinculada a <span style={{ color: "#fb923c" }}>{linkedDebt.name}</span>
                    </span>
                    <button onClick={() => onUpdate(a.id, { linkedDebtId: null })} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setLinkingId(linkingId === a.id ? null : a.id)} style={{
                    width: "100%", padding: "8px 0", borderRadius: 9, border: "1px dashed #1e2a3a", cursor: "pointer",
                    background: "none", color: "#4b607a", fontSize: 11, marginBottom: 8,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}>
                    <Icon name="link" size={12} /> Vincular con una deuda
                  </button>
                )}

                {linkingId === a.id && (
                  <div style={{ marginBottom: 8 }}>
                    {debts.length === 0 && <p style={{ fontSize: 11, color: "#4b607a", padding: "4px 0" }}>No tenés deudas cargadas todavía</p>}
                    {debts.map(d => (
                      <button key={d.id} onClick={() => { onUpdate(a.id, { linkedDebtId: d.id }); setLinkingId(null); }} style={{
                        width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "1px solid #1e2a3a",
                        background: "#131b29", color: "#c4d0e0", fontSize: 12, marginBottom: 6, cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <span>{d.name}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", color: "#fb923c" }}>{fmt(Math.max(0, (d.totalAmount || 0) - (d.paidAmount || 0)))}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Toggle: ver usado + deuda vinculada juntos */}
                {linkedDebt && (
                  <>
                    <button onClick={() => setShowCombined(p => ({ ...p, [a.id]: !p[a.id] }))} style={{
                      width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 0 8px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 11, color: "#38bdf8", display: "flex", alignItems: "center", gap: 5 }}>
                        <Icon name={showCombined[a.id] ? "square-rounded-check" : "square-rounded"} size={14} />
                        Ver usado + deuda juntos
                      </span>
                    </button>
                    {showCombined[a.id] && (
                      <div style={{ background: "#0c4a6e22", border: "1px solid #0c4a6e", borderRadius: 9, padding: "10px 12px", marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#6b7f96" }}>Usado (desde la app)</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#fb923c" }}>{fmt(used)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: "#6b7f96" }}>{linkedDebt.name}</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#fb923c" }}>{fmt(linkedRemaining)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #1e2a3a", paddingTop: 6 }}>
                          <span style={{ fontSize: 11, color: "#c4d0e0", fontWeight: 600 }}>Total</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#f1f5f9", fontWeight: 600 }}>{fmt(combined)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {used > 0 && (
                  <button onClick={() => setPayCardId(payCardId === a.id ? null : a.id)} style={{
                    width: "100%", padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                    background: payCardId === a.id ? "#0c4a6e" : "#1e2a3a", color: "#38bdf8", fontSize: 12, fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}>
                    <Icon name="cash" size={13} /> Pagar tarjeta
                  </button>
                )}
              </div>
            )}
            {payCardId === a.id && (
              <PayPanel
                accounts={otherAccounts}
                defaultAmount={used}
                onConfirm={(amount, sourceId) => { onPayCard(a.id, amount, sourceId); setPayCardId(null); }}
                onCancel={() => setPayCardId(null)}
              />
            )}

            {isEditing && (
              <AccountEditPanel
                account={editAccount}
                onChange={setEditAccount}
                onSave={() => saveAccount(editAccount)}
                onCancel={() => setEditAccount(null)}
              />
            )}
          </div>
        );
      })}

      {showForm && (
        <AccountForm onSave={saveAccount} onCancel={() => setShowForm(false)} />
      )}

      {!showForm && (
        <button onClick={() => { setShowForm(true); setEditAccount(null); }} style={{
          width: "100%", padding: "13px", borderRadius: 12, border: "1px dashed #1e2a3a",
          background: "none", color: "#4b607a", cursor: "pointer", fontSize: 13, marginTop: 4,
        }}>
          + Agregar cuenta o billetera
        </button>
      )}
    </>
  );
}

function AccountForm({ onSave, onCancel }) {
  const [name, setName]           = useState("");
  const [type, setType]           = useState("digital");
  const [initialBalance, setInitialBalance] = useState("");
  const [limit, setLimit]         = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay]       = useState("");
  const valid = name.trim().length > 0;
  const isCredit = type === "credit";

  return (
    <FormCard title="Nueva cuenta">
      <InputRow label="Nombre" value={name} onChange={setName} placeholder="ej. Naranja X, Brubank" />
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>TIPO</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ACCOUNT_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
              background: type === t.id ? "#1e2a3a" : "#0b0f1a",
              color: type === t.id ? t.color : "#4b607a",
              outline: type === t.id ? `1px solid ${t.color}` : "1px solid #1e2a3a",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <Icon name={t.icon} size={13} /> {t.label}
            </button>
          ))}
        </div>
      </div>
      <InputRow label="Saldo inicial (opcional $)" value={initialBalance} onChange={setInitialBalance} placeholder="0" type="number" />
      {isCredit && (
        <>
          <InputRow label="Límite ($)"        value={limit}      onChange={setLimit}      placeholder="0" type="number" />
          <InputRow label="Día de cierre"      value={closingDay} onChange={setClosingDay} placeholder="ej. 20" type="number" />
          <InputRow label="Día de vencimiento" value={dueDay}     onChange={setDueDay}     placeholder="ej. 5" type="number" />
        </>
      )}
      <FormActions
        onSave={() => valid && onSave({
          name: name.trim(), type,
          color: ACCOUNT_TYPES.find(t => t.id === type)?.color || "#94a3b8",
          initialBalance: initialBalance ? +initialBalance : 0,
          ...(isCredit ? { limit: limit ? +limit : 0, closingDay: closingDay ? +closingDay : null, dueDay: dueDay ? +dueDay : null } : {}),
        })}
        onCancel={onCancel}
        saveLabel="Crear cuenta"
        disabled={!valid}
      />
    </FormCard>
  );
}

function AccountEditPanel({ account, onChange, onSave, onCancel }) {
  const set = (k, v) => onChange(p => ({ ...p, [k]: v }));
  const isCredit = account.type === "credit";

  return (
    <FormCard title="Editar cuenta" nested>
      <InputRow label="Nombre" value={account.name} onChange={v => set("name", v)} />
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>TIPO</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ACCOUNT_TYPES.map(t => (
            <button key={t.id} onClick={() => { set("type", t.id); set("color", t.color); }} style={{
              padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
              background: account.type === t.id ? "#1e2a3a" : "#0b0f1a",
              color: account.type === t.id ? t.color : "#4b607a",
              outline: account.type === t.id ? `1px solid ${t.color}` : "1px solid #1e2a3a",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <Icon name={t.icon} size={13} /> {t.label}
            </button>
          ))}
        </div>
      </div>
      <InputRow label="Saldo actual ($)" value={account.balance ?? 0} onChange={v => set("balance", +v)} type="number" />
      {isCredit && (
        <>
          <InputRow label="Límite ($)"        value={account.limit ?? ""}      onChange={v => set("limit", +v)}      type="number" />
          <InputRow label="Día de cierre"      value={account.closingDay ?? ""} onChange={v => set("closingDay", +v)} type="number" />
          <InputRow label="Día de vencimiento" value={account.dueDay ?? ""}     onChange={v => set("dueDay", +v)}     type="number" />
        </>
      )}
      <FormActions onSave={onSave} onCancel={onCancel} saveLabel="Guardar" />
    </FormCard>
  );
}
