import { ORGANIZATIONS, SOCIETIES } from "./mockData";

export const ORG_STATUSES = ["Active", "Onboarding", "Suspended", "Archived"];
export const ORG_PLANS = ["Starter", "Business", "Enterprise"];
export const ORG_INDUSTRIES = ["Redevelopment", "Turnkey Construction", "Infrastructure", "Facility Management"];

export const ORG_STATUS_TONE = {
  Active: "success",
  Onboarding: "info",
  Suspended: "warning",
  Archived: "neutral",
};

const CONTACTS = {
  "org-uaspl-mumbai": { name: "Neha Kulkarni", email: "neha@uaspl.in", phone: "+91 98200 12345", avatar: "NK" },
  "org-uaspl-pune":   { name: "Aditya Joshi",  email: "aditya@uaspl.in", phone: "+91 98220 88101", avatar: "AJ" },
  "org-mmr-devcorp":  { name: "Rhea Kapoor",   email: "rhea@mmrdev.in",  phone: "+91 98330 55090", avatar: "RK" },
};

const DETAILS = {
  "org-uaspl-mumbai": {
    status: "Active", industry: "Redevelopment", gstin: "27AABCU1234N1Z5",
    address: "Level 14, Trade Point, Kamala Mills, Lower Parel, Mumbai 400013",
    website: "https://uaspl.in", founded: "2011",
    description: "Flagship UASPL tenant delivering large-scale society redevelopment across the western suburbs.",
  },
  "org-uaspl-pune": {
    status: "Active", industry: "Redevelopment", gstin: "27AABCU1234N2Z4",
    address: "Suyash Commercial, Baner Road, Pune 411045",
    website: "https://uaspl.in/pune", founded: "2016",
    description: "Pune regional entity handling redevelopment and turnkey execution for the PMR belt.",
  },
  "org-mmr-devcorp": {
    status: "Onboarding", industry: "Turnkey Construction", gstin: "27AAECM9988R1Z2",
    address: "Vashi Corporate Park, Navi Mumbai 400703",
    website: "https://mmrdevcorp.com", founded: "2019",
    description: "Boutique developer partnering with UASPL on MMR-wide infrastructure programmes.",
  },
};

export const ORGANIZATIONS_FULL = ORGANIZATIONS.map((o) => ({
  ...o,
  ...DETAILS[o.id],
  contact: CONTACTS[o.id],
  assignedSocieties: (SOCIETIES[o.id] ?? []).map((s) => s.id),
  createdAt: "2024-01-15",
}));

// Societies available across the platform (mock library that can be assigned to any org)
export const SOCIETY_LIBRARY = Object.entries(SOCIETIES).flatMap(([orgId, list]) =>
  list.map((s) => ({ ...s, sourceOrgId: orgId })),
);

export const ORG_ACTIVITY = {
  "org-uaspl-mumbai": [
    { id: 1, user: "Aarav Deshmukh", action: "promoted", target: "Sea Pearl CHS to active", time: "2h ago" },
    { id: 2, user: "System",         action: "renewed subscription", target: "Enterprise · ₹18.5L / yr", time: "1d ago" },
    { id: 3, user: "Neha Kulkarni",  action: "invited", target: "5 members", time: "2d ago" },
    { id: 4, user: "Rohan Iyer",     action: "assigned society", target: "Green Oaks CHS", time: "4d ago" },
  ],
  "org-uaspl-pune": [
    { id: 1, user: "Aditya Joshi",   action: "onboarded", target: "Sahyadri CHS", time: "5h ago" },
    { id: 2, user: "System",         action: "generated report", target: "Q2 progress", time: "3d ago" },
  ],
  "org-mmr-devcorp": [
    { id: 1, user: "Rhea Kapoor",    action: "submitted", target: "KYC documents", time: "1d ago" },
    { id: 2, user: "System",         action: "created organization", target: "MMR DevCorp", time: "1w ago" },
  ],
};

export function activityForOrg(id) {
  return ORG_ACTIVITY[id] ?? [{ id: 1, user: "System", action: "created organization", target: id, time: "just now" }];
}

export const ORG_ROLE_CAPABILITIES = {
  super_admin: { create: true, edit: true, delete: true, assign: true, status: true },
  org_admin:   { create: false, edit: true, delete: false, assign: true, status: true },
  project_manager: { create: false, edit: false, delete: false, assign: false, status: false },
  planner: { create: false, edit: false, delete: false, assign: false, status: false },
  architect: { create: false, edit: false, delete: false, assign: false, status: false },
  site_engineer: { create: false, edit: false, delete: false, assign: false, status: false },
  finance_manager: { create: false, edit: false, delete: false, assign: false, status: false },
  hr_manager: { create: false, edit: false, delete: false, assign: false, status: false },
  document_controller: { create: false, edit: false, delete: false, assign: false, status: false },
  tmi_inspector: { create: false, edit: false, delete: false, assign: false, status: false },
  vendor: { create: false, edit: false, delete: false, assign: false, status: false },
  viewer: { create: false, edit: false, delete: false, assign: false, status: false },
};

export function orgCapsFor(roleId) {
  return ORG_ROLE_CAPABILITIES[roleId] ?? { create: false, edit: false, delete: false, assign: false, status: false };
}
