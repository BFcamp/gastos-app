// constants/index.js
//
// Datos estáticos que no cambian en runtime.
// Centralizarlos acá evita copiar/pegar la misma lista en varios componentes.
// Si mañana agregás una categoría, lo hacés en un solo lugar.

export const EXPENSE_CATS = [
  { id: "food",      label: "Comida",     icon: "🍔" },
  { id: "transport", label: "Transporte", icon: "🚌" },
  { id: "health",    label: "Salud",      icon: "💊" },
  { id: "study",     label: "Estudio",    icon: "📚" },
  { id: "entertain", label: "Ocio",       icon: "🎮" },
  { id: "services",  label: "Servicios",  icon: "⚡" },
  { id: "debt",      label: "Deuda",      icon: "💳" },
  { id: "clothes",   label: "Ropa",       icon: "👕" },
  { id: "home",      label: "Hogar",      icon: "🏠" },
  { id: "other",     label: "Otro",       icon: "📦" },
];

export const INCOME_CATS = [
  { id: "biz",       label: "Emprendimiento", icon: "💼" },
  { id: "freelance", label: "Freelance",      icon: "💻" },
  { id: "gift",      label: "Regalo",         icon: "🎁" },
  { id: "other",     label: "Otro",           icon: "💰" },
];

export const SERVICE_CATS = [
  { id: "internet",  label: "Internet",    icon: "wifi" },
  { id: "phone",     label: "Celular",     icon: "device-mobile" },
  { id: "streaming", label: "Streaming",   icon: "device-tv" },
  { id: "rent",      label: "Alquiler",    icon: "home" },
  { id: "insurance", label: "Seguro",      icon: "shield" },
  { id: "bank",      label: "Banco",       icon: "building-bank" },
  { id: "sub",       label: "Suscripción", icon: "refresh" },
  { id: "other",     label: "Otro",        icon: "package" },
];

export const INSTALLMENT_OPTIONS = [1, 2, 3, 6, 9, 12, 18];

export const PRIORITY_CONFIG = {
  high:   { label: "Urgente",   color: "#f87171", dot: "#ef4444" },
  medium: { label: "Pronto",    color: "#fb923c", dot: "#f97316" },
  low:    { label: "Algún día", color: "#94a3b8", dot: "#64748b" },
};

export const CAT_COLORS = [
  "#38bdf8","#a78bfa","#fb923c","#34d399",
  "#f59e0b","#c084fc","#f472b6","#94a3b8","#4ade80","#60a5fa",
];

// Valores iniciales para cuando el usuario abre la app por primera vez.
// Solo se usan si no hay nada guardado en localStorage.

export const ACCOUNT_TYPES = [
  { id: "cash",    label: "Efectivo",          icon: "cash",          color: "#a3e635" },
  { id: "debit",   label: "Débito",            icon: "credit-card",  color: "#38bdf8" },
  { id: "digital", label: "Billetera digital", icon: "wallet",       color: "#22d3ee" },
  { id: "credit",  label: "Tarjeta de crédito", icon: "credit-card", color: "#f59e0b" },
  { id: "other",   label: "Otra",              icon: "building-bank", color: "#94a3b8" },
];

export const DEFAULT_ACCOUNTS = [
  { id: "cash",  name: "Efectivo",     type: "cash",    color: "#a3e635", balance: 0 },
  { id: "debit", name: "Débito",       type: "debit",   color: "#38bdf8", balance: 0 },
  { id: "mp",    name: "Mercado Pago", type: "digital", color: "#22d3ee", balance: 0 },
  { id: "cc1",   name: "Tarjeta Cred", type: "credit",  color: "#f59e0b", balance: 0, limit: 200000, closingDay: 20, dueDay: 5 },
];

export const DEFAULT_WISH_CATS = [
  { id: "tech",    label: "Tecnología",     icon: "💻", color: "#38bdf8" },
  { id: "clothes", label: "Ropa",           icon: "👕", color: "#a78bfa" },
  { id: "home",    label: "Hogar",          icon: "🏠", color: "#fb923c" },
  { id: "health",  label: "Salud",          icon: "💊", color: "#34d399" },
  { id: "biz",     label: "Emprendimiento", icon: "💼", color: "#f59e0b" },
  { id: "edu",     label: "Educación",      icon: "📚", color: "#c084fc" },
  { id: "other",   label: "Otros",          icon: "📦", color: "#94a3b8" },
];
