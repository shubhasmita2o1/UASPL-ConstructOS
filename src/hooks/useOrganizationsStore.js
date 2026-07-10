import { useSyncExternalStore } from "react";
import { ORGANIZATIONS_FULL, SOCIETY_LIBRARY } from "@/data/organizations";

let state = ORGANIZATIONS_FULL.map((o) => ({ ...o }));
let societyLib = [...SOCIETY_LIBRARY];
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

const nextId = () => {
  const n = state.length + 1;
  return `org-new-${n}-${Date.now().toString(36).slice(-4)}`;
};

export const organizationsStore = {
  getAll: () => state,
  get: (id) => state.find((o) => o.id === id),
  getSocietyLibrary: () => societyLib,
  create: (org) => {
    const id = nextId();
    const next = {
      id,
      plan: "Business",
      status: "Onboarding",
      industry: "Redevelopment",
      projects: 0,
      societies: 0,
      members: 1,
      logoColor: "oklch(0.60 0.16 260)",
      assignedSocieties: [],
      createdAt: new Date().toISOString().slice(0, 10),
      ...org,
    };
    state = [next, ...state];
    emit();
    return next;
  },
  update: (id, patch) => {
    state = state.map((o) => (o.id === id ? { ...o, ...patch } : o));
    emit();
  },
  remove: (id) => {
    state = state.filter((o) => o.id !== id);
    emit();
  },
  setStatus: (id, status) => {
    state = state.map((o) => (o.id === id ? { ...o, status } : o));
    emit();
  },
  assignSociety: (id, societyId) => {
    state = state.map((o) => {
      if (o.id !== id) return o;
      if (o.assignedSocieties.includes(societyId)) return o;
      return { ...o, assignedSocieties: [...o.assignedSocieties, societyId], societies: o.assignedSocieties.length + 1 };
    });
    emit();
  },
  unassignSociety: (id, societyId) => {
    state = state.map((o) => {
      if (o.id !== id) return o;
      const list = o.assignedSocieties.filter((s) => s !== societyId);
      return { ...o, assignedSocieties: list, societies: list.length };
    });
    emit();
  },
  addSocietyToLibrary: (society) => {
    if (!societyLib.some((s) => s.id === society.id)) {
      societyLib = [society, ...societyLib];
      emit();
    }
  },
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
};

export function useOrganizations() {
  return useSyncExternalStore(organizationsStore.subscribe, organizationsStore.getAll, organizationsStore.getAll);
}
export function useOrganization(id) {
  const all = useOrganizations();
  return all.find((o) => o.id === id) ?? null;
}
export function useSocietyLibrary() {
  return useSyncExternalStore(organizationsStore.subscribe, organizationsStore.getSocietyLibrary, organizationsStore.getSocietyLibrary);
}
