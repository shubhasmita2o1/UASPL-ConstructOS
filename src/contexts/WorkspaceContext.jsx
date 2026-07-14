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
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const autoSelectedOrgRef = useRef(null);
  const autoSelectedSocietyRef = useRef(null);

  const organizations = useMemo(() => (auth.organizations || []).map(normalize), [auth.organizations]);
  const rawOrg = useMemo(() => normalize(auth.organization), [auth.organization]);
  const rawSociety = useMemo(() => normalize(auth.society), [auth.society]);
  const rawProject = useMemo(() => normalize(auth.project), [auth.project]);

  const org = switching ? null : rawOrg;
  const society = switching ? null : rawSociety;
  const project = switching ? null : rawProject;

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

  const loadProjects = useCallback(async (societyId) => {
    if (!societyId) {
      setProjects([]);
      return [];
    }
    setProjectsLoading(true);
    try {
      const data = await apiClient.get(`/auth/projects?societyId=${societyId}`);
      const list = (data || []).map(normalize);
      setProjects(list);
      return list;
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rawOrg?.id) loadSocieties(rawOrg.id);
    else setSocieties([]);
  }, [rawOrg?.id, loadSocieties]);

  useEffect(() => {
    if (rawSociety?.id) loadProjects(rawSociety.id);
    else setProjects([]);
  }, [rawSociety?.id, loadProjects]);

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

  /** Unlike setOrg/setSociety, this never navigates or blanks the workspace — just a state update. */
  const setProject = useCallback(async (projectId) => {
    await apiClient.post("/auth/select-project", { projectId });
    await auth.refreshMe();
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

  const workspaceActions = useMemo(() => ({
    setOrganization: setOrg, setSociety, setProject, reset,
  }), [setOrg, setSociety, setProject, reset]);

  const value = useMemo(() => ({
    org, society, societies, organizations,
    orgId: org?.id ?? null, societyId: society?.id ?? null,
    setOrg, setSociety, reset,

    // Phase 4 addition: project depth (Header, DashboardPage read this — it's
    // the only way to consume the selected project). currentOrganization/
    // currentSociety were removed as unused dead code: nothing consumed them,
    // every real consumer already reads org/society above.
    currentProject: project,
    availableProjects: projects,
    workspaceLoading: switching || projectsLoading,
    workspaceActions,
  }), [org, society, societies, organizations, setOrg, setSociety, reset, project, projects, switching, projectsLoading, workspaceActions]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
