import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Registrace Service Worker pro PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrován úspěšně:', registration.scope);
      })
      .catch((registrationError) => {
        console.log('SW registrace selhala:', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);