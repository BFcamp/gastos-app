// utils/storage.js
//
// Abstrae cómo se guardan los datos. Hoy usa localStorage.
// Cuando migremos a Supabase, solo cambia ESTE archivo —
// el resto de la app no sabe ni le importa dónde se guardan los datos.
//
// Las funciones son async aunque localStorage sea sincrónico,
// para que la interfaz sea idéntica a la futura versión con Supabase.

export const S = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage puede fallar si está lleno (raro) o en modo privado
    }
  },
};
