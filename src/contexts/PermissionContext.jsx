import { useAuth } from "@/contexts/AuthContext";

/**
 * Thin permission-checking API over AuthContext's existing permission state
 * (no separate Provider/state — permissions are loaded at login/refresh as
 * part of the session, so this just re-shapes that slice for consumers like
 * the sidebar builder, route guards, and dashboard widgets).
 */
export function usePermissions() {
  const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  const isSuperAdmin = permissions.includes("*");
  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin };
}
