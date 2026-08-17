import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Normalize Mongo _id → id for UI that already uses o.id */
export function normalizeOrg(o) {
  if (!o) return null;
  return {
    ...o,
    id: o.id || String(o._id),
    contact: o.contact || {},
  };
}

export function useOrganizations(params = {}) {
  return useQuery({
    queryKey: ["organizations", params],
    queryFn: async () => {
      const data = await apiClient.get(`/organizations${toQueryString(params)}`);
      return (data || []).map(normalizeOrg);
    },
    placeholderData: (previous) => previous,
  });
}

export function useOrganization(id) {
  return useQuery({
    queryKey: ["organizations", "detail", id],
    queryFn: async () => {
      const data = await apiClient.get(`/organizations/${id}`);
      return normalizeOrg(data);
    },
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("/organizations", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.patch(`/organizations/${id}`, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      if (vars?.id) qc.invalidateQueries({ queryKey: ["organizations", "detail", vars.id] });
    },
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/organizations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

export function useSetOrganizationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiClient.patch(`/organizations/${id}`, { status }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      if (vars?.id) qc.invalidateQueries({ queryKey: ["organizations", "detail", vars.id] });
    },
  });
}