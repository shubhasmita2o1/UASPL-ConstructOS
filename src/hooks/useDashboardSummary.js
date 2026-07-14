import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useWorkspace } from "@/contexts/WorkspaceContext";

/** Permission/workspace-scoped real counts for the dashboard (currently just activeProjects). */
export function useDashboardSummary() {
  const { societyId } = useWorkspace();
  return useQuery({
    queryKey: ["dashboard", "summary", societyId],
    queryFn: () => apiClient.get("/dashboard/summary"),
    enabled: !!societyId,
  });
}
