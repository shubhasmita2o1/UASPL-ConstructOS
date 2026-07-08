// Enterprise mock data for UASPL ConstructOS
export const ROLES = [
  { id: "super_admin", label: "Super Admin", scope: "platform" },
  { id: "org_admin", label: "Organization Admin", scope: "org" },
  { id: "project_manager", label: "Project Manager", scope: "project" },
  { id: "site_engineer", label: "Site Engineer", scope: "project" },
  { id: "planner", label: "Planner", scope: "project" },
  { id: "architect", label: "Architect", scope: "project" },
  { id: "vendor", label: "Vendor", scope: "org" },
  { id: "tmi_inspector", label: "TMI Inspector", scope: "project" },
  { id: "finance_manager", label: "Finance Manager", scope: "org" },
  { id: "hr_manager", label: "HR Manager", scope: "org" },
  { id: "document_controller", label: "Document Controller", scope: "project" },
  { id: "viewer", label: "Viewer", scope: "project" },
];

export const DEMO_USERS = [
  {
    id: "u-1",
    name: "Aarav Deshmukh",
    email: "aarav@uaspl.in",
    role: "super_admin",
    avatar: "AD",
    title: "Platform Administrator",
  },
  {
    id: "u-2",
    name: "Neha Kulkarni",
    email: "neha@uaspl.in",
    role: "org_admin",
    avatar: "NK",
    title: "Organization Admin — UASPL Mumbai",
  },
  {
    id: "u-3",
    name: "Rohan Iyer",
    email: "rohan@uaspl.in",
    role: "project_manager",
    avatar: "RI",
    title: "Project Manager — Sea Pearl Towers",
  },
  {
    id: "u-4",
    name: "Priya Nair",
    email: "priya@uaspl.in",
    role: "site_engineer",
    avatar: "PN",
    title: "Site Engineer — Sea Pearl Towers",
  },
];

export const ORGANIZATIONS = [
  {
    id: "org-uaspl-mumbai",
    name: "UASPL Mumbai",
    plan: "Enterprise",
    projects: 24,
    societies: 18,
    members: 312,
    logoColor: "oklch(0.58 0.16 240)",
    city: "Mumbai, MH",
  },
  {
    id: "org-uaspl-pune",
    name: "UASPL Pune",
    plan: "Enterprise",
    projects: 12,
    societies: 9,
    members: 148,
    logoColor: "oklch(0.66 0.15 155)",
    city: "Pune, MH",
  },
  {
    id: "org-mmr-devcorp",
    name: "MMR DevCorp",
    plan: "Business",
    projects: 7,
    societies: 6,
    members: 84,
    logoColor: "oklch(0.62 0.19 300)",
    city: "Thane, MH",
  },
];

export const SOCIETIES = {
  "org-uaspl-mumbai": [
    { id: "soc-sea-pearl", name: "Sea Pearl CHS", address: "Bandra West, Mumbai", buildings: 4, units: 312, phase: "Execution" },
    { id: "soc-green-oaks", name: "Green Oaks CHS", address: "Andheri East, Mumbai", buildings: 6, units: 484, phase: "Planning" },
    { id: "soc-sunrise", name: "Sunrise Heights CHS", address: "Ghatkopar, Mumbai", buildings: 3, units: 224, phase: "Approvals" },
    { id: "soc-lotus", name: "Lotus Residency CHS", address: "Powai, Mumbai", buildings: 5, units: 396, phase: "Design" },
  ],
  "org-uaspl-pune": [
    { id: "soc-sahyadri", name: "Sahyadri CHS", address: "Kothrud, Pune", buildings: 3, units: 186, phase: "Execution" },
    { id: "soc-riverdale", name: "Riverdale CHS", address: "Baner, Pune", buildings: 4, units: 258, phase: "Handover" },
  ],
  "org-mmr-devcorp": [
    { id: "soc-hillview", name: "Hillview CHS", address: "Thane West", buildings: 2, units: 128, phase: "Execution" },
  ],
};

export const PROJECT_PHASES = ["Feasibility", "Design", "Approvals", "Planning", "Execution", "Handover", "Closed"];

export const RECENT_ACTIVITY = [
  { id: 1, user: "Rohan Iyer", action: "approved drawing", target: "STR-B4-Rev-07", time: "2m ago", type: "approval" },
  { id: 2, user: "Priya Nair", action: "uploaded inspection report", target: "TMI-2410", time: "18m ago", type: "document" },
  { id: 3, user: "Neha Kulkarni", action: "added vendor", target: "Konkan Steels Pvt Ltd", time: "1h ago", type: "vendor" },
  { id: 4, user: "System", action: "purchase order raised", target: "PO-8842 · ₹18.4L", time: "2h ago", type: "finance" },
  { id: 5, user: "Aarav Deshmukh", action: "granted role", target: "Site Engineer to K. Rao", time: "3h ago", type: "user" },
  { id: 6, user: "Rohan Iyer", action: "closed task", target: "Slab casting — Tower B, L-14", time: "5h ago", type: "task" },
  { id: 7, user: "Priya Nair", action: "raised NCR", target: "Rebar cover deviation — Zone 3", time: "6h ago", type: "quality" },
];

export const KPI_TRENDS = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  planned: 65 + Math.round(Math.sin(i / 2) * 8) + i * 2,
  actual: 60 + Math.round(Math.cos(i / 2.2) * 7) + i * 1.8,
  spend: 40 + i * 4 + Math.round(Math.sin(i) * 5),
}));

export const CATEGORY_SPLIT = [
  { name: "Civil", value: 42 },
  { name: "MEP", value: 21 },
  { name: "Finishes", value: 18 },
  { name: "External", value: 11 },
  { name: "Contingency", value: 8 },
];

export const APPROVAL_QUEUE = [
  { id: "APR-1042", type: "Drawing", title: "Tower B — Slab L-16 Rebar", submittedBy: "K. Rao", submittedOn: "Today, 10:12", priority: "High", stage: "Structural" },
  { id: "APR-1041", type: "PO", title: "PO-8842 — Konkan Steels", submittedBy: "Finance Bot", submittedOn: "Today, 09:44", priority: "Medium", stage: "Finance" },
  { id: "APR-1039", type: "RFI", title: "MEP shaft coordination — L-9", submittedBy: "S. Menon", submittedOn: "Yesterday", priority: "Medium", stage: "Design" },
  { id: "APR-1037", type: "Change Order", title: "Facade cladding revision", submittedBy: "R. Iyer", submittedOn: "Yesterday", priority: "Low", stage: "PM Review" },
  { id: "APR-1036", type: "Vendor", title: "Onboard — Ashoka Interiors", submittedBy: "N. Kulkarni", submittedOn: "2 days ago", priority: "Low", stage: "Compliance" },
];

export const PROJECT_HEALTH = [
  { id: "P-001", name: "Sea Pearl Towers", phase: "Execution", progress: 62, health: "on-track", spend: 128.4, budget: 210, risks: 2 },
  { id: "P-002", name: "Green Oaks Redev", phase: "Planning", progress: 24, health: "at-risk", spend: 34.1, budget: 285, risks: 5 },
  { id: "P-003", name: "Sunrise Heights", phase: "Approvals", progress: 12, health: "on-track", spend: 8.6, budget: 174, risks: 1 },
  { id: "P-004", name: "Lotus Residency", phase: "Design", progress: 38, health: "delayed", spend: 22.9, budget: 246, risks: 4 },
  { id: "P-005", name: "Sahyadri CHS", phase: "Execution", progress: 71, health: "on-track", spend: 96.2, budget: 138, risks: 1 },
];
