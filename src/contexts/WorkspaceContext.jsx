import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ORGANIZATIONS, SOCIETIES } from "@/data/mockData";

const WorkspaceContext = createContext(null);
const KEY = "uaspl.workspace.v1";

export function WorkspaceProvider({ children }) {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) ?? { orgId: null, societyId: null }; }
    catch { return { orgId: null, societyId: null }; }
  });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);

  const setOrg = useCallback((orgId) => setState({ orgId, societyId: null }), []);
  const setSociety = useCallback((societyId) => setState((s) => ({ ...s, societyId })), []);
  const reset = useCallback(() => setState({ orgId: null, societyId: null }), []);

  const value = useMemo(() => {
    const org = ORGANIZATIONS.find((o) => o.id === state.orgId) ?? null;
    const societies = org ? SOCIETIES[org.id] ?? [] : [];
    const society = societies.find((s) => s.id === state.societyId) ?? null;
    return { org, society, societies, orgId: state.orgId, societyId: state.societyId, setOrg, setSociety, reset };
  }, [state, setOrg, setSociety, reset]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
