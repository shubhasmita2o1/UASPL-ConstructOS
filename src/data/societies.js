import { SOCIETIES, ORGANIZATIONS } from "./mockData";

export const SOCIETY_PHASES = ["Feasibility", "Design", "Approvals", "Planning", "Execution", "Handover", "Closed"];

export const SOCIETY_PHASE_TONE = {
  Feasibility: "neutral",
  Design: "info",
  Approvals: "warning",
  Planning: "info",
  Execution: "primary",
  Handover: "success",
  Closed: "neutral",
};

const orgName = (id) => ORGANIZATIONS.find((o) => o.id === id)?.name ?? "—";
const orgCity = (id) => ORGANIZATIONS.find((o) => o.id === id)?.city ?? "";

const CHAIRS = {
  "soc-sea-pearl":  { name: "Mahesh Rane",    phone: "+91 98201 44556" },
  "soc-green-oaks": { name: "Farida Sheikh",  phone: "+91 98202 77821" },
  "soc-sunrise":    { name: "Deepak Shetty",  phone: "+91 98203 33410" },
  "soc-lotus":      { name: "Anita Verma",    phone: "+91 98204 61200" },
  "soc-sahyadri":   { name: "Prakash Deshpande", phone: "+91 98221 90011" },
  "soc-riverdale":  { name: "Meera Kulkarni", phone: "+91 98222 45678" },
  "soc-hillview":   { name: "Sanjay Patil",   phone: "+91 98330 11223" },
};

const REGISTRATIONS = {
  "soc-sea-pearl":  "MUM/CHS/1998/4412",
  "soc-green-oaks": "MUM/CHS/2001/9087",
  "soc-sunrise":    "MUM/CHS/1994/2210",
  "soc-lotus":      "MUM/CHS/2005/6633",
  "soc-sahyadri":   "PUN/CHS/1999/1188",
  "soc-riverdale":  "PUN/CHS/2003/7742",
  "soc-hillview":   "THN/CHS/2010/3391",
};

export const SOCIETIES_FULL = Object.entries(SOCIETIES).flatMap(([orgId, list]) =>
  list.map((s) => ({
    ...s,
    orgId,
    orgName: orgName(orgId),
    city: orgCity(orgId),
    chairperson: CHAIRS[s.id]?.name ?? "—",
    chairPhone: CHAIRS[s.id]?.phone ?? "",
    registrationNo: REGISTRATIONS[s.id] ?? "—",
    consentPct: Math.min(100, 60 + (s.units % 40)),
  })),
);
