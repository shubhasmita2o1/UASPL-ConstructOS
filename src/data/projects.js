import { PROJECT_PHASES } from "./mockData";

export { PROJECT_PHASES };

export const PROJECT_HEALTH_TONES = {
  "on-track": "success",
  "at-risk": "warning",
  delayed: "destructive",
  paused: "neutral",
};

export const PROJECT_PRIORITIES = ["Low", "Medium", "High", "Critical"];

const managers = [
  { id: "u-3", name: "Rohan Iyer", avatar: "RI" },
  { id: "u-8", name: "S. Menon", avatar: "SM" },
  { id: "u-9", name: "K. Rao", avatar: "KR" },
  { id: "u-2", name: "Neha Kulkarni", avatar: "NK" },
];

export const PROJECTS = [
  {
    id: "P-001",
    code: "SPT-BAN-24",
    name: "Sea Pearl Towers",
    societyId: "soc-sea-pearl",
    societyName: "Sea Pearl CHS",
    orgId: "org-uaspl-mumbai",
    location: "Bandra West, Mumbai",
    phase: "Execution",
    priority: "High",
    health: "on-track",
    progress: 62,
    spend: 128.4,
    budget: 210,
    startDate: "2024-02-12",
    endDate: "2026-11-30",
    manager: managers[0],
    team: [managers[0], managers[3], { id: "u-4", name: "Priya Nair", avatar: "PN" }, { id: "u-11", name: "V. Shah", avatar: "VS" }],
    tags: ["Redevelopment", "Highrise", "RERA-25/MH/108"],
    risks: 2,
    milestonesCompleted: 14,
    milestonesTotal: 22,
    description:
      "Full redevelopment of the 4-tower Sea Pearl society in Bandra West — 312 units, 2 basements, retail podium and rehab wing. Currently in execution phase with structural works on Tower B and finishes starting on Tower A.",
  },
  {
    id: "P-002",
    code: "GOR-AND-24",
    name: "Green Oaks Redevelopment",
    societyId: "soc-green-oaks",
    societyName: "Green Oaks CHS",
    orgId: "org-uaspl-mumbai",
    location: "Andheri East, Mumbai",
    phase: "Planning",
    priority: "High",
    health: "at-risk",
    progress: 24,
    spend: 34.1,
    budget: 285,
    startDate: "2024-06-01",
    endDate: "2027-08-15",
    manager: managers[1],
    team: [managers[1], managers[3], { id: "u-12", name: "A. Bose", avatar: "AB" }],
    tags: ["Redevelopment", "MHADA", "6 buildings"],
    risks: 5,
    milestonesCompleted: 5,
    milestonesTotal: 24,
    description:
      "Comprehensive redevelopment of 6 wings covering 484 units. Rehab tenancy sign-off in progress, MHADA NoC awaited. Design freeze targeted for next quarter.",
  },
  {
    id: "P-003",
    code: "SNH-GHK-24",
    name: "Sunrise Heights",
    societyId: "soc-sunrise",
    societyName: "Sunrise Heights CHS",
    orgId: "org-uaspl-mumbai",
    location: "Ghatkopar, Mumbai",
    phase: "Approvals",
    priority: "Medium",
    health: "on-track",
    progress: 12,
    spend: 8.6,
    budget: 174,
    startDate: "2024-09-10",
    endDate: "2027-03-30",
    manager: managers[2],
    team: [managers[2], { id: "u-13", name: "T. Fernandes", avatar: "TF" }],
    tags: ["Redevelopment", "3 towers"],
    risks: 1,
    milestonesCompleted: 3,
    milestonesTotal: 21,
    description:
      "Three-tower redevelopment (224 units) currently awaiting IOA and CFO clearances. Preliminary excavation permits filed.",
  },
  {
    id: "P-004",
    code: "LRD-POW-24",
    name: "Lotus Residency",
    societyId: "soc-lotus",
    societyName: "Lotus Residency CHS",
    orgId: "org-uaspl-mumbai",
    location: "Powai, Mumbai",
    phase: "Design",
    priority: "Medium",
    health: "delayed",
    progress: 38,
    spend: 22.9,
    budget: 246,
    startDate: "2024-04-22",
    endDate: "2027-05-10",
    manager: managers[0],
    team: [managers[0], managers[1], { id: "u-14", name: "J. Pillai", avatar: "JP" }],
    tags: ["Redevelopment", "5 wings"],
    risks: 4,
    milestonesCompleted: 8,
    milestonesTotal: 22,
    description:
      "Design development running two weeks behind due to facade material revision. Structural GA drawings under third-party review.",
  },
  {
    id: "P-005",
    code: "SHC-KTD-24",
    name: "Sahyadri CHS",
    societyId: "soc-sahyadri",
    societyName: "Sahyadri CHS",
    orgId: "org-uaspl-pune",
    location: "Kothrud, Pune",
    phase: "Execution",
    priority: "High",
    health: "on-track",
    progress: 71,
    spend: 96.2,
    budget: 138,
    startDate: "2023-11-05",
    endDate: "2026-02-28",
    manager: managers[2],
    team: [managers[2], { id: "u-15", name: "M. Kadam", avatar: "MK" }],
    tags: ["Redevelopment", "Pune"],
    risks: 1,
    milestonesCompleted: 17,
    milestonesTotal: 21,
    description:
      "Three-tower execution nearing structural top-out on Tower 2. MEP first-fix in progress on Tower 1.",
  },
  {
    id: "P-006",
    code: "RVD-BNR-23",
    name: "Riverdale CHS",
    societyId: "soc-riverdale",
    societyName: "Riverdale CHS",
    orgId: "org-uaspl-pune",
    location: "Baner, Pune",
    phase: "Handover",
    priority: "Medium",
    health: "on-track",
    progress: 94,
    spend: 168.4,
    budget: 172,
    startDate: "2022-08-18",
    endDate: "2025-12-15",
    manager: managers[1],
    team: [managers[1], { id: "u-16", name: "R. Kale", avatar: "RK" }],
    tags: ["Handover", "4 buildings"],
    risks: 0,
    milestonesCompleted: 20,
    milestonesTotal: 21,
    description:
      "Snagging complete on 3 of 4 wings. Society handover targeted for December — DLP documentation being compiled.",
  },
  {
    id: "P-007",
    code: "HLV-THN-24",
    name: "Hillview Redev",
    societyId: "soc-hillview",
    societyName: "Hillview CHS",
    orgId: "org-mmr-devcorp",
    location: "Thane West",
    phase: "Execution",
    priority: "Low",
    health: "paused",
    progress: 41,
    spend: 58.2,
    budget: 122,
    startDate: "2024-01-15",
    endDate: "2026-09-30",
    manager: managers[3],
    team: [managers[3], { id: "u-17", name: "P. Joshi", avatar: "PJ" }],
    tags: ["Redevelopment"],
    risks: 3,
    milestonesCompleted: 9,
    milestonesTotal: 22,
    description:
      "Site works temporarily paused pending revised commencement certificate. Contractor demobilisation minimised to two crews.",
  },
  {
    id: "P-008",
    code: "SPT-TWR-C",
    name: "Sea Pearl — Tower C Fitout",
    societyId: "soc-sea-pearl",
    societyName: "Sea Pearl CHS",
    orgId: "org-uaspl-mumbai",
    location: "Bandra West, Mumbai",
    phase: "Execution",
    priority: "Critical",
    health: "at-risk",
    progress: 55,
    spend: 41.2,
    budget: 74,
    startDate: "2024-08-01",
    endDate: "2026-04-20",
    manager: managers[0],
    team: [managers[0], { id: "u-18", name: "H. Gupta", avatar: "HG" }],
    tags: ["Fitout", "Interiors"],
    risks: 3,
    milestonesCompleted: 11,
    milestonesTotal: 20,
    description:
      "Interior fitout package for Tower C — running two weeks behind due to imported stone delivery slippage.",
  },
];

