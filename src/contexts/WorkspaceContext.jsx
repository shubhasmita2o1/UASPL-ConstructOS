import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

const WorkspaceContext = createContext(null);

function normalize(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: doc.id ?? String(_id), ...rest };
}

export function WorkspaceProvider({ children }) {
  const auth = useAuth();
  const [societies, setSocieties] = useState([]);
  const [switching, setSwitching] = useState(false);
  const autoSelectedOrgRef = useRef(null);
  const autoSelectedSocietyRef = useRef(null);

  const organizations = useMemo(() => (auth.organizations || []).map(normalize), [auth.organizations]);
  const rawOrg = useMemo(() => normalize(auth.organization), [auth.organization]);
  const rawSociety = useMemo(() => normalize(auth.society), [auth.society]);

  const org = switching ? null : rawOrg;
  const society = switching ? null : rawSociety;

  const loadSocieties = useCallback(async (organizationId) => {
    if (!organizationId) {
      setSocieties([]);
      return [];
    }
    const data = await apiClient.get(`/auth/societies?organizationId=${organizationId}`);
    const list = (data || []).map(normalize);
    setSocieties(list);
    return list;
  }, []);

  useEffect(() => {
    if (rawOrg?.id) loadSocieties(rawOrg.id);
    else setSocieties([]);
  }, [rawOrg?.id, loadSocieties]);

  const setOrg = useCallback(async (organizationId) => {
    await apiClient.post("/auth/select-organization", { organizationId });
    await auth.refreshMe();
    setSwitching(false);
  }, [auth]);

  const setSociety = useCallback(async (societyId) => {
    await apiClient.post("/auth/select-society", { societyId });
    await auth.refreshMe();
    setSwitching(false);
  }, [auth]);

  const reset = useCallback(() => {
    setSwitching(true);
  }, []);

  // Auto-select when exactly one organization / society is available.
  useEffect(() => {
    if (!auth.isAuthenticated || switching) return;
    if (!rawOrg && organizations.length === 1 && autoSelectedOrgRef.current !== organizations[0].id) {
      autoSelectedOrgRef.current = organizations[0].id;
      setOrg(organizations[0].id);
    }
  }, [auth.isAuthenticated, switching, rawOrg, organizations, setOrg]);

  useEffect(() => {
    if (!auth.isAuthenticated || switching || !rawOrg) return;
    if (!rawSociety && societies.length === 1 && autoSelectedSocietyRef.current !== societies[0].id) {
      autoSelectedSocietyRef.current = societies[0].id;
      setSociety(societies[0].id);
    }
  }, [auth.isAuthenticated, switching, rawOrg, rawSociety, societies, setSociety]);

  const value = useMemo(() => ({
    org, society, societies, organizations,
    orgId: org?.id ?? null, societyId: society?.id ?? null,
    setOrg, setSociety, reset,
  }), [org, society, societies, organizations, setOrg, setSociety, reset]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
