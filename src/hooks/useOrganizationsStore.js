import { useSyncExternalStore } from "react";
import {
  ORGANIZATIONS_FULL, SOCIETY_LIBRARY,
  ORG_INVITATIONS, ORG_KYC, ORG_AUDIT,
} from "@/data/organizations";

const KEY = "uaspl.organizations.v2";

function hydrate() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.orgs) return null;
    return parsed;
  } catch { return null; }
}

const initial = hydrate();
let state = initial?.orgs ?? ORGANIZATIONS_FULL.map((o) => ({ ...o }));
let societyLib = initial?.societyLib ?? [...SOCIETY_LIBRARY];
let invitations = initial?.invitations ?? JSON.parse(JSON.stringify(ORG_INVITATIONS));
let kyc = initial?.kyc ?? JSON.parse(JSON.stringify(ORG_KYC));
let audit = initial?.audit ?? JSON.parse(JSON.stringify(ORG_AUDIT));

const listeners = new Set();
const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify({ orgs: state, societyLib, invitations, kyc, audit })); } catch { /* ignore */ }
};
const emit = () => { persist(); listeners.forEach((l) => l()); };

const rid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const nextOrgId = () => `org-new-${state.length + 1}-${Date.now().toString(36).slice(-4)}`;

const pushAudit = (orgId, entry) => {
  const list = audit[orgId] ?? [];
  audit = { ...audit, [orgId]: [{ id: rid("a"), at: new Date().toISOString(), actor: "You", ...entry }, ...list] };
};

