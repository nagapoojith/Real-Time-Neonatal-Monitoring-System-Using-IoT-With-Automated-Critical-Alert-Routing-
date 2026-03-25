import { useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    toggleTheme(
      rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : undefined,
    );
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      className={cn(
        // ✅ Removed box-shadow from transition list, shortened duration to 200ms
        "group relative h-8 w-16 cursor-pointer overflow-hidden rounded-full border-2",
        "transition-[background-color,border-color] duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
        isDark
          ? "border-indigo-500 bg-indigo-950"
          : "border-amber-300 bg-sky-400",
      )}
    >
      {/* Stars */}
      <svg
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-200 ease-out",
          isDark ? "opacity-100" : "opacity-0",
        )}
        viewBox="0 0 64 32"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="8" cy="7" r="1.2" fill="white" opacity="0.9" />
        <circle cx="14" cy="14" r="0.9" fill="white" opacity="0.7" />
        <circle cx="20" cy="5" r="1" fill="white" opacity="0.85" />
        <circle cx="26" cy="20" r="0.8" fill="white" opacity="0.6" />
        <circle cx="32" cy="9" r="1.1" fill="white" opacity="0.9" />
        <circle cx="18" cy="24" r="0.8" fill="white" opacity="0.5" />
        <circle cx="10" cy="22" r="1" fill="white" opacity="0.7" />
      </svg>

      {/* Large cloud */}
      <span
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 transition-[transform,opacity] duration-200 ease-out",
          isDark ? "translate-x-4 opacity-0" : "translate-x-0 opacity-100",
        )}
        aria-hidden="true"
      >
        <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
          <ellipse
            cx="14"
            cy="13"
            rx="10"
            ry="5"
            fill="white"
            fillOpacity="0.9"
          />
          <ellipse
            cx="10"
            cy="11"
            rx="6"
            ry="5"
            fill="white"
            fillOpacity="0.9"
          />
          <ellipse
            cx="16"
            cy="9"
            rx="7"
            ry="6"
            fill="white"
            fillOpacity="0.9"
          />
          <ellipse
            cx="20"
            cy="12"
            rx="5"
            ry="4"
            fill="white"
            fillOpacity="0.9"
          />
        </svg>
      </span>

      {/* Small cloud */}
      <span
        className={cn(
          "absolute bottom-0.5 right-8 transition-[transform,opacity] duration-200 ease-out",
          isDark ? "translate-x-2 opacity-0" : "translate-x-0 opacity-70",
        )}
        aria-hidden="true"
      >
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <ellipse cx="8" cy="7" rx="6" ry="3" fill="white" fillOpacity="0.8" />
          <ellipse
            cx="6"
            cy="5"
            rx="4"
            ry="3.5"
            fill="white"
            fillOpacity="0.8"
          />
          <ellipse
            cx="10"
            cy="5"
            rx="4"
            ry="3"
            fill="white"
            fillOpacity="0.8"
          />
        </svg>
      </span>

      {/* Thumb — ✅ removed will-change-transform */}
      <span
        className={cn(
          "pointer-events-none absolute left-0.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full shadow-lg",
          "transition-[transform,background-color] duration-200 ease-out",
          isDark ? "translate-x-8 bg-indigo-200" : "translate-x-0 bg-white",
        )}
      >
        <Sun
          className={cn(
            "absolute h-3.5 w-3.5 text-amber-500 transition-[transform,opacity] duration-200 ease-out",
            isDark
              ? "scale-0 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute h-3.5 w-3.5 text-indigo-600 transition-[transform,opacity] duration-200 ease-out",
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 -rotate-90 opacity-0",
          )}
        />
      </span>
    </button>
  );
};

export default ThemeToggle;
