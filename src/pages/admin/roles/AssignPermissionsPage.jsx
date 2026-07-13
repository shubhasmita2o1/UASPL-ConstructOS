import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Save, Lock } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, useUpdateRolePermissions } from "@/hooks/useRolesApi";
import { usePermissions } from "@/hooks/usePermissionsApi";

export default function AssignPermissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuth();
  const canManage = hasAnyPermission(["role.manage", "roles.manage", "permissions.manage"]);

  const { data: role, isLoading } = useRole(id);
  const { data: permData } = usePermissions();
  const grouped = permData?.grouped || {};
  const updatePermissions = useUpdateRolePermissions();

  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (role) setSelected(role.permissions.map((p) => p._id || p));
  }, [role]);

  const moduleGroups = useMemo(() => Object.entries(grouped), [grouped]);

  const toggle = (permId) => {
    setSelected((prev) => (prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]));
  };

  const toggleModule = (perms, checkAll) => {
    const ids = perms.map((p) => p._id);
    setSelected((prev) => (checkAll ? [...new Set([...prev, ...ids])] : prev.filter((p) => !ids.includes(p))));
  };

  const onSave = async () => {
    try {
      await updatePermissions.mutateAsync({ id, permissions: selected });
      toast.success("Permissions updated");
      navigate(`/app/roles/${id}`);
    } catch (err) {
      toast.error(err.message || "Couldn't update permissions");
    }
  };

  if (!canManage) {
    return (
      <PageContainer>
        <SectionCard title="Not authorized">
          <p className="text-[13px] text-muted-foreground">Your role does not have permission to manage permissions.</p>
        </SectionCard>
      </PageContainer>
    );
  }

  if (!isLoading && !role) {
    return (
      <PageContainer>
        <SectionCard title="Role not found">
          <Link to="/app/roles" className="text-primary text-[13px]">Back to roles</Link>
        </SectionCard>
      </PageContainer>
    );
  }

  if (role?.isSystem) {
    return (
      <PageContainer>
        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <Link to={`/app/roles/${id}`} className="hover:text-foreground inline-flex items-center gap-1"><ChevronLeft className="h-3.5 w-3.5" /> {role.name}</Link>
        </div>
        <SectionCard title="System role permissions are fixed">
          <p className="text-[13px] text-muted-foreground flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Duplicate this role to create a customizable copy with editable permissions.</p>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link to={`/app/roles/${id}`} className="hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> {role?.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Assign permissions</span>
      </div>

      <PageHeader
        title={`Assign permissions · ${role?.name ?? ""}`}
        description="Select the permissions this role should grant, grouped by module."
        actions={
          <Button size="sm" className="gap-1.5" onClick={onSave} disabled={updatePermissions.isPending}>
            <Save className="h-3.5 w-3.5" /> Save permissions
          </Button>
        }
      />

      <div className="space-y-4">
        {moduleGroups.map(([module, perms]) => {
          const allChecked = perms.every((p) => selected.includes(p._id));
          return (
            <SectionCard
              key={module}
              title={module}
              action={
                <label className="flex items-center gap-2 text-[12px] text-muted-foreground cursor-pointer">
                  <Checkbox checked={allChecked} onCheckedChange={(v) => toggleModule(perms, !!v)} /> Select all
                </label>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {perms.map((p) => (
                  <label key={p._id} className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <Checkbox checked={selected.includes(p._id)} onCheckedChange={() => toggle(p._id)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </SectionCard>
          );
        })}
      </div>
    </PageContainer>
  );
}
