import { useSyncExternalStore } from "react";
import { SOCIETIES_FULL } from "@/data/societies";
import { ORGANIZATIONS } from "@/data/mockData";

let state = SOCIETIES_FULL.map((s) => ({ ...s }));
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

const nextId = () => {
  const n = state.length + 1;
  return `soc-new-${n}-${Date.now().toString(36).slice(-4)}`;
};

const orgName = (id) => ORGANIZATIONS.find((o) => o.id === id)?.name ?? "—";
const orgCity = (id) => ORGANIZATIONS.find((o) => o.id === id)?.city ?? "";

export const societiesStore = {
  getAll: () => state,
  get: (id) => state.find((s) => s.id === id),
  create: (society) => {
    const id = nextId();
    const next = {
      chairperson: "—",
      registrationNo: "—",
      consentPct: 0,
      ...society,
      id,
      orgName: orgName(society.orgId),
      city: society.city || orgCity(society.orgId),
    };
    state = [next, ...state];
    emit();
    return next;
  },
  update: (id, patch) => {
    state = state.map((s) =>
      s.id === id ? { ...s, ...patch, orgName: patch.orgId ? orgName(patch.orgId) : s.orgName } : s,
    );
    emit();
  },
  remove: (id) => {
    state = state.filter((s) => s.id !== id);
    emit();
  },
  subscribe: (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function useSocieties() {
  return useSyncExternalStore(
    societiesStore.subscribe,
    societiesStore.getAll,
    societiesStore.getAll,
  );
}
export function useSociety(id) {
  const all = useSocieties();
  return all.find((s) => s.id === id) ?? null;
}
