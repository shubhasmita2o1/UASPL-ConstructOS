/**
 * Role experience catalog.
 *
 * sidebarMenus / dashboardWidgets are also stored on the Role document so
 * admins can override them later. The frontend prefers the values on the
 * signed-in user, then falls back to this catalog by role slug.
 */
export const ROLE_EXPERIENCE = {
  super_admin: {
    label: "Super Admin",
    headline: "Platform operations",
    tagline: "Organizations, tenants, access control and system health across ConstructOS.",
    sidebarMenus: [
      "dashboard",
      "activity",
      "organizations",
      "societies",
      "projects",
      "users",
      "roles",
      "audit",
      "settings",
      "reports",
      "analytics",
      "notifications",
      "help",
    ],
    dashboardWidgets: [
      "platformOrgs",
      "platformUsers",
      "platformSocieties",
      "platformProjects",
      "tenantTable",
      "accessEvents",
      "recentActivity",
    ],
  },
  org_admin: {
    label: "Organization Admin",
    headline: "Organization operations",
    tagline: "Societies, people, vendors and commercial control for this organization.",
    sidebarMenus: [
      "dashboard",
      "activity",
      "societies",
      "projects",
      "tasks",
      "vendors",
      "finance",
      "hr",
      "users",
      "roles",
      "meetings",
      "documents",
      "reports",
      "settings",
      "help",
    ],
    dashboardWidgets: [
      "orgSocieties",
      "orgProjects",
      "orgMembers",
      "orgSpend",
      "projectHealth",
      "vendorOnboarding",
      "recentActivity",
    ],
  },
  project_manager: {
    label: "Project Manager",
    headline: "Project delivery",
    tagline: "Programme, approvals, tasks and spend for your assigned projects.",
    sidebarMenus: [
      "dashboard",
      "activity",
      "projects",
      "tasks",
      "calendar",
      "drawings",
      "tmi",
      "materials",
      "inventory",
      "finance",
      "reports",
      "documents",
      "notifications",
      "help",
    ],
    dashboardWidgets: [
      "myProjects",
      "pendingApprovals",
      "openTasks",
      "committedSpend",
      "programme",
      "approvalsQueue",
      "projectHealth",
    ],
  },
  site_engineer: {
    label: "Site Engineer",
    headline: "Site execution",
    tagline: "Today's tasks, inspections, drawings to review and open NCRs.",
    sidebarMenus: [
      "dashboard",
      "tasks",
      "calendar",
      "drawings",
      "tmi",
      "inventory",
      "documents",
      "notifications",
      "help",
    ],
    dashboardWidgets: [
      "myTasks",
      "openNcrs",
      "drawingsToReview",
      "siteAttendance",
      "todayWork",
      "ncrList",
    ],
  },
  vendor: {
    label: "Vendor",
    headline: "Orders & deliveries",
    tagline: "Your purchase orders, deliveries, invoices and drawings to upload.",
    sidebarMenus: [
      "dashboard",
      "projects",
      "drawings",
      "inventory",
      "documents",
      "notifications",
      "help",
    ],
    dashboardWidgets: [
      "openPOs",
      "deliveriesDue",
      "pendingInvoices",
      "drawingsToUpload",
      "poTable",
    ],
  },
  hr_manager: {
    label: "HR Manager",
    headline: "People operations",
    tagline: "Headcount, attendance, leave, onboarding and payroll for this organization.",
    sidebarMenus: [
      "dashboard",
      "hr",
      "users",
      "calendar",
      "documents",
      "reports",
      "notifications",
      "help",
    ],
    dashboardWidgets: [
      "hrHeadcount",
      "hrAttendance",
      "hrLeave",
      "hrOpenRoles",
      "hrOnboarding",
      "hrPayroll",
      "leaveQueue",
      "siteManpower",
    ],
  },
};

export function getRoleExperience(user) {
  const slug = user?.role || user?.roles?.[0]?.slug || "viewer";
  const catalog = ROLE_EXPERIENCE[slug] || {
    label: user?.title || "User",
    headline: "Workspace",
    tagline: "Your assigned modules.",
    sidebarMenus: ["dashboard", "help"],
    dashboardWidgets: ["recentActivity"],
  };

  const menus = user?.sidebarMenus?.length ? user.sidebarMenus : catalog.sidebarMenus;
  const widgets = user?.dashboardWidgets?.length ? user.dashboardWidgets : catalog.dashboardWidgets;

  return { slug, ...catalog, sidebarMenus: menus, dashboardWidgets: widgets };
}

export function hasWidget(experience, id) {
  return experience.dashboardWidgets.includes(id);
}
