export const PLATFORM_TENANTS = [
  { name: "UASPL Mumbai", plan: "Enterprise", orgs: 1, societies: 18, members: 312, status: "Healthy" },
  { name: "UASPL Pune", plan: "Enterprise", orgs: 1, societies: 9, members: 148, status: "Healthy" },
  { name: "MMR DevCorp", plan: "Business", orgs: 1, societies: 6, members: 84, status: "Watch" },
];

export const ACCESS_EVENTS = [
  { id: 1, who: "Aarav Deshmukh", action: "granted Super Admin", target: "internal audit login", time: "12m ago" },
  { id: 2, who: "System", action: "locked account after 5 attempts", target: "vendor@konkan.in", time: "41m ago" },
  { id: 3, who: "Ananya Deshmukh", action: "invited org member", target: "hr@uaspl.in", time: "2h ago" },
  { id: 4, who: "System", action: "role permissions resynced", target: "hr_manager", time: "Yesterday" },
];

export const ENGINEER_TASKS = [
  { id: "T-441", title: "Tower B L-14 cube test upload", due: "Today 16:00", status: "In progress" },
  { id: "T-438", title: "Check rebar cover — Zone 3", due: "Today 18:00", status: "Open" },
  { id: "T-429", title: "Receive TMT 12mm at store", due: "Tomorrow", status: "Open" },
  { id: "T-421", title: "Site diary — 04 Sep", due: "Today 19:00", status: "In progress" },
];

export const ENGINEER_NCRS = [
  { id: "NCR-118", title: "Rebar cover deviation — Zone 3", severity: "High", age: "6h" },
  { id: "NCR-114", title: "Honeycombing at core wall L-9", severity: "Medium", age: "2d" },
  { id: "NCR-109", title: "Curing log missing — Tower A L-11", severity: "Low", age: "4d" },
];

export const ENGINEER_DRAWINGS = [
  { code: "STR-B4-Rev-07", title: "Tower B slab L-16 rebar", action: "Review" },
  { code: "ARC-09-Rev-03", title: "Typical floor architectural", action: "Acknowledge" },
  { code: "MEP-09-Rev-04", title: "L-9 shaft coordination", action: "Site check" },
];

export const VENDOR_POS = [
  { id: "PO-8842", item: "TMT 12mm / 16mm — Konkan Steels", amount: 18.4, status: "Open", due: "06 Sep" },
  { id: "PO-8811", item: "RMC M40 — 240 m³", amount: 11.2, status: "Partial", due: "05 Sep" },
  { id: "PO-8794", item: "Aluform panels — hire", amount: 6.8, status: "Invoiced", due: "12 Sep" },
  { id: "PO-8702", item: "Safety nets & helmets", amount: 1.4, status: "Delivered", due: "Done" },
];

export const VENDOR_DELIVERIES = [
  { id: "DL-220", po: "PO-8842", what: "TMT 16mm — 18 MT", when: "Tomorrow 08:00", gate: "Sea Pearl — Gate 2" },
  { id: "DL-218", po: "PO-8811", what: "RMC M40 — 8 pours", when: "Today 06:00–14:00", gate: "Tower B pump" },
];

export const HR_HEADCOUNT_SPLIT = [
  { name: "Site", value: 186 },
  { name: "Engineering", value: 54 },
  { name: "PMO / Admin", value: 38 },
  { name: "Vendors on roll", value: 34 },
];

export const HR_LEAVE_QUEUE = [
  { id: "LV-204", name: "Karan Mehta", role: "Site Engineer", type: "Casual", days: "05–06 Sep", status: "Pending" },
  { id: "LV-201", name: "Priya Nair", role: "Site Engineer", type: "Sick", days: "04 Sep", status: "Pending" },
  { id: "LV-198", name: "S. Menon", role: "MEP Lead", type: "Earned", days: "12–16 Sep", status: "Pending" },
  { id: "LV-190", name: "R. Iyer", role: "Project Manager", type: "Casual", days: "08 Sep", status: "Approved" },
];

export const HR_ONBOARDING = [
  { name: "Meera Joshi", role: "QS Engineer", day: "Day 3 of 7", stage: "Documents" },
  { name: "A. Fernandes", role: "Safety Officer", day: "Day 1 of 7", stage: "Induction" },
  { name: "Vikram Shah", role: "Store Keeper", day: "Day 6 of 7", stage: "IT access" },
];

export const HR_OPEN_ROLES = [
  { title: "Site Engineer — Sea Pearl", openings: 2, applicants: 11 },
  { title: "Billing Engineer", openings: 1, applicants: 7 },
  { title: "HR Executive", openings: 1, applicants: 19 },
];

export const HR_SITE_MANPOWER = [
  { site: "Sea Pearl Towers", planned: 96, present: 91, contractors: 4 },
  { site: "Green Oaks Redev", planned: 42, present: 38, contractors: 2 },
  { site: "Sunrise Heights", planned: 18, present: 18, contractors: 1 },
];

export const HR_ATTENDANCE_TREND = [
  { day: "Mon", present: 278, absent: 14 },
  { day: "Tue", present: 281, absent: 11 },
  { day: "Wed", present: 274, absent: 18 },
  { day: "Thu", present: 286, absent: 8 },
  { day: "Fri", present: 269, absent: 23 },
];

export const HR_DIRECTORY = [
  { name: "Rohan Iyer", title: "Project Manager", dept: "Delivery", site: "Sea Pearl", status: "Active", type: "On roll" },
  { name: "Karan Mehta", title: "Site Engineer", dept: "Execution", site: "Sea Pearl", status: "Active", type: "On roll" },
  { name: "Priya Nair", title: "Site Engineer", dept: "Execution", site: "Sea Pearl", status: "On leave", type: "On roll" },
  { name: "S. Menon", title: "MEP Lead", dept: "Engineering", site: "Sea Pearl", status: "Active", type: "On roll" },
  { name: "Neha Kulkarni", title: "Org Admin", dept: "PMO", site: "HO Mumbai", status: "Active", type: "On roll" },
  { name: "Vikram Shah", title: "Store Keeper", dept: "Supply chain", site: "Sea Pearl", status: "Onboarding", type: "Contract" },
];
