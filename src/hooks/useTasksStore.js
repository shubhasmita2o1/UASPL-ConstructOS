import { useSyncExternalStore } from "react";
import { TASKS } from "@/data/tasks";

let state = [...TASKS];
const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }

export const tasksStore = {
  getAll: () => state,
  get: (id) => state.find((t) => t.id === id),
  create: (task) => {
    const id = `T-${1000 + state.length + 1}`;
    const next = { id, status: "todo", priority: "Medium", type: "Task", tags: [], ...task };
    state = [next, ...state];
    emit();
    return next;
  },
  update: (id, patch) => {
    state = state.map((t) => (t.id === id ? { ...t, ...patch } : t));
    emit();
  },
  remove: (id) => {
    state = state.filter((t) => t.id !== id);
    emit();
  },
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
};

export function useTasks() {
  return useSyncExternalStore(tasksStore.subscribe, tasksStore.getAll, tasksStore.getAll);
}
