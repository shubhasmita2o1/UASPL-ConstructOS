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
      { to: "/app/tasks", label: "Tasks", icon: ListChecks },
      { to: "/app/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Engineering",
    items: [
      { to: "/app/architecture", label: "Architecture", icon: DraftingCompass },
      { to: "/app/civil", label: "Civil", icon: Hammer },
      { to: "/app/mep", label: "MEP", icon: Cable },
      {
        to: "/app/drawings",
        label: "Drawings & Approvals",
        icon: PencilRuler,
        perm: ["drawing.upload", "drawing.review", "drawing.approve"],
      },
      { to: "/app/tmi", label: "TMI / Inspections", icon: Microscope },
      { to: "/app/compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Supply Chain",
    items: [
      { to: "/app/materials", label: "Materials", icon: Boxes },
      {
        to: "/app/inventory",
        label: "Inventory",
        icon: Warehouse,
        perm: ["inventory.issue", "inventory.receive"],
      },
      { to: "/app/store", label: "Store & Dispatch", icon: Store },
      { to: "/app/vendors", label: "Vendors", icon: Truck },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/app/finance", label: "Finance", icon: Landmark, perm: "finance.view" },
      { to: "/app/hr", label: "Human Resources", icon: Users2 },
      { to: "/app/documents", label: "Documents", icon: FileText },
      { to: "/app/meetings", label: "Society Meetings", icon: ClipboardList },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/app/reports", label: "Reports", icon: ScrollText, perm: "reports.view" },
      { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        to: "/app/users",
        label: "User Management",
        icon: UserCog,
        perm: ["user.view", "user.create", "user.edit"],
      },
      {
        to: "/app/roles",
        label: "Roles & Permissions",
        icon: ShieldCheck,
        perm: ["role.view", "role.manage"],
      },
      { to: "/app/notifications", label: "Notifications", icon: Bell },
      { to: "/app/audit", label: "Audit Logs", icon: ScrollText },
      { to: "/app/settings", label: "Settings", icon: Settings, perm: "settings.manage" },
      { to: "/app/help", label: "Help Center", icon: LifeBuoy },
    ],
  },
];

export const FLAT_NAV = NAV_SECTIONS.flatMap((s) => s.items);
