import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function useAuditLogs(params = {}) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => apiClient.get(`/audit-logs${toQueryString(params)}`),
    enabled: !!(params.targetId || params.targetType || params.action),
  });
}