export const PROJECT_ACTIVITY = {
  "P-001": [
    { id: 1, user: "Rohan Iyer", avatar: "RI", action: "approved drawing", target: "STR-B4-Rev-07", time: "2m ago", type: "approval" },
    { id: 2, user: "Priya Nair", avatar: "PN", action: "uploaded inspection report", target: "TMI-2410", time: "18m ago", type: "document" },
    { id: 3, user: "System", avatar: "SY", action: "milestone reached", target: "Tower B — L14 Slab", time: "3h ago", type: "milestone" },
    { id: 4, user: "K. Rao", avatar: "KR", action: "raised RFI", target: "RFI-208 — Facade anchor", time: "Yesterday", type: "rfi" },
    { id: 5, user: "N. Kulkarni", avatar: "NK", action: "assigned vendor", target: "Konkan Steels Pvt Ltd", time: "2 days ago", type: "vendor" },
  ],
};

export const PROJECT_ATTACHMENTS = {
  "P-001": [
    { id: "a1", name: "SPT-Master-Programme-v12.pdf", size: "2.4 MB", uploader: "Rohan Iyer", uploadedOn: "12 Jun 2026", type: "pdf" },
    { id: "a2", name: "Structural-GA-TowerB-Rev07.dwg", size: "18.1 MB", uploader: "K. Rao", uploadedOn: "10 Jun 2026", type: "dwg" },
    { id: "a3", name: "RERA-Quarterly-Update-Q2.xlsx", size: "412 KB", uploader: "N. Kulkarni", uploadedOn: "05 Jun 2026", type: "xlsx" },
    { id: "a4", name: "Site-Photos-15Jun.zip", size: "34.7 MB", uploader: "Priya Nair", uploadedOn: "15 Jun 2026", type: "zip" },
  ],
};

