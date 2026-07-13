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

export function useRoles(params = {}) {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => apiClient.get(`/roles${toQueryString(params)}`),
    placeholderData: (previous) => previous,
  });
}

export function useRole(id) {
  return useQuery({
    queryKey: ["roles", "detail", id],
    queryFn: () => apiClient.get(`/roles/${id}`),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => apiClient.post("/roles", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiClient.patch(`/roles/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }) =>
      apiClient.patch(`/roles/${id}/permissions`, { permissions }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRoleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => apiClient.patch(`/roles/${id}/status`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDuplicateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.post(`/roles/${id}/duplicate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useRoleAssignedUsers(id) {
  return useQuery({
    queryKey: ["roles", "detail", id, "users"],
    queryFn: () => apiClient.get(`/roles/${id}/users`),
    enabled: !!id,
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.delete(`/roles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}
