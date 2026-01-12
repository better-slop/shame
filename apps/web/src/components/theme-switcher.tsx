"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function subscribe(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => {
    mediaQuery.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Theme {
  return (localStorage.getItem("theme") as Theme) || "system";
}

function getServerSnapshot(): Theme {
  return "system";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new Event("storage"));
  };

  return { theme: mounted ? theme : "system", setTheme, mounted };
}

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSwitcher() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 text-xs">
        {THEMES.map(({ value, label }) => (
          <span key={value} className="px-2 py-1 text-muted-foreground">
            {label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      {THEMES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`px-2 py-1 transition-instant ${
            theme === value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
