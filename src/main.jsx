// main.jsx
//
// Punto de entrada de la app. Su único trabajo es montar el componente
// raíz (App) en el div #root del index.html.
//
// StrictMode hace que React ejecute cada componente dos veces en desarrollo
// para detectar efectos secundarios inesperados. En producción no tiene efecto.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
