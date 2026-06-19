import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import { bootTheme } from "./lib/theme";
import App from "./App";

bootTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
