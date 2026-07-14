import { useAuth } from "@/contexts/AuthContext";

/**
 * Hides (never disables) an action the current user isn't permitted to
 * perform. Reuses AuthContext's existing hasPermission/hasAnyPermission/
 * hasAllPermissions — no separate permission state.
 *
 *   <ActionGuard permission="project.create"><CreateButton /></ActionGuard>
 *   <ActionGuard anyOf={["project.edit", "project.delete"]}>...</ActionGuard>
 */
export default function ActionGuard({ permission, anyOf, allOf, fallback = null, children }) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let allowed = true;
  if (permission) allowed = hasPermission(permission);
  else if (anyOf) allowed = hasAnyPermission(anyOf);
  else if (allOf) allowed = hasAllPermissions(allOf);

  return allowed ? children : fallback;
}
