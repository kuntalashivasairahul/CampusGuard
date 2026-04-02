import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

// In production (Render), VITE_API_URL points to the backend service.
// In development, Vite's proxy handles /api/* so no base URL is needed.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

// Use localStorage token for cross-origin auth (required on Render since
// httpOnly cookies don't work across different domains).
// Falls back to cookie-based auth automatically when no token is stored (local dev).
setAuthTokenGetter(() => localStorage.getItem("jwt_token"));

createRoot(document.getElementById("root")!).render(<App />);
