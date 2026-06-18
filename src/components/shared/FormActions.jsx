// components/shared/FormActions.jsx
//
// Botones de Cancelar / Guardar que aparecen al pie de cada form.
// Centralizado para que todos los forms tengan el mismo comportamiento visual.
//
// Props:
//   onSave    — función a ejecutar al confirmar
//   onCancel  — función a ejecutar al cancelar
//   saveLabel — texto del botón principal (default: "Agregar")
//   disabled  — deshabilita el botón de guardar si el form está incompleto

export function FormActions({ onSave, onCancel, saveLabel = "Agregar", disabled }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <button
        onClick={onCancel}
        style={{
          flex: 1, padding: "10px", borderRadius: 10,
          border: "1px solid #1e2a3a", background: "none",
          color: "#6b7f96", cursor: "pointer", fontSize: 13,
        }}
      >
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={disabled}
        style={{
          flex: 2, padding: "10px", borderRadius: 10, border: "none",
          background: disabled ? "#1e2a3a" : "#a3e635",
          color: disabled ? "#4b607a" : "#0b0f1a",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 13, fontWeight: 600,
        }}
      >
        {saveLabel}
      </button>
    </div>
  );
}