export const PROJECT_COMMENTS = {
  "P-001": [
    { id: "c1", user: "Priya Nair", avatar: "PN", role: "Site Engineer", time: "1h ago", body: "Slab pour for Tower B, L-14 completed at 06:20. Cube samples collected — TMI-2410 uploaded." },
    { id: "c2", user: "S. Menon", avatar: "SM", role: "MEP Lead", time: "3h ago", body: "Coordination clash on L-9 shaft resolved with revised layout MEP-09-Rev-04. RFI closed." },
    { id: "c3", user: "Rohan Iyer", avatar: "RI", role: "Project Manager", time: "Yesterday", body: "Konkan Steels PO cleared by finance. Expect first delivery on Monday." },
  ],
};

export const PROJECT_MILESTONES = {
  "P-001": [
    { id: "m1", name: "IOA Received", date: "12 Feb 2024", status: "done" },
    { id: "m2", name: "Excavation Complete", date: "28 May 2024", status: "done" },
    { id: "m3", name: "Raft — Tower A", date: "14 Aug 2024", status: "done" },
    { id: "m4", name: "Tower B Structural Top", date: "30 Sep 2026", status: "in-progress" },
    { id: "m5", name: "MEP First Fix — Tower A", date: "15 Dec 2026", status: "pending" },
    { id: "m6", name: "OC — Phase 1", date: "20 Aug 2027", status: "pending" },
  ],
};

// Fallback datasets so every project renders on details page
export function activityFor(id) {
  return PROJECT_ACTIVITY[id] ?? PROJECT_ACTIVITY["P-001"];
}
export function attachmentsFor(id) {
  return PROJECT_ATTACHMENTS[id] ?? PROJECT_ATTACHMENTS["P-001"];
}
export function commentsFor(id) {
  return PROJECT_COMMENTS[id] ?? PROJECT_COMMENTS["P-001"];
}
export function milestonesFor(id) {
  return PROJECT_MILESTONES[id] ?? PROJECT_MILESTONES["P-001"];
}

export const ROLE_CAPABILITIES = {
  super_admin: { create: true, edit: true, delete: true },
  org_admin: { create: true, edit: true, delete: true },
  project_manager: { create: true, edit: true, delete: false },
  planner: { create: false, edit: true, delete: false },
  architect: { create: false, edit: true, delete: false },
  site_engineer: { create: false, edit: false, delete: false },
  finance_manager: { create: false, edit: false, delete: false },
  hr_manager: { create: false, edit: false, delete: false },
  document_controller: { create: false, edit: false, delete: false },
  tmi_inspector: { create: false, edit: false, delete: false },
  vendor: { create: false, edit: false, delete: false },
  viewer: { create: false, edit: false, delete: false },
};

export function capsFor(roleId) {
  return ROLE_CAPABILITIES[roleId] ?? { create: false, edit: false, delete: false };
}
