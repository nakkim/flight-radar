import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

document.documentElement.style.background = "#020f02";
document.body.style.margin = "0";
document.body.style.background = "#020f02";
document.body.style.color = "#00ee44";
document.body.style.fontFamily = "monospace";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
