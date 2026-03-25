import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  const storedTheme = window.localStorage.getItem("theme");
  const initialTheme =
    storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

  document.documentElement.classList.toggle("dark", initialTheme === "dark");
  document.documentElement.style.colorScheme = initialTheme;
} catch {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
}

createRoot(document.getElementById("root")!).render(<App />);
