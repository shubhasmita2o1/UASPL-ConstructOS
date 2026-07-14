import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiClient, ApiClientError } from "@/lib/apiClient";

const AuthContext = createContext(null);

// Refresh a little before the access token actually expires.
const REFRESH_SAFETY_MARGIN_MS = 60 * 1000;

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("idle"); // idle | loading | authenticated | unauthenticated
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [society, setSociety] = useState(null);
  const [project, setProjectState] = useState(null);

  const refreshTimerRef = useRef(null);

  const clearState = useCallback(() => {
    setUser(null);
    setPermissions([]);
    setOrganizations([]);
    setOrganization(null);
    setSociety(null);
    setProjectState(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  const scheduleSilentRefresh = useCallback((accessTokenExpiresAt) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (!accessTokenExpiresAt) return;
    const delay = new Date(accessTokenExpiresAt).getTime() - Date.now() - REFRESH_SAFETY_MARGIN_MS;
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const data = await apiClient.post("/auth/refresh");
        scheduleSilentRefresh(data?.accessTokenExpiresAt);
      } catch {
        clearState();
        setStatus("unauthenticated");
      }
    }, Math.max(delay, 5000));
  }, [clearState]);

  const applySession = useCallback((data) => {
    setUser(data.user);
    setPermissions(data.permissions || []);
    setOrganizations(data.organizations || []);
    setOrganization(data.organization || null);
    setSociety(data.society || null);
    setProjectState(data.project || null);
    scheduleSilentRefresh(data.accessTokenExpiresAt);
    setStatus("authenticated");
  }, [scheduleSilentRefresh]);

  const bootstrap = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await apiClient.get("/auth/me");
      applySession(data);
    } catch {
      clearState();
      setStatus("unauthenticated");
    }
  }, [applySession, clearState]);

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onForceLogout = () => {
      clearState();
      setStatus("unauthenticated");
    };
    window.addEventListener("auth:logout", onForceLogout);
    return () => window.removeEventListener("auth:logout", onForceLogout);
  }, [clearState]);

  const login = useCallback(async ({ identifier, email, password, remember }) => {
    const data = await apiClient.post("/auth/login", { identifier: identifier ?? email, password, remember: !!remember });
    applySession({ ...data, organization: null, society: null, project: null });
    return data;
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearState();
      setStatus("unauthenticated");
    }
  }, [clearState]);

  const refreshMe = useCallback(async () => {
    const data = await apiClient.get("/auth/me");
    applySession(data);
    return data;
  }, [applySession]);

  const forgotPassword = useCallback((email) => apiClient.post("/auth/forgot-password", { email }), []);

  const resetPassword = useCallback((token, newPassword) => apiClient.post("/auth/reset-password", { token, newPassword }), []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await apiClient.post("/auth/change-password", { currentPassword, newPassword });
    setUser((u) => (u ? { ...u, mustChangePassword: false } : u));
  }, []);

  const hasPermission = useCallback((key) => permissions.includes("*") || permissions.includes(key), [permissions]);
  const hasAnyPermission = useCallback((keys = []) => keys.some(hasPermission), [hasPermission]);
  const hasAllPermissions = useCallback((keys = []) => keys.every(hasPermission), [hasPermission]);

  const value = useMemo(() => ({
    status,
    loading: status === "idle" || status === "loading",
    isAuthenticated: status === "authenticated",
    user,
    permissions,
    organizations,
    organization,
    society,
    project,
    login,
    logout,
    refreshMe,
    forgotPassword,
    resetPassword,
    changePassword,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }), [
    status, user, permissions, organizations, organization, society, project,
    login, logout, refreshMe, forgotPassword, resetPassword, changePassword,
    hasPermission, hasAnyPermission, hasAllPermissions,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiClientError };
