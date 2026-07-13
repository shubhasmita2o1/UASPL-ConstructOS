export const TASK_STATUSES = ["todo", "in-progress", "review", "done", "blocked"];
export const TASK_STATUS_LABELS = {
  todo: "To do",
  "in-progress": "In progress",
  review: "In review",
  done: "Done",
  blocked: "Blocked",
};
export const TASK_STATUS_TONES = {
  todo: "neutral",
  "in-progress": "info",
  review: "primary",
  done: "success",
  blocked: "destructive",
};
export const TASK_PRIORITIES = ["Low", "Medium", "High", "Critical"];
export const TASK_PRIORITY_TONES = {
  Low: "neutral",
  Medium: "info",
  High: "warning",
  Critical: "destructive",
};
export const TASK_TYPES = ["Task", "Bug", "Approval", "Inspection", "Milestone"];

const assignees = [
  { id: "u-3", name: "Rohan Iyer", avatar: "RI" },
  { id: "u-4", name: "Priya Nair", avatar: "PN" },
  { id: "u-8", name: "S. Menon", avatar: "SM" },
  { id: "u-9", name: "K. Rao", avatar: "KR" },
  { id: "u-2", name: "Neha Kulkarni", avatar: "NK" },
  { id: "u-11", name: "V. Shah", avatar: "VS" },
];

export const TASK_ASSIGNEES = assignees;

// Generate dates around today so the calendar view is populated
function d(offsetDays) {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return dt.toISOString().slice(0, 10);
}

export const TASKS = [
  { id: "T-1001", title: "Approve rebar drawing STR-B4-Rev-07", type: "Approval", status: "review", priority: "High",  projectId: "P-001", assignee: assignees[0], dueDate: d(1),  estimate: 2, tags: ["Structural"] },
  { id: "T-1002", title: "Cube test — Tower B, L-14 slab",     type: "Inspection", status: "in-progress", priority: "Medium", projectId: "P-001", assignee: assignees[1], dueDate: d(0),  estimate: 4, tags: ["QA/QC"] },
  { id: "T-1003", title: "MEP shaft clash resolution — L-9",   type: "Task",     status: "in-progress", priority: "High", projectId: "P-001", assignee: assignees[2], dueDate: d(3),  estimate: 6, tags: ["MEP","Clash"] },
  { id: "T-1004", title: "Facade material vendor RFQ",         type: "Task",     status: "todo",       priority: "Medium", projectId: "P-004", assignee: assignees[4], dueDate: d(5),  estimate: 3, tags: ["Procurement"] },
  { id: "T-1005", title: "MHADA NoC filing",                   type: "Task",     status: "blocked",    priority: "Critical", projectId: "P-002", assignee: assignees[0], dueDate: d(-1), estimate: 8, tags: ["Approvals"] },
  { id: "T-1006", title: "Snagging punchlist — Wing C",        type: "Inspection", status: "todo",     priority: "Low", projectId: "P-006", assignee: assignees[3], dueDate: d(6),  estimate: 5, tags: ["Handover"] },
  { id: "T-1007", title: "Weekly PM review",                   type: "Milestone", status: "todo",     priority: "Medium", projectId: "P-001", assignee: assignees[0], dueDate: d(2),  estimate: 1, tags: ["Governance"] },
  { id: "T-1008", title: "PO release — Konkan Steels",         type: "Approval", status: "done",      priority: "High", projectId: "P-001", assignee: assignees[4], dueDate: d(-2), estimate: 1, tags: ["Finance"] },
  { id: "T-1009", title: "Fitout stone dispatch tracking",     type: "Task",     status: "in-progress", priority: "High", projectId: "P-008", assignee: assignees[5], dueDate: d(4),  estimate: 2, tags: ["Logistics"] },
  { id: "T-1010", title: "RFI-208 response — Facade anchor",   type: "Task",     status: "review",    priority: "Medium", projectId: "P-001", assignee: assignees[3], dueDate: d(1),  estimate: 2, tags: ["Design"] },
  { id: "T-1011", title: "Tenant sign-off drive — Wing A",     type: "Task",     status: "todo",      priority: "High", projectId: "P-002", assignee: assignees[4], dueDate: d(7),  estimate: 12, tags: ["Rehab"] },
  { id: "T-1012", title: "Quarterly RERA update filing",       type: "Milestone", status: "todo",    priority: "Critical", projectId: "P-005", assignee: assignees[0], dueDate: d(9), estimate: 3, tags: ["Compliance"] },
  { id: "T-1013", title: "Site safety audit",                  type: "Inspection", status: "in-progress", priority: "Medium", projectId: "P-007", assignee: assignees[1], dueDate: d(0), estimate: 4, tags: ["EHS"] },
  { id: "T-1014", title: "Design GA review — Tower A finishes",type: "Task",     status: "review",    priority: "Medium", projectId: "P-004", assignee: assignees[2], dueDate: d(3), estimate: 6, tags: ["Design"] },
  { id: "T-1015", title: "IOA follow-up with BMC",             type: "Task",     status: "blocked",   priority: "High", projectId: "P-003", assignee: assignees[4], dueDate: d(-3), estimate: 5, tags: ["Approvals"] },
];

export const TASK_CAPABILITIES = {
  super_admin: { create: true, edit: true, delete: true },
  org_admin: { create: true, edit: true, delete: true },
  project_manager: { create: true, edit: true, delete: true },
  planner: { create: true, edit: true, delete: false },
  site_engineer: { create: true, edit: true, delete: false },
  architect: { create: false, edit: true, delete: false },
  finance_manager: { create: false, edit: false, delete: false },
  hr_manager: { create: false, edit: false, delete: false },
  document_controller: { create: false, edit: false, delete: false },
  tmi_inspector: { create: true, edit: true, delete: false },
  vendor: { create: false, edit: false, delete: false },
  viewer: { create: false, edit: false, delete: false },
};

export function taskCapsFor(roleId) {
  return TASK_CAPABILITIES[roleId] ?? { create: false, edit: false, delete: false };
}
