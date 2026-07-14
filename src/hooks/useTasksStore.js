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
  addComment: (id, author, text) => {
    state = state.map((t) => (t.id === id ? {
      ...t,
      comments: [...(t.comments ?? []), { id: `c-${Date.now().toString(36)}`, author, text, at: new Date().toISOString() }],
    } : t));
    emit();
  },
  addSubtask: (id, title) => {
    state = state.map((t) => (t.id === id ? {
      ...t,
      subtasks: [...(t.subtasks ?? []), { id: `st-${Date.now().toString(36)}`, title, done: false }],
    } : t));
    emit();
  },
  toggleSubtask: (id, subtaskId) => {
    state = state.map((t) => (t.id === id ? {
      ...t,
      subtasks: (t.subtasks ?? []).map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)),
    } : t));
    emit();
  },
  removeSubtask: (id, subtaskId) => {
    state = state.map((t) => (t.id === id ? {
      ...t,
      subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId),
    } : t));
    emit();
  },
  addAttachment: (id, name, size) => {
    state = state.map((t) => (t.id === id ? {
      ...t,
      attachments: [...(t.attachments ?? []), { id: `att-${Date.now().toString(36)}`, name, size, at: new Date().toISOString() }],
    } : t));
    emit();
  },
  removeAttachment: (id, attachmentId) => {
    state = state.map((t) => (t.id === id ? {
      ...t,
      attachments: (t.attachments ?? []).filter((a) => a.id !== attachmentId),
    } : t));
    emit();
  },
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
};

export function useTasks() {
  return useSyncExternalStore(tasksStore.subscribe, tasksStore.getAll, tasksStore.getAll);
}
export function useTask(id) {
  const all = useTasks();
  return all.find((t) => t.id === id) ?? null;
}
