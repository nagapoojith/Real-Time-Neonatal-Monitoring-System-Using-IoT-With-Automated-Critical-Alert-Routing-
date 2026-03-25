import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export interface ThemeTransitionOrigin {
  x: number;
  y: number;
}

const STORAGE_KEY = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
};

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
};

const getInitialTheme = (): Theme => {
  if (typeof document === "undefined") return "light";
  return (
    getStoredTheme() ??
    (document.documentElement.classList.contains("dark")
      ? "dark"
      : getSystemTheme())
  );
};

let currentTheme: Theme = getInitialTheme();
let storageListenerBound = false;

const emitThemeChange = () => listeners.forEach((l) => l());

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
};

const setTransitionOrigin = (origin?: ThemeTransitionOrigin) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  root.style.setProperty("--theme-transition-x", `${x}px`);
  root.style.setProperty("--theme-transition-y", `${y}px`);
  root.style.setProperty("--theme-transition-radius", `${radius}px`);
};

const commitTheme = (theme: Theme) => {
  currentTheme = theme;
  applyThemeToDocument(theme);
  emitThemeChange();
};

const transitionToTheme = (theme: Theme, origin?: ThemeTransitionOrigin) => {
  if (typeof document === "undefined" || currentTheme === theme) return;

  setTransitionOrigin(origin);

  if (!document.startViewTransition) {
    commitTheme(theme);
    return;
  }

  // ✅ No isTransitioning lock — let browser handle queuing natively
  const transition = document.startViewTransition(() => {
    // ✅ No flushSync — let React batch and commit normally
    commitTheme(theme);
  });

  // ✅ Skip animation if user prefers reduced motion
  transition.ready.then(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => currentTheme;

const bindStorageListener = () => {
  if (storageListenerBound || typeof window === "undefined") return;
  storageListenerBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    const next =
      event.newValue === "light" || event.newValue === "dark"
        ? event.newValue
        : getSystemTheme();
    commitTheme(next);
  });
};

export const useTheme = () => {
  bindStorageListener();

  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light");

  const setTheme = useCallback(
    (nextTheme: Theme, origin?: ThemeTransitionOrigin) => {
      transitionToTheme(nextTheme, origin);
    },
    [],
  );

  const toggleTheme = useCallback(
    (origin?: ThemeTransitionOrigin) => {
      transitionToTheme(theme === "dark" ? "light" : "dark", origin);
    },
    [theme],
  );

  return { theme, isDark: theme === "dark", setTheme, toggleTheme };
};
