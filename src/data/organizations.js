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

// ---------- Invitations ----------
export const INVITE_ROLES = ["org_admin", "project_manager", "finance_manager", "hr_manager", "document_controller", "viewer"];
export const INVITE_STATUSES = ["Pending", "Accepted", "Expired", "Revoked"];
export const INVITE_STATUS_TONE = { Pending: "info", Accepted: "success", Expired: "warning", Revoked: "destructive" };

const daysFromNow = (d) => {
  const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString();
};

export const ORG_INVITATIONS = {
  "org-uaspl-mumbai": [
    { id: "inv-m-1", email: "priya.shah@uaspl.in",  role: "project_manager",  status: "Pending",  invitedBy: "Neha Kulkarni",  createdAt: daysFromNow(-2), expiresAt: daysFromNow(5),  token: "inv_a4f9c81b" },
    { id: "inv-m-2", email: "vikram.rao@uaspl.in",   role: "finance_manager",  status: "Accepted", invitedBy: "Neha Kulkarni",  createdAt: daysFromNow(-9), expiresAt: daysFromNow(-2), token: "inv_88b0e132" },
    { id: "inv-m-3", email: "external@vendor.co",    role: "viewer",           status: "Expired",  invitedBy: "Aarav Deshmukh", createdAt: daysFromNow(-30),expiresAt: daysFromNow(-16),token: "inv_ff9910aa" },
  ],
  "org-uaspl-pune": [
    { id: "inv-p-1", email: "sneha.deo@uaspl.in",    role: "project_manager",  status: "Pending",  invitedBy: "Aditya Joshi",   createdAt: daysFromNow(-1), expiresAt: daysFromNow(6),  token: "inv_2201ccde" },
  ],
  "org-mmr-devcorp": [],
};

// ---------- KYC documents ----------
export const KYC_STATUSES = ["Pending", "Verified", "Rejected", "Expired"];
export const KYC_STATUS_TONE = { Pending: "warning", Verified: "success", Rejected: "destructive", Expired: "neutral" };
export const KYC_DOC_TYPES = ["PAN Card", "GST Certificate", "Certificate of Incorporation", "MSME Registration", "Cancelled Cheque", "Address Proof", "Director KYC", "Authorization Letter"];

export const ORG_KYC = {
  "org-uaspl-mumbai": [
    { id: "kyc-m-1", type: "PAN Card",                    fileName: "uaspl-pan.pdf",             sizeKb: 214, mime: "application/pdf", status: "Verified", uploadedBy: "Neha Kulkarni", uploadedAt: daysFromNow(-120), verifiedAt: daysFromNow(-118), notes: "Verified against MCA records." },
    { id: "kyc-m-2", type: "GST Certificate",             fileName: "uaspl-gst-27AABCU.pdf",     sizeKb: 512, mime: "application/pdf", status: "Verified", uploadedBy: "Neha Kulkarni", uploadedAt: daysFromNow(-118), verifiedAt: daysFromNow(-117), notes: "" },
    { id: "kyc-m-3", type: "Certificate of Incorporation",fileName: "uaspl-coi.pdf",             sizeKb: 890, mime: "application/pdf", status: "Verified", uploadedBy: "Neha Kulkarni", uploadedAt: daysFromNow(-118), verifiedAt: daysFromNow(-117), notes: "" },
    { id: "kyc-m-4", type: "Cancelled Cheque",            fileName: "hdfc-cheque.jpg",           sizeKb: 178, mime: "image/jpeg",      status: "Pending",  uploadedBy: "Neha Kulkarni", uploadedAt: daysFromNow(-2),   verifiedAt: null, notes: "Awaiting bank verification." },
  ],
  "org-uaspl-pune": [
    { id: "kyc-p-1", type: "PAN Card",                    fileName: "uaspl-pune-pan.pdf",        sizeKb: 210, mime: "application/pdf", status: "Verified", uploadedBy: "Aditya Joshi", uploadedAt: daysFromNow(-90), verifiedAt: daysFromNow(-89),  notes: "" },
    { id: "kyc-p-2", type: "GST Certificate",             fileName: "uaspl-pune-gst.pdf",        sizeKb: 498, mime: "application/pdf", status: "Expired",  uploadedBy: "Aditya Joshi", uploadedAt: daysFromNow(-400),verifiedAt: daysFromNow(-398), notes: "Renewal required." },
  ],
  "org-mmr-devcorp": [
    { id: "kyc-d-1", type: "PAN Card",                    fileName: "mmr-pan.pdf",               sizeKb: 232, mime: "application/pdf", status: "Pending",  uploadedBy: "Rhea Kapoor", uploadedAt: daysFromNow(-1),   verifiedAt: null, notes: "" },
    { id: "kyc-d-2", type: "Certificate of Incorporation",fileName: "mmr-coi.pdf",               sizeKb: 812, mime: "application/pdf", status: "Rejected", uploadedBy: "Rhea Kapoor", uploadedAt: daysFromNow(-4),   verifiedAt: null, notes: "Blurred scan — please re-upload." },
  ],
};

