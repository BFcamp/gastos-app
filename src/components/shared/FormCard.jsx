// components/shared/FormCard.jsx
//
// Componente "contenedor" genérico para formularios.
// Recibe `children` (los campos del form) y los envuelve en un card.
//
// Props:
//   title  — texto del encabezado (string)
//   nested — boolean, cambia el estilo para cuando está dentro de otro card

export function FormCard({ title, children, nested }) {
  return (
    <div style={{
      background: nested ? "#0b0f1a" : "#0f1523",
      borderRadius: nested ? 0 : 14,
      border: nested ? "none" : "1px solid #1e2a3a",
      borderTop: nested ? "1px solid #1e2a3a" : "none",
      padding: 16,
      marginBottom: nested ? 0 : 10,
    }}>
      <p style={{
        fontSize: 11, color: "#a3e635",
        fontFamily: "'DM Mono', monospace",
        letterSpacing: ".1em", marginBottom: 14,
      }}>
        {title.toUpperCase()}
      </p>
      {children}
    </div>
  );
}
