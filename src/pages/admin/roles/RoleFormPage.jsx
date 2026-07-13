import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, Save, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, useCreateRole, useUpdateRole } from "@/hooks/useRolesApi";
import { FLAT_NAV } from "@/constants/navigation";

const DATA_SCOPES = ["global", "organization", "society", "project", "building"];

const DASHBOARD_WIDGETS = [
  ["stat.activeProjects", "Active projects"],
  ["stat.pendingApprovals", "Pending approvals"],
  ["stat.openNcrs", "Open NCRs"],
  ["stat.committedSpend", "Committed spend"],
  ["programmePerformance", "Programme performance chart"],
  ["costBreakdown", "Cost breakdown chart"],
  ["projectHealth", "Project health table"],
  ["approvalsQueue", "Approvals queue"],
  ["monthlySpend", "Monthly spend chart"],
  ["recentActivity", "Recent activity feed"],
  ["teamPulse", "Team pulse"],
];

const EMPTY = { name: "", description: "", dataScope: "project", sidebarMenus: [], dashboardWidgets: [] };

export default function RoleFormPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasAnyPermission } = useAuth();
  const canManage = hasAnyPermission(["role.manage", "roles.manage"]);

  const { data: existing, isLoading } = useRole(mode === "edit" ? id : undefined);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === "edit" && existing) {
      setForm({
        name: existing.name ?? "",
        description: existing.description ?? "",
        dataScope: existing.dataScope ?? "project",
        sidebarMenus: existing.sidebarMenus ?? [],
        dashboardWidgets: existing.dashboardWidgets ?? [],
      });
    }
  }, [mode, existing]);

  const toggle = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Role name is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const isSystem = mode === "edit" && existing?.isSystem;

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields"); return; }
    try {
      if (mode === "create") {
        const created = await createRole.mutateAsync({ ...form, permissions: [] });
        toast.success(`Created ${created.name}`);
        navigate(`/app/roles/${created._id}`);
      } else {
        await updateRole.mutateAsync({ id, ...form });
        toast.success("Role updated");
        navigate(`/app/roles/${id}`);
      }
    } catch (err) {
      toast.error(err.message || "Couldn't save role");
    }
  };

  if (!canManage) {
    return (
      <PageContainer>
        <SectionCard title="Not authorized">
          <p className="text-[13px] text-muted-foreground">Your role does not have permission to {mode} roles.</p>
        </SectionCard>
      </PageContainer>
    );
  }

  if (mode === "edit" && !isLoading && !existing) {
    return (
      <PageContainer>
        <SectionCard title="Role not found">
          <Link to="/app/roles" className="text-primary text-[13px]">Back to roles</Link>
        </SectionCard>
      </PageContainer>
    );
  }

  const saving = createRole.isPending || updateRole.isPending;

  return (
    <PageContainer>
      <PageHeader
        title={mode === "create" ? "New role" : `Edit · ${existing?.name ?? ""}`}
        description="Permissions are managed separately from the role's details page."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Button>
        }
      />

      {isSystem && (
        <SectionCard title="System role" className="border-warning/30">
          <p className="text-[13px] text-muted-foreground">This is a built-in system role — its name, scope and description can't be changed. Duplicate it to create a customizable variant.</p>
        </SectionCard>
      )}

      <form onSubmit={submit} className="space-y-6">
        <SectionCard title="Details" description="Name, description and default data scope.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Role name" error={errors.name} required>
              <Input value={form.name} disabled={isSystem} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Regional Manager" />
            </Field>
            <Field label="Data scope">
              <Select value={form.dataScope} disabled={isSystem} onValueChange={(v) => setForm((f) => ({ ...f, dataScope: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATA_SCOPES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Description" className="md:col-span-2">
              <Textarea rows={2} value={form.description} disabled={isSystem} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this role is for" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Sidebar access" description="Menus this role can see (used by a future sidebar-filtering pass).">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
            {FLAT_NAV.map((item) => (
              <label key={item.to} className="flex items-center gap-2 text-[13px] cursor-pointer">
                <Checkbox checked={form.sidebarMenus.includes(item.to)} onCheckedChange={() => toggle("sidebarMenus", item.to)} />
                {item.label}
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Dashboard widgets" description="Widgets this role can see (used by a future dashboard-gating pass).">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {DASHBOARD_WIDGETS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-[13px] cursor-pointer">
                <Checkbox checked={form.dashboardWidgets.includes(key)} onCheckedChange={() => toggle("dashboardWidgets", key)} />
                {label}
              </label>
            ))}
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button type="submit" size="sm" className="gap-1.5" disabled={saving}>
            <Save className="h-3.5 w-3.5" /> {mode === "create" ? "Create role" : "Save changes"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

function Field({ label, children, error, required, className }) {
  return (
    <div className={className}>
      <Label className="text-[12.5px] font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="text-[11.5px] text-destructive mt-1">{error}</p>}
    </div>
  );
}
