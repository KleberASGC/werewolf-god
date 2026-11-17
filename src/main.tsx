import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./app/styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("O elemento raiz da aplicação não foi encontrado.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
    console.error("Não foi possível habilitar o cache offline.", error);
  });
}
