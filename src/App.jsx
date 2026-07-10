import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
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
import { FLAT_NAV } from "@/constants/navigation";

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}

function RequireWorkspace() {
  const { org, society } = useWorkspace();
  if (!org) return <Navigate to="/auth/select-organization" replace />;
  if (!society) return <Navigate to="/auth/select-society" replace />;
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
            <Route path="projects" element={<ProjectsListPage />} />
            <Route path="projects/new" element={<ProjectFormPage mode="create" />} />
            <Route path="projects/:id" element={<ProjectDetailsPage />} />
            <Route path="projects/:id/edit" element={<ProjectFormPage mode="edit" />} />
            <Route path="organizations" element={<OrganizationsListPage />} />
            <Route path="organizations/new" element={<OrganizationFormPage mode="create" />} />
            <Route path="organizations/:id" element={<OrganizationDetailsPage />} />
            <Route path="organizations/:id/edit" element={<OrganizationFormPage mode="edit" />} />
            {FLAT_NAV.filter((n) => !["/app/dashboard", "/app/projects", "/app/organizations"].includes(n.to)).map((n) => (
              <Route
                key={n.to}
                path={n.to.replace("/app/", "")}
                element={<ModulePlaceholderPage title={n.label} icon={n.icon} />}
              />
            ))}
          </Route>
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
