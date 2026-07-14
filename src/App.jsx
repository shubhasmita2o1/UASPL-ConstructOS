import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import OrganizationSelectPage from "@/pages/auth/OrganizationSelectPage";
import SocietySelectPage from "@/pages/auth/SocietySelectPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import NotFoundPage from "@/pages/NotFoundPage";
import DashboardPage from "@/pages/DashboardPage";
import ModulePlaceholderPage from "@/pages/ModulePlaceholderPage";
import ProjectsListPage from "@/pages/project/ProjectsListPage";
import ProjectDetailsPage from "@/pages/project/ProjectDetailsPage";
import ProjectFormPage from "@/pages/project/ProjectFormPage";
import OrganizationsListPage from "@/pages/organizations/OrganizationsListPage";
import OrganizationDetailsPage from "@/pages/organizations/OrganizationDetailsPage";
import OrganizationFormPage from "@/pages/organizations/OrganizationFormPage";
import TasksPage from "@/pages/tasks/TasksPage";
import TaskDetailsPage from "@/pages/tasks/TaskDetailsPage";
import CalendarPage from "@/pages/calender/CalendarPage";
import SocietiesListPage from "@/pages/societies/SocietiesListPage";
import SocietyOnboardingPage from "@/pages/societies/SocietyOnboardingPage";
import SocietyDetailsPage from "@/pages/societies/SocietyDetailsPage";
import ActivityCenterPage from "@/pages/activity/ActivityCenterPage";
import UsersListPage from "@/pages/admin/users/UsersListPage";
import UserFormPage from "@/pages/admin/users/UserFormPage";
import UserDetailsPage from "@/pages/admin/users/UserDetailsPage";
import AssignRolesPage from "@/pages/admin/users/AssignRolesPage";
import RolesListPage from "@/pages/admin/roles/RolesListPage";
import RoleFormPage from "@/pages/admin/roles/RoleFormPage";
import RoleDetailsPage from "@/pages/admin/roles/RoleDetailsPage";
import AssignPermissionsPage from "@/pages/admin/roles/AssignPermissionsPage";
import PermissionMatrixPage from "@/pages/admin/roles/PermissionMatrixPage";
import { FLAT_NAV } from "@/constants/navigation";

const WIRED_PATHS = [
  "/app/dashboard", "/app/projects", "/app/organizations", "/app/tasks",
  "/app/calendar", "/app/societies", "/app/activity", "/app/roles", "/app/users",
];

function FullScreenLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}

function RequireWorkspace() {
  const { org, society } = useWorkspace();
  if (!org) return <Navigate to="/auth/select-organization" replace />;
  if (!society) return <Navigate to="/auth/select-society" replace />;
  return <Outlet />;
}

function RequirePermission({ anyOf }) {
  const { hasAnyPermission } = useAuth();
  if (!hasAnyPermission(anyOf)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

      <Route element={<RequireAuth />}>
        <Route element={<AuthLayout />}>
          <Route path="/auth/select-organization" element={<OrganizationSelectPage />} />
          <Route path="/auth/select-society" element={<SocietySelectPage />} />
        </Route>

        <Route element={<RequireWorkspace />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="activity" element={<ActivityCenterPage />} />

            <Route element={<RequirePermission anyOf={["project.view"]} />}>
              <Route path="projects" element={<ProjectsListPage />} />
              <Route path="projects/new" element={<ProjectFormPage mode="create" />} />
              <Route path="projects/:id" element={<ProjectDetailsPage />} />
              <Route path="projects/:id/edit" element={<ProjectFormPage mode="edit" />} />
            </Route>
            <Route element={<RequirePermission anyOf={["organization.view"]} />}>
              <Route path="organizations" element={<OrganizationsListPage />} />
              <Route path="organizations/new" element={<OrganizationFormPage mode="create" />} />
              <Route path="organizations/:id" element={<OrganizationDetailsPage />} />
              <Route path="organizations/:id/edit" element={<OrganizationFormPage mode="edit" />} />
            </Route>
            <Route element={<RequirePermission anyOf={["society.view"]} />}>
              <Route path="societies" element={<SocietiesListPage />} />
              <Route path="societies/onboard" element={<SocietyOnboardingPage mode="create" />} />
              <Route path="societies/:id" element={<SocietyDetailsPage />} />
              <Route path="societies/:id/edit" element={<SocietyOnboardingPage mode="edit" />} />
            </Route>
            <Route element={<RequirePermission anyOf={["task.view"]} />}>
              <Route path="tasks" element={<TasksPage />} />
              <Route path="tasks/:id" element={<TaskDetailsPage />} />
            </Route>

            <Route element={<RequirePermission anyOf={["role.manage", "role.view", "roles.manage", "permissions.manage"]} />}>
              <Route path="roles" element={<RolesListPage />} />
              <Route path="roles/matrix" element={<PermissionMatrixPage />} />
              <Route path="roles/new" element={<RoleFormPage mode="create" />} />
              <Route path="roles/:id" element={<RoleDetailsPage />} />
              <Route path="roles/:id/edit" element={<RoleFormPage mode="edit" />} />
              <Route path="roles/:id/permissions" element={<AssignPermissionsPage />} />
            </Route>
            <Route element={<RequirePermission anyOf={["user.view", "user.create", "user.edit", "users.manage"]} />}>
              <Route path="users" element={<UsersListPage />} />
              <Route path="users/new" element={<UserFormPage mode="create" />} />
              <Route path="users/:id" element={<UserDetailsPage />} />
              <Route path="users/:id/edit" element={<UserFormPage mode="edit" />} />
              <Route path="users/:id/roles" element={<AssignRolesPage />} />
            </Route>

            {FLAT_NAV.filter((n) => !WIRED_PATHS.includes(n.to)).map((n) => (
              n.perm ? (
                <Route key={n.to} element={<RequirePermission anyOf={[].concat(n.perm)} />}>
                  <Route path={n.to.replace("/app/", "")} element={<ModulePlaceholderPage title={n.label} icon={n.icon} />} />
                </Route>
              ) : (
                <Route
                  key={n.to}
                  path={n.to.replace("/app/", "")}
                  element={<ModulePlaceholderPage title={n.label} icon={n.icon} />}
                />
              )
            ))}
          </Route>
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
