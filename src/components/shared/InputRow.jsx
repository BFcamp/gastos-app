// components/shared/InputRow.jsx
//
// Un campo de formulario con su label arriba.
// Reutilizado en DebtForm, ServiceForm, WishItemForm, etc.
//
// Props:
//   label       — texto del label
//   value       — valor controlado (viene del state del padre)
//   onChange    — función que actualiza el state del padre
//   placeholder — texto de ayuda cuando está vacío
//   type        — "text" | "number" (default: "text")

export function InputRow({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <p style={{
        fontSize: 10, color: "#4b607a",
        fontFamily: "'DM Mono', monospace",
        marginBottom: 4, letterSpacing: ".08em",
      }}>
        {label.toUpperCase()}
      </p>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "#1e2a3a",
          border: "1px solid #283a50", borderRadius: 8,
          padding: "9px 12px", color: "#f1f5f9",
          fontSize: 13, outline: "none", boxSizing: "border-box",
        }}
      />
    </div>
  );
}