// ---------- Audit log ----------
export const AUDIT_ACTIONS = ["created", "updated", "status_changed", "society_assigned", "society_unassigned", "invited_member", "invite_revoked", "kyc_uploaded", "kyc_verified", "kyc_rejected"];
export const AUDIT_TONE = {
  created: "primary", updated: "info", status_changed: "warning",
  society_assigned: "success", society_unassigned: "neutral",
  invited_member: "info", invite_revoked: "destructive",
  kyc_uploaded: "info", kyc_verified: "success", kyc_rejected: "destructive",
};
export const AUDIT_LABEL = {
  created: "Created", updated: "Updated", status_changed: "Status changed",
  society_assigned: "Society assigned", society_unassigned: "Society unassigned",
  invited_member: "Invitation sent", invite_revoked: "Invitation revoked",
  kyc_uploaded: "KYC uploaded", kyc_verified: "KYC verified", kyc_rejected: "KYC rejected",
};

export const ORG_AUDIT = {
  "org-uaspl-mumbai": [
    { id: "a-m-1", action: "created",           actor: "System",          detail: "Organization onboarded to ConstructOS", at: daysFromNow(-365) },
    { id: "a-m-2", action: "status_changed",    actor: "Aarav Deshmukh",  detail: "Onboarding → Active",                    at: daysFromNow(-350) },
    { id: "a-m-3", action: "kyc_verified",      actor: "Compliance Bot",  detail: "GST Certificate verified",              at: daysFromNow(-117) },
    { id: "a-m-4", action: "society_assigned",  actor: "Rohan Iyer",      detail: "Green Oaks CHS assigned",               at: daysFromNow(-40) },
    { id: "a-m-5", action: "invited_member",    actor: "Neha Kulkarni",   detail: "priya.shah@uaspl.in · project_manager", at: daysFromNow(-2) },
    { id: "a-m-6", action: "updated",           actor: "Neha Kulkarni",   detail: "Website + contact phone updated",       at: daysFromNow(-1) },
  ],
  "org-uaspl-pune": [
    { id: "a-p-1", action: "created",           actor: "System",          detail: "Organization onboarded to ConstructOS", at: daysFromNow(-300) },
    { id: "a-p-2", action: "status_changed",    actor: "Aditya Joshi",    detail: "Onboarding → Active",                    at: daysFromNow(-290) },
    { id: "a-p-3", action: "society_assigned",  actor: "Aditya Joshi",    detail: "Sahyadri CHS assigned",                 at: daysFromNow(-30) },
    { id: "a-p-4", action: "kyc_rejected",      actor: "Compliance Bot",  detail: "GST Certificate expired — renewal required", at: daysFromNow(-10) },
  ],
  "org-mmr-devcorp": [
    { id: "a-d-1", action: "created",           actor: "System",          detail: "Organization onboarded to ConstructOS", at: daysFromNow(-14) },
    { id: "a-d-2", action: "kyc_uploaded",      actor: "Rhea Kapoor",     detail: "PAN Card uploaded",                     at: daysFromNow(-1) },
    { id: "a-d-3", action: "kyc_rejected",      actor: "Compliance Bot",  detail: "Certificate of Incorporation blurry",   at: daysFromNow(-4) },
  ],
};
