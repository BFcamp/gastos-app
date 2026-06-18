// components/FinanzasView.jsx

import { useState } from "react";
import { SERVICE_CATS } from "../constants";
import { fmt, uid } from "../utils/format";
import { FormCard } from "./shared/FormCard";
import { InputRow } from "./shared/InputRow";
import { FormActions } from "./shared/FormActions";

const Icon = ({ name, size = 16, style = {} }) => (
  <i className={`ti ti-${name}`} style={{ fontSize: size, ...style }} aria-hidden="true" />
);

const JAR_TYPES = [
  { id: "fisico",   label: "Físico",       icon: "building-bank",  color: "#a3e635", bg: "#14532d" },
  { id: "mp",       label: "Mercado Pago", icon: "wallet",         color: "#38bdf8", bg: "#0c4a6e" },
  { id: "naranja",  label: "Naranja X",    icon: "credit-card",    color: "#fb923c", bg: "#431407" },
  { id: "brubank",  label: "Brubank",      icon: "device-mobile",  color: "#a78bfa", bg: "#2e1065" },
  { id: "uala",     label: "Ualá",         icon: "cash",           color: "#c084fc", bg: "#3b0764" },
  { id: "otra_app", label: "Otra app",     icon: "apps",           color: "#94a3b8", bg: "#1e293b" },
];

export function FinanzasView({ debts, setDebts, services, setServices, jars, setJars }) {
  const [section, setSection]               = useState("debts");
  const [showDebtForm, setShowDebtForm]     = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editDebt, setEditDebt]             = useState(null);
  const [editService, setEditService]       = useState(null);

  const now             = new Date();
  const monthKey        = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel      = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const totalDebt       = debts.reduce((s, d) => s + Math.max(0, d.totalAmount - d.paidAmount), 0);
  const monthlyDebts    = debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0);
  const activeServices  = services.filter(s => s.active !== false);
  const monthlyServices = activeServices.reduce((s, sv) => s + (sv.amount || 0), 0);
  const totalMonthly    = monthlyDebts + monthlyServices;

  const servicesPaidThisMonth    = activeServices.filter(sv => sv.payments?.includes(monthKey));
  const servicesPendingThisMonth = activeServices.filter(sv => !sv.payments?.includes(monthKey));

  const toggleServicePaid = (id) => {
    setServices(prev => prev.map(sv => {
      if (sv.id !== id) return sv;
      const payments = sv.payments || [];
      const paid = payments.includes(monthKey);
      return { ...sv, payments: paid ? payments.filter(p => p !== monthKey) : [...payments, monthKey] };
    }));
  };

  const deleteDebt    = (id) => setDebts(prev => prev.filter(d => d.id !== id));
  const deleteService = (id) => setServices(prev => prev.filter(s => s.id !== id));

  const SECTION_TABS = [
    { id: "debts",    label: "Deudas",    icon: "credit-card" },
    { id: "services", label: "Servicios", icon: "refresh" },
    { id: "jars",     label: "Frascos",   icon: "bucket" },
  ];

  return (
    <div style={{ padding: "24px 20px 0" }}>
      <p style={{ fontSize: 11, letterSpacing: ".15em", color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>FINANZAS</p>
      <p style={{ fontSize: 12, color: "#6b7f96", marginBottom: 16, textTransform: "capitalize" }}>{monthLabel}</p>

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
            return (
              <div key={d.id} style={{ background: "#0f1523", borderRadius: 14, border: "1px solid #1e2a3a", marginBottom: 10, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, color: "#f1f5f9", fontWeight: 500, margin: 0 }}>{d.name}</p>
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
                </div>
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
                      <p style={{ fontSize: 11, color: "#4b607a", fontFamily: "'DM Mono', monospace", margin: "2px 0 0" }}>
                        {fmt(sv.amount)}/mes{sv.dueDay ? ` · vence día ${sv.dueDay}` : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => setEditService(isEditing ? null : { ...sv })} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                        <Icon name="pencil" size={14} />
                      </button>
                      <button onClick={() => deleteService(sv.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", padding: 0 }}>
                        <Icon name="trash" size={14} />
                      </button>
                      <button onClick={() => toggleServicePaid(sv.id)} style={{
                        padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11,
                        background: isPaid ? "#14532d" : "#1e2a3a",
                        color: isPaid ? "#a3e635" : "#4b607a",
                        fontFamily: "'DM Mono', monospace", transition: "all .2s",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        {isPaid && <Icon name="check" size={11} />}
                        {isPaid ? "pago" : "pendiente"}
                      </button>
                    </div>
                  </div>
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
    </div>
  );
}

// ── Debt forms ─────────────────────────────────────────────────────────────
function DebtForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: "", totalAmount: "", paidAmount: "", monthlyPayment: "", notes: "" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name && f.totalAmount;
  return (
    <FormCard title="Nueva deuda">
      <InputRow label="Nombre"             value={f.name}           onChange={v => set("name", v)}          placeholder="ej. Préstamo banco" />
      <InputRow label="Total adeudado ($)" value={f.totalAmount}    onChange={v => set("totalAmount", v)}   placeholder="0" type="number" />
      <InputRow label="Ya pagado ($)"      value={f.paidAmount}     onChange={v => set("paidAmount", v)}    placeholder="0" type="number" />
      <InputRow label="Cuota mensual ($)"  value={f.monthlyPayment} onChange={v => set("monthlyPayment", v)} placeholder="0" type="number" />
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
      <InputRow label="Notas"              value={debt.notes}         onChange={v => set("notes", v)} />
      <FormActions onSave={onSave} onCancel={onCancel} saveLabel="Guardar" />
    </FormCard>
  );
}

// ── Service forms ──────────────────────────────────────────────────────────
function ServiceForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: "", amount: "", dueDay: "", category: "other", active: true });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const valid = f.name && f.amount;
  return (
    <FormCard title="Nuevo servicio">
      <InputRow label="Nombre"            value={f.name}   onChange={v => set("name", v)}   placeholder="ej. Spotify" />
      <InputRow label="Monto mensual ($)" value={f.amount} onChange={v => set("amount", v)} placeholder="0" type="number" />
      <InputRow label="Día de vencimiento" value={f.dueDay} onChange={v => set("dueDay", v)} placeholder="ej. 10" type="number" />
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
        onSave={() => valid && onSave({ ...f, amount: +f.amount, dueDay: f.dueDay ? +f.dueDay : null })}
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
      <InputRow label="Día de vencimiento" value={service.dueDay || ""} onChange={v => set("dueDay", +v)} type="number" />
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
