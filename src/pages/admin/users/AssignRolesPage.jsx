import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ShieldPlus, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { useUser, useAssignUserRole, useRevokeUserRole } from "@/hooks/useUsersApi";
import { useRoles } from "@/hooks/useRolesApi";

function useOrganizationsList() {
  return useQuery({ queryKey: ["organizations"], queryFn: () => apiClient.get("/organizations") });
}

function useSocietiesList(organizationId) {
  return useQuery({
    queryKey: ["societies", organizationId],
    queryFn: () => apiClient.get(`/societies?organizationId=${organizationId}`),
    enabled: !!organizationId,
  });
}

export default function AssignRolesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuth();
  const canEdit = hasAnyPermission(["user.edit", "users.manage"]);

  const { data: u, isLoading } = useUser(id);
  const { data: rolesData } = useRoles({ limit: 100 });
  const roles = rolesData?.items ?? [];
  const assignRole = useAssignUserRole();
  const revokeRole = useRevokeUserRole();

  const [roleId, setRoleId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [societyId, setSocietyId] = useState("");

  const { data: organizations = [] } = useOrganizationsList();
  const { data: societies = [] } = useSocietiesList(orgId);

  const role = roles.find((r) => r._id === roleId);
  const needsOrg = role && role.dataScope !== "global";
  const needsSociety = role && ["society", "project", "building"].includes(role.dataScope);

  if (!canEdit) {
    return (
      <PageContainer>
        <SectionCard title="Not authorized">
          <p className="text-[13px] text-muted-foreground">Your role does not have permission to assign roles.</p>
        </SectionCard>
      </PageContainer>
    );
  }

  if (!isLoading && !u) {
    return (
      <PageContainer>
        <SectionCard title="User not found">
          <Link to="/app/users" className="text-primary text-[13px]">Back to users</Link>
        </SectionCard>
      </PageContainer>
    );
  }

  const onAssign = async () => {
    if (!roleId) { toast.error("Choose a role"); return; }
    if (needsOrg && !orgId) { toast.error("Choose an organization for this role's scope"); return; }
    if (needsSociety && !societyId) { toast.error("Choose a society for this role's scope"); return; }
    try {
      await assignRole.mutateAsync({
        id,
        role: roleId,
        organization: needsOrg ? orgId : null,
        society: needsSociety ? societyId : null,
      });
      toast.success("Role assigned");
      setRoleId(""); setOrgId(""); setSocietyId("");
    } catch (err) {
      toast.error(err.message || "Couldn't assign role");
    }
  };

  const onRevoke = async (assignment) => {
    try {
      await revokeRole.mutateAsync({ id, userRoleId: assignment._id });
      toast.success("Role removed");
    } catch (err) {
      toast.error(err.message || "Couldn't remove role");
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link to={`/app/users/${id}`} className="hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> {u?.name ?? "User"}
        </Link>
        <span>/</span>
        <span className="text-foreground">Assign roles</span>
      </div>

      <PageHeader
        title={`Assign roles · ${u?.name ?? ""}`}
        description="Grant a role, scoped to an organization/society where the role requires it."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/app/users/${id}`)}>
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Button>
        }
      />

      <SectionCard title="Add a role assignment">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={roleId} onValueChange={(v) => { setRoleId(v); setOrgId(""); setSocietyId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {roles.filter((r) => r.isActive).map((r) => <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {needsOrg && (
            <div className="space-y-1.5">
              <Label>Organization</Label>
              <Select value={orgId} onValueChange={(v) => { setOrgId(v); setSocietyId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select an organization" /></SelectTrigger>
                <SelectContent>
                  {organizations.map((o) => <SelectItem key={o._id} value={o._id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {needsSociety && (
            <div className="space-y-1.5">
              <Label>Society</Label>
              <Select value={societyId} onValueChange={setSocietyId} disabled={!orgId}>
                <SelectTrigger><SelectValue placeholder="Select a society" /></SelectTrigger>
                <SelectContent>
                  {societies.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button size="sm" className="gap-1.5" onClick={onAssign} disabled={assignRole.isPending}>
            <ShieldPlus className="h-3.5 w-3.5" /> Assign role
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Current role assignments">
        {(u?.roleAssignments || []).length === 0 ? (
          <EmptyState icon={ShieldPlus} title="No roles assigned yet" description="Use the form above to grant this user a role." />
        ) : (
          <ul className="divide-y divide-border -m-5">
            {u.roleAssignments.map((a) => (
              <li key={a._id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-foreground">{a.role?.name}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">
                    {[a.organization?.name, a.society?.name, a.project?.name].filter(Boolean).join(" · ") || "Global scope"}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRevoke(a)}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </PageContainer>
  );
}
