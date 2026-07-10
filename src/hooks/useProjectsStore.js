import { useSyncExternalStore } from "react";
import { PROJECTS } from "@/data/projects";

let state = [...PROJECTS];
const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }

export const projectsStore = {
  getAll: () => state,
  get: (id) => state.find((p) => p.id === id),
  create: (project) => {
    const id = `P-${String(state.length + 1).padStart(3, "0")}`;
    const next = {
      id,
      progress: 0,
      spend: 0,
      risks: 0,
      milestonesCompleted: 0,
      milestonesTotal: 20,
      team: [],
      tags: [],
      health: "on-track",
      ...project,
    };
    state = [next, ...state];
    emit();
    return next;
  },
  update: (id, patch) => {
    state = state.map((p) => (p.id === id ? { ...p, ...patch } : p));
    emit();
  },
  remove: (id) => {
    state = state.filter((p) => p.id !== id);
    emit();
  },
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
};

export function useProjects() {
  return useSyncExternalStore(projectsStore.subscribe, projectsStore.getAll, projectsStore.getAll);
}

export function useProject(id) {
  const all = useProjects();
  return all.find((p) => p.id === id) ?? null;
}
