import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEMO_USERS } from "@/data/mockData";

const AuthContext = createContext(null);
const STORAGE_KEY = "uaspl.auth.v1";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = useCallback(async ({ email, remember }) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const found = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? DEMO_USERS[1];
    const session = { ...found, remember: !!remember, loggedInAt: Date.now() };
    setUser(session);
    setLoading(false);
    return session;
  }, []);

  const loginAs = useCallback(async (demoUser) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setUser({ ...demoUser, loggedInAt: Date.now() });
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("uaspl.workspace.v1");
  }, []);

  const value = useMemo(() => ({ user, loading, login, loginAs, logout, isAuthenticated: !!user }), [user, loading, login, loginAs, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
