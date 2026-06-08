import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/r79Global.css";
import App from "./App.jsx";

const STARTUP_FALLBACK =
  "R79 loaded but one module failed. Please report this issue.";

function renderStartupFallback(message = STARTUP_FALLBACK) {
  const root = document.getElementById("root");
  if (!root) {
    return;
  }

  root.innerHTML = `<div style="font-family:Inter,Segoe UI,Roboto,sans-serif;color:#f3f6ff;background:#080b12;min-height:100vh;padding:24px;"><p style="max-width:640px;line-height:1.5;color:#ffe6a8;">${message}</p></div>`;
}

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error("R79 startup render failed:", error);
  renderStartupFallback();
}
