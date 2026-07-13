import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function usePermissions() {
  return useQuery({ queryKey: ["permissions"], queryFn: () => apiClient.get("/permissions") });
}
