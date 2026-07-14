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
      { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/app/activity", label: "Activity Center", icon: Activity },
    ],
  },
  {
    label: "Delivery",
    items: [
      {
        to: "/app/organizations",
        label: "Organizations",
        icon: Building2,
        perm: "organization.view",
      },
      { to: "/app/societies", label: "Societies", icon: Landmark, perm: "society.view" },
      { to: "/app/projects", label: "Projects", icon: HardHat, perm: "project.view" },
      { to: "/app/tasks", label: "Tasks", icon: ListChecks, perm: "task.view" },
      { to: "/app/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Engineering",
    items: [
      {
        to: "/app/architecture",
        label: "Architecture",
        icon: DraftingCompass,
        perm: ["drawing.review", "drawing.approve"],
      },
      {
        to: "/app/civil",
        label: "Civil",
        icon: Hammer,
        perm: ["drawing.review", "drawing.approve"],
      },
      { to: "/app/mep", label: "MEP", icon: Cable, perm: ["drawing.review", "drawing.approve"] },
      {
        to: "/app/drawings",
        label: "Drawings & Approvals",
        icon: PencilRuler,
        perm: ["drawing.upload", "drawing.review", "drawing.approve"],
      },
      {
        to: "/app/tmi",
        label: "TMI / Inspections",
        icon: Microscope,
        perm: ["drawing.review", "drawing.approve"],
      },
      { to: "/app/compliance", label: "Compliance", icon: ShieldCheck, perm: "reports.view" },
    ],
  },
  {
    label: "Supply Chain",
    items: [
      {
        to: "/app/materials",
        label: "Materials",
        icon: Boxes,
        perm: ["inventory.issue", "inventory.receive"],
      },
      {
        to: "/app/inventory",
        label: "Inventory",
        icon: Warehouse,
        perm: ["inventory.issue", "inventory.receive"],
      },
      {
        to: "/app/store",
        label: "Store & Dispatch",
        icon: Store,
        perm: ["inventory.issue", "inventory.receive"],
      },
      {
        to: "/app/vendors",
        label: "Vendors",
        icon: Truck,
        perm: ["inventory.issue", "inventory.receive"],
      },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/app/finance", label: "Finance", icon: Landmark, perm: "finance.view" },
      { to: "/app/hr", label: "Human Resources", icon: Users2, perm: "users.manage" },
      { to: "/app/documents", label: "Documents", icon: FileText },
      { to: "/app/meetings", label: "Society Meetings", icon: ClipboardList, perm: "society.view" },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/app/reports", label: "Reports", icon: ScrollText, perm: "reports.view" },
      { to: "/app/analytics", label: "Analytics", icon: BarChart3, perm: "reports.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        to: "/app/users",
        label: "User Management",
        icon: UserCog,
        perm: ["user.view", "user.create", "user.edit", "users.manage"],
      },
      {
        to: "/app/roles",
        label: "Roles & Permissions",
        icon: ShieldCheck,
        perm: ["role.view", "role.manage", "roles.manage", "permissions.manage"],
      },
      { to: "/app/notifications", label: "Notifications", icon: Bell },
      { to: "/app/audit", label: "Audit Logs", icon: ScrollText, perm: "audit.view" },
      { to: "/app/settings", label: "Settings", icon: Settings, perm: "settings.manage" },
      { to: "/app/help", label: "Help Center", icon: LifeBuoy },
    ],
  },
];

export const FLAT_NAV = NAV_SECTIONS.flatMap((s) => s.items);

/**
 * Sidebar menu builder: filters NAV_SECTIONS down to the items the current
 * user is allowed to see, dropping sections left with none. An item with no
 * `perm` is visible to any authenticated user; `perm` can be a single key or
 * an array (any-of).
 */
export function buildVisibleNavSections(hasAnyPermission) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.perm || hasAnyPermission([].concat(item.perm))),
  })).filter((section) => section.items.length > 0);
}
