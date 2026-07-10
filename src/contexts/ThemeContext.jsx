import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "uaspl.theme.v1";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || "light");

  useLayoutEffect(() => {
    const root = document.documentElement;

    // Temporarily kill all transitions so the theme swap is instant,
    // instead of animating through transition-colors on nav links etc.
    root.classList.add("theme-switching");

    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(KEY, theme);

    // Re-enable transitions on the next frame.
    const id = requestAnimationFrame(() => {
      root.classList.remove("theme-switching");
    });

    return () => cancelAnimationFrame(id);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}