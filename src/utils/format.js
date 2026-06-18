// utils/format.js
//
// Funciones puras de transformación de datos.
// "Pura" = mismo input siempre da mismo output, sin efectos secundarios.
// Fáciles de testear, fáciles de reusar en cualquier componente.

// Formatea un número como pesos argentinos: 15000 → "$15.000"
export const fmt = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n || 0);

// Genera un ID único basado en timestamp + random.
// No es UUID estricto pero es suficiente para datos locales.
export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);
