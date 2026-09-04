import {
  LayoutDashboard,
  Building2,
  HardHat,
  ClipboardList,
  ShieldCheck,
  DraftingCompass,
  Hammer,
  Cable,
  Users2,
  CalendarDays,
  FileText,
  PencilRuler,
  Boxes,
  Warehouse,
  Truck,
  Store,
  Microscope,
  Landmark,
  UserCog,
  ListChecks,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  LifeBuoy,
  Activity,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "activity", to: "/app/activity", label: "Activity Center", icon: Activity },
    ],
  },
  {
    label: "Delivery",
    items: [
      { id: "organizations", to: "/app/organizations", label: "Organizations", icon: Building2, perm: "organization.view" },
      { id: "societies", to: "/app/societies", label: "Societies", icon: Landmark, perm: "society.view" },
      { id: "projects", to: "/app/projects", label: "Projects", icon: HardHat, perm: "project.view" },
      { id: "tasks", to: "/app/tasks", label: "Tasks", icon: ListChecks, perm: "task.view" },
      { id: "calendar", to: "/app/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Engineering",
    items: [
      { id: "architecture", to: "/app/architecture", label: "Architecture", icon: DraftingCompass, perm: ["drawing.review", "drawing.approve"] },
      { id: "civil", to: "/app/civil", label: "Civil", icon: Hammer, perm: ["drawing.review", "drawing.approve"] },
      { id: "mep", to: "/app/mep", label: "MEP", icon: Cable, perm: ["drawing.review", "drawing.approve"] },
      { id: "drawings", to: "/app/drawings", label: "Drawings & Approvals", icon: PencilRuler, perm: ["drawing.upload", "drawing.review", "drawing.approve"] },
      { id: "tmi", to: "/app/tmi", label: "TMI / Inspections", icon: Microscope, perm: ["drawing.review", "drawing.approve"] },
      { id: "compliance", to: "/app/compliance", label: "Compliance", icon: ShieldCheck, perm: "reports.view" },
    ],
  },
  {
    label: "Supply Chain",
    items: [
      { id: "materials", to: "/app/materials", label: "Materials", icon: Boxes, perm: ["inventory.issue", "inventory.receive"] },
      { id: "inventory", to: "/app/inventory", label: "Inventory", icon: Warehouse, perm: ["inventory.issue", "inventory.receive"] },
      { id: "store", to: "/app/store", label: "Store & Dispatch", icon: Store, perm: ["inventory.issue", "inventory.receive"] },
      { id: "vendors", to: "/app/vendors", label: "Vendors", icon: Truck, perm: ["vendor.view", "inventory.issue", "inventory.receive"] },
    ],
  },
  {
    label: "Business",
    items: [
      { id: "finance", to: "/app/finance", label: "Finance", icon: Landmark, perm: "finance.view" },
      { id: "hr", to: "/app/hr", label: "Human Resources", icon: Users2, perm: ["hr.view", "hr.manage", "users.manage"] },
      { id: "documents", to: "/app/documents", label: "Documents", icon: FileText },
      { id: "meetings", to: "/app/meetings", label: "Society Meetings", icon: ClipboardList, perm: "society.view" },
    ],
  },
  {
    label: "Insights",
    items: [
      { id: "reports", to: "/app/reports", label: "Reports", icon: ScrollText, perm: "reports.view" },
      { id: "analytics", to: "/app/analytics", label: "Analytics", icon: BarChart3, perm: "reports.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { id: "users", to: "/app/users", label: "User Management", icon: UserCog, perm: ["user.view", "user.create", "user.edit", "users.manage"] },
      { id: "roles", to: "/app/roles", label: "Roles & Permissions", icon: ShieldCheck, perm: ["role.view", "role.manage", "roles.manage", "permissions.manage"] },
      { id: "notifications", to: "/app/notifications", label: "Notifications", icon: Bell },
      { id: "audit", to: "/app/audit", label: "Audit Logs", icon: ScrollText, perm: "audit.view" },
      { id: "settings", to: "/app/settings", label: "Settings", icon: Settings, perm: "settings.manage" },
      { id: "help", to: "/app/help", label: "Help Center", icon: LifeBuoy },
    ],
  },
];

export const FLAT_NAV = NAV_SECTIONS.flatMap((s) => s.items);

/**
 * Sidebar: prefer the role's sidebarMenus (catalog or Role document).
 * Still intersect with permissions so a menu id cannot bypass RBAC.
 */
export function buildVisibleNavSections(hasAnyPermission, sidebarMenus) {
  const allow = Array.isArray(sidebarMenus) && sidebarMenus.length ? new Set(sidebarMenus) : null;

  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (allow && !allow.has(item.id)) return false;
      if (!item.perm) return true;
      return hasAnyPermission([].concat(item.perm));
    }),
  })).filter((section) => section.items.length > 0);
}
