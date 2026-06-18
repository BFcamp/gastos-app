// components/ComprasView.jsx
//
// Lista de compras futuras, organizada por categorías personalizables
// y prioridad (Urgente / Pronto / Algún día).
//
// Props:
//   wishlist    — array de items a comprar (state de App)
//   setWishlist — setter para modificar la lista
//   wishCats    — array de categorías personalizadas (state de App)
//   setWishCats — setter para modificar categorías
//
// Sub-componentes en este archivo (exclusivos de esta vista):
//   WishItemForm — formulario para crear/editar un item
//   CatManager   — panel para agregar/borrar categorías

import { useState } from "react";
import { PRIORITY_CONFIG, CAT_COLORS } from "../constants";
import { fmt, uid } from "../utils/format";

export function ComprasView({ wishlist, setWishlist, wishCats, setWishCats }) {
  const [activeCat, setActiveCat]       = useState("all");
  const [showForm, setShowForm]         = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [showCatManager, setShowCatManager] = useState(false);
  const [filterDone, setFilterDone]     = useState(false);

  // summary
  const pending   = wishlist.filter(i => !i.done);
  const done      = wishlist.filter(i => i.done);
  const totalEst  = pending.reduce((s, i) => s + (i.estimatedAmount || 0), 0);

  const visibleItems = wishlist.filter(i => {
    const catOk  = activeCat === "all" || i.catId === activeCat;
    const doneOk = filterDone ? i.done : !i.done;
    return catOk && doneOk;
  });

  // sort: urgente → pronto → algún día, then by date added
  const sorted = [...visibleItems].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
  });

  const toggleDone = (id) =>
    setWishlist(prev => prev.map(i => i.id === id ? { ...i, done: !i.done, doneAt: !i.done ? new Date().toISOString() : null } : i));

  const deleteItem = (id) => setWishlist(prev => prev.filter(i => i.id !== id));

  const saveItem = (item) => {
    if (editItem) {
      setWishlist(prev => prev.map(i => i.id === editItem.id ? { ...editItem, ...item } : i));
      setEditItem(null);
    } else {
      setWishlist(prev => [...prev, { ...item, id: uid(), done: false, createdAt: new Date().toISOString() }]);
    }
    setShowForm(false);
  };

  return (
    <div style={{ padding: "24px 20px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: ".15em", color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>COMPRAS FUTURAS</p>
        </div>
        <button onClick={() => setShowCatManager(v => !v)} style={{
          background: showCatManager ? "#1e2a3a" : "none", border: "1px solid #1e2a3a",
          borderRadius: 8, padding: "5px 10px", color: "#6b7f96", cursor: "pointer", fontSize: 11,
          fontFamily: "'DM Mono', monospace",
        }}>⊕ categorías</button>
      </div>

      {/* Category manager */}
      {showCatManager && (
        <CatManager wishCats={wishCats} setWishCats={setWishCats} onClose={() => setShowCatManager(false)} />
      )}

      {/* Summary pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, marginTop: 12 }}>
        <div style={{ background: "#0f1523", borderRadius: 10, padding: "8px 14px", border: "1px solid #1e2a3a" }}>
          <p style={{ fontSize: 9, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>PENDIENTES</p>
          <p style={{ fontSize: 18, fontFamily: "'DM Mono', monospace", color: "#f1f5f9" }}>{pending.length}</p>
        </div>
        {totalEst > 0 && (
          <div style={{ background: "#0f1523", borderRadius: 10, padding: "8px 14px", border: "1px solid #1e2a3a", flex: 1 }}>
            <p style={{ fontSize: 9, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>ESTIMADO TOTAL</p>
            <p style={{ fontSize: 18, fontFamily: "'DM Mono', monospace", color: "#fb923c" }}>{fmt(totalEst)}</p>
          </div>
        )}
        <div style={{ background: "#0f1523", borderRadius: 10, padding: "8px 14px", border: "1px solid #1e2a3a" }}>
          <p style={{ fontSize: 9, color: "#4b607a", fontFamily: "'DM Mono', monospace" }}>COMPRADOS</p>
          <p style={{ fontSize: 18, fontFamily: "'DM Mono', monospace", color: "#a3e635" }}>{done.length}</p>
        </div>
      </div>

      {/* Category filter strip */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" }}>
        {[{ id: "all", label: "Todo", icon: "◈", color: "#a3e635" }, ...wishCats].map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
            padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer",
            background: activeCat === c.id ? c.color : "#0f1523",
            color: activeCat === c.id ? "#0b0f1a" : "#6b7f96",
            fontSize: 11, fontWeight: activeCat === c.id ? 600 : 400,
            outline: activeCat === c.id ? "none" : "1px solid #1e2a3a",
            whiteSpace: "nowrap", flexShrink: 0, transition: "all .15s",
          }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Done toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => setFilterDone(false)} style={{
          padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11,
          background: !filterDone ? "#1e2a3a" : "none", color: !filterDone ? "#f1f5f9" : "#4b607a",
          outline: !filterDone ? "1px solid #a3e635" : "1px solid #1e2a3a", fontFamily: "'DM Mono', monospace",
        }}>pendientes</button>
        <button onClick={() => setFilterDone(true)} style={{
          padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11,
          background: filterDone ? "#1e2a3a" : "none", color: filterDone ? "#f1f5f9" : "#4b607a",
          outline: filterDone ? "1px solid #a3e635" : "1px solid #1e2a3a", fontFamily: "'DM Mono', monospace",
        }}>comprados</button>
      </div>

      {/* Item list */}
      {sorted.length === 0 && !showForm && (
        <p style={{ textAlign: "center", color: "#4b607a", fontSize: 13, padding: "30px 0" }}>
          {filterDone ? "Nada comprado aún" : "Lista vacía — ¡agregá algo!"}
        </p>
      )}

      {sorted.map(item => {
        const cat  = wishCats.find(c => c.id === item.catId);
        const pri  = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.low;
        const isEditing = editItem?.id === item.id;
        return (
          <div key={item.id} style={{
            background: "#0f1523", borderRadius: 14, border: `1px solid ${item.done ? "#1a2130" : "#1e2a3a"}`,
            marginBottom: 8, overflow: "hidden", opacity: item.done ? 0.55 : 1, transition: "opacity .2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", padding: "13px 14px", gap: 12 }}>

              {/* Check circle */}
              <button onClick={() => toggleDone(item.id)} style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: item.done ? "#14532d" : "none",
                border: `2px solid ${item.done ? "#a3e635" : "#334155"}`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#a3e635", fontSize: 13, transition: "all .2s",
              }}>{item.done ? "✓" : ""}</button>

              {/* Cat icon bubble */}
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: cat ? cat.color + "22" : "#1e2a3a",
                border: `1px solid ${cat?.color || "#1e2a3a"}40`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
              }}>{cat?.icon || "📦"}</div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 14, color: item.done ? "#6b7f96" : "#f1f5f9", margin: 0,
                  textDecoration: item.done ? "line-through" : "none",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{item.name}</p>
                <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Priority badge */}
                  <span style={{
                    fontSize: 9, fontFamily: "'DM Mono', monospace", padding: "1px 6px",
                    borderRadius: 4, background: pri.dot + "22", color: pri.color,
                  }}>{pri.label}</span>
                  {/* Category label */}
                  {cat && <span style={{ fontSize: 9, color: cat.color, fontFamily: "'DM Mono', monospace" }}>{cat.label}</span>}
                  {/* Estimated amount */}
                  {item.estimatedAmount > 0 && (
                    <span style={{ fontSize: 10, color: "#fb923c", fontFamily: "'DM Mono', monospace" }}>~{fmt(item.estimatedAmount)}</span>
                  )}
                </div>
                {item.notes && <p style={{ fontSize: 11, color: "#4b607a", margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.notes}</p>}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => { setEditItem(item); setShowForm(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", fontSize: 14, padding: 0 }}>✏️</button>
                <button onClick={() => deleteItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b607a", fontSize: 14, padding: 0 }}>🗑</button>
              </div>
            </div>

            {/* Edit panel inline */}
            {isEditing && (
              <WishItemForm
                initial={editItem}
                wishCats={wishCats}
                onSave={saveItem}
                onCancel={() => { setEditItem(null); setShowForm(false); }}
                nested
              />
            )}
          </div>
        );
      })}

      {/* Add form (new item) */}
      {showForm && !editItem && (
        <WishItemForm
          wishCats={wishCats}
          onSave={saveItem}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* FAB add button */}
      {!showForm && (
        <button onClick={() => { setEditItem(null); setShowForm(true); }} style={{
          width: "100%", padding: "14px", borderRadius: 14, border: "1px dashed #1e2a3a",
          background: "none", color: "#4b607a", cursor: "pointer", fontSize: 13, marginTop: 4,
        }}>+ Agregar item</button>
      )}
    </div>
  );
}

// ── Wish item form ─────────────────────────────────────────────────────────
function WishItemForm({ initial, wishCats, onSave, onCancel, nested }) {
  const [name,   setName]   = useState(initial?.name || "");
  const [catId,  setCatId]  = useState(initial?.catId || wishCats[0]?.id || "");
  const [amount, setAmount] = useState(initial?.estimatedAmount || "");
  const [pri,    setPri]    = useState(initial?.priority || "low");
  const [notes,  setNotes]  = useState(initial?.notes || "");

  const valid = name.trim().length > 0;

  const base = {
    background: nested ? "#0b0f1a" : "#0f1523",
    borderRadius: nested ? 0 : 14,
    border: nested ? "none" : "1px solid #1e2a3a",
    borderTop: nested ? "1px solid #1e2a3a" : "none",
    padding: 16,
    marginBottom: nested ? 0 : 10,
  };

  return (
    <div style={base}>
      <p style={{ fontSize: 11, color: "#a3e635", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", marginBottom: 14 }}>
        {initial ? "EDITAR ITEM" : "NUEVO ITEM"}
      </p>

      {/* Name */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>QUÉ QUERÉS COMPRAR</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ej. Notebook, zapatillas, dominio..."
          style={{ width: "100%", background: "#1e2a3a", border: "1px solid #283a50", borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Category */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>CATEGORÍA</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {wishCats.map(c => (
            <button key={c.id} onClick={() => setCatId(c.id)} style={{
              padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
              background: catId === c.id ? c.color + "33" : "#0b0f1a",
              color: catId === c.id ? c.color : "#4b607a",
              outline: catId === c.id ? `1px solid ${c.color}` : "1px solid #1e2a3a",
            }}>{c.icon} {c.label}</button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>PRIORIDAD</p>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => setPri(k)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11,
              background: pri === k ? v.dot + "33" : "#0b0f1a",
              color: pri === k ? v.color : "#4b607a",
              outline: pri === k ? `1px solid ${v.dot}` : "1px solid #1e2a3a",
              fontFamily: "'DM Mono', monospace",
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>PRECIO ESTIMADO (opcional)</p>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
          style={{ width: "100%", background: "#1e2a3a", border: "1px solid #283a50", borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>NOTAS (opcional)</p>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ej. esperar oferta, modelo específico..."
          style={{ width: "100%", background: "#1e2a3a", border: "1px solid #283a50", borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #1e2a3a", background: "none", color: "#6b7f96", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
        <button onClick={() => valid && onSave({ name: name.trim(), catId, priority: pri, estimatedAmount: amount ? +amount : 0, notes })}
          disabled={!valid}
          style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: valid ? "#a3e635" : "#1e2a3a", color: valid ? "#0b0f1a" : "#4b607a", cursor: valid ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}>
          {initial ? "Guardar" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

// ── Category manager ──────────────────────────────────────────────────────
function CatManager({ wishCats, setWishCats, onClose }) {
  const [newLabel, setNewLabel] = useState("");
  const [newIcon,  setNewIcon]  = useState("📦");
  const ICON_OPTIONS = ["📦","💻","👕","🏠","💊","📚","💼","🎮","🎧","📷","🚗","✈️","🍽️","🎁","🔧","🧴","🐾","🌱"];

  const addCat = () => {
    if (!newLabel.trim()) return;
    const color = CAT_COLORS[wishCats.length % CAT_COLORS.length];
    setWishCats(prev => [...prev, { id: uid(), label: newLabel.trim(), icon: newIcon, color }]);
    setNewLabel(""); setNewIcon("📦");
  };

  const deleteCat = (id) => setWishCats(prev => prev.filter(c => c.id !== id));

  return (
    <div style={{ background: "#0f1523", borderRadius: 14, border: "1px solid #1e2a3a", padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "#a3e635", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em" }}>GESTIONAR CATEGORÍAS</p>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#4b607a", cursor: "pointer", fontSize: 16 }}>×</button>
      </div>

      {/* Existing cats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {wishCats.map(c => (
          <div key={c.id} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "4px 8px 4px 10px",
            borderRadius: 20, background: c.color + "22", border: `1px solid ${c.color}44`,
          }}>
            <span style={{ fontSize: 13 }}>{c.icon}</span>
            <span style={{ fontSize: 11, color: c.color, fontFamily: "'DM Mono', monospace" }}>{c.label}</span>
            <button onClick={() => deleteCat(c.id)} style={{ background: "none", border: "none", color: c.color, cursor: "pointer", fontSize: 13, padding: "0 0 0 2px", lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <p style={{ fontSize: 10, color: "#4b607a", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>NUEVA CATEGORÍA</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {ICON_OPTIONS.map(ic => (
          <button key={ic} onClick={() => setNewIcon(ic)} style={{
            width: 32, height: 32, borderRadius: 6, border: "none", cursor: "pointer", fontSize: 16,
            background: newIcon === ic ? "#1e2a3a" : "#0b0f1a",
            outline: newIcon === ic ? "1px solid #a3e635" : "1px solid #1a2130",
          }}>{ic}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Nombre de categoría"
          style={{ flex: 1, background: "#1e2a3a", border: "1px solid #283a50", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontSize: 13, outline: "none" }} />
        <button onClick={addCat} style={{
          padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
          background: newLabel.trim() ? "#a3e635" : "#1e2a3a", color: newLabel.trim() ? "#0b0f1a" : "#4b607a", fontSize: 13, fontWeight: 600,
        }}>+</button>
      </div>
    </div>
  );
}
