import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthBoundary } from "./AuthBoundary";
import "./styles.css";

const root = document.getElementById("root");

if (root instanceof HTMLElement) {
  createRoot(root).render(
    <StrictMode>
      <AuthBoundary />
    </StrictMode>,
  );
}