export const organizationsStore = {
  getAll: () => state,
  get: (id) => state.find((o) => o.id === id),
  getSocietyLibrary: () => societyLib,
  getInvitations: (orgId) => invitations[orgId] ?? [],
  getKyc: (orgId) => kyc[orgId] ?? [],
  getAudit: (orgId) => audit[orgId] ?? [],

  create: (org) => {
    const id = nextOrgId();
    const next = {
      id, plan: "Business", status: "Onboarding", industry: "Redevelopment",
      projects: 0, societies: 0, members: 1,
      logoColor: "oklch(0.60 0.16 260)",
      assignedSocieties: [], createdAt: new Date().toISOString().slice(0, 10),
      ...org,
    };
    state = [next, ...state];
    pushAudit(id, { action: "created", detail: `Organization ${next.name} onboarded` });
    emit();
    return next;
  },
  update: (id, patch) => {
    state = state.map((o) => (o.id === id ? { ...o, ...patch } : o));
    pushAudit(id, { action: "updated", detail: `Profile updated (${Object.keys(patch).slice(0, 4).join(", ")})` });
    emit();
  },
  remove: (id) => {
    state = state.filter((o) => o.id !== id);
    emit();
  },
  setStatus: (id, status) => {
    const prev = state.find((o) => o.id === id)?.status;
    state = state.map((o) => (o.id === id ? { ...o, status } : o));
    pushAudit(id, { action: "status_changed", detail: `${prev ?? "—"} → ${status}` });
    emit();
  },
  assignSociety: (id, societyId) => {
    let name = societyId;
    state = state.map((o) => {
      if (o.id !== id) return o;
      if (o.assignedSocieties.includes(societyId)) return o;
      const s = societyLib.find((x) => x.id === societyId); if (s) name = s.name;
      return { ...o, assignedSocieties: [...o.assignedSocieties, societyId], societies: o.assignedSocieties.length + 1 };
    });
    pushAudit(id, { action: "society_assigned", detail: `${name} assigned` });
    emit();
  },
  unassignSociety: (id, societyId) => {
    const s = societyLib.find((x) => x.id === societyId);
    state = state.map((o) => {
      if (o.id !== id) return o;
      const list = o.assignedSocieties.filter((x) => x !== societyId);
      return { ...o, assignedSocieties: list, societies: list.length };
    });
    pushAudit(id, { action: "society_unassigned", detail: `${s?.name ?? societyId} removed` });
    emit();
  },
  addSocietyToLibrary: (society) => {
    if (!societyLib.some((s) => s.id === society.id)) {
      societyLib = [society, ...societyLib];
      emit();
    }
  },

  // Invitations
  createInvitation: (orgId, { email, role, invitedBy = "You", ttlDays = 7 }) => {
    const now = new Date();
    const exp = new Date(); exp.setDate(now.getDate() + ttlDays);
    const inv = {
      id: rid("inv"), email, role, invitedBy,
      status: "Pending",
      createdAt: now.toISOString(), expiresAt: exp.toISOString(),
      token: `inv_${Math.random().toString(36).slice(2, 10)}`,
    };
    invitations = { ...invitations, [orgId]: [inv, ...(invitations[orgId] ?? [])] };
    pushAudit(orgId, { action: "invited_member", detail: `${email} · ${role}` });
    emit();
    return inv;
  },
  resendInvitation: (orgId, invId) => {
    const list = invitations[orgId] ?? [];
    invitations = {
      ...invitations,
      [orgId]: list.map((i) => {
        if (i.id !== invId) return i;
        const exp = new Date(); exp.setDate(exp.getDate() + 7);
        return { ...i, status: "Pending", createdAt: new Date().toISOString(), expiresAt: exp.toISOString(), token: `inv_${Math.random().toString(36).slice(2, 10)}` };
      }),
    };
    const inv = (invitations[orgId] ?? []).find((i) => i.id === invId);
    if (inv) pushAudit(orgId, { action: "invited_member", detail: `Resent invite to ${inv.email}` });
    emit();
  },
  revokeInvitation: (orgId, invId) => {
    const list = invitations[orgId] ?? [];
    const inv = list.find((i) => i.id === invId);
    invitations = { ...invitations, [orgId]: list.map((i) => (i.id === invId ? { ...i, status: "Revoked" } : i)) };
    if (inv) pushAudit(orgId, { action: "invite_revoked", detail: `${inv.email}` });
    emit();
  },

  // KYC
  addKyc: (orgId, doc) => {
    const entry = {
      id: rid("kyc"), status: "Pending", uploadedAt: new Date().toISOString(),
      uploadedBy: "You", verifiedAt: null, notes: "", sizeKb: 0, mime: "application/pdf",
      ...doc,
    };
    kyc = { ...kyc, [orgId]: [entry, ...(kyc[orgId] ?? [])] };
    pushAudit(orgId, { action: "kyc_uploaded", detail: `${entry.type} · ${entry.fileName}` });
    emit();
    return entry;
  },
  setKycStatus: (orgId, docId, status, notes) => {
    const list = kyc[orgId] ?? [];
    const doc = list.find((d) => d.id === docId);
    kyc = {
      ...kyc,
      [orgId]: list.map((d) => (d.id === docId ? {
        ...d, status,
        verifiedAt: status === "Verified" ? new Date().toISOString() : d.verifiedAt,
        notes: notes ?? d.notes,
      } : d)),
    };
    if (doc) {
      const action = status === "Verified" ? "kyc_verified" : status === "Rejected" ? "kyc_rejected" : "kyc_uploaded";
      pushAudit(orgId, { action, detail: `${doc.type} → ${status}` });
    }
    emit();
  },
  removeKyc: (orgId, docId) => {
    kyc = { ...kyc, [orgId]: (kyc[orgId] ?? []).filter((d) => d.id !== docId) };
    emit();
  },

  reset: () => {
    state = ORGANIZATIONS_FULL.map((o) => ({ ...o }));
    societyLib = [...SOCIETY_LIBRARY];
    invitations = JSON.parse(JSON.stringify(ORG_INVITATIONS));
    kyc = JSON.parse(JSON.stringify(ORG_KYC));
    audit = JSON.parse(JSON.stringify(ORG_AUDIT));
    emit();
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
export function useOrgInvitations(orgId) {
  return useSyncExternalStore(
    organizationsStore.subscribe,
    () => organizationsStore.getInvitations(orgId),
    () => organizationsStore.getInvitations(orgId),
  );
}
export function useOrgKyc(orgId) {
  return useSyncExternalStore(
    organizationsStore.subscribe,
    () => organizationsStore.getKyc(orgId),
    () => organizationsStore.getKyc(orgId),
  );
}
export function useOrgAudit(orgId) {
  return useSyncExternalStore(
    organizationsStore.subscribe,
    () => organizationsStore.getAudit(orgId),
    () => organizationsStore.getAudit(orgId),
  );
}
