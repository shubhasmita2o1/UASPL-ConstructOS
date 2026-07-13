import { Fragment, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Lock, Grid3x3 } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles, useUpdateRolePermissions } from "@/hooks/useRolesApi";
import { usePermissions } from "@/hooks/usePermissionsApi";

export default function PermissionMatrixPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("permissions.manage");

  const { data: rolesData, isLoading: rolesLoading } = useRoles({ limit: 100 });
  const roles = rolesData?.items ?? [];
  const { data: permData, isLoading: permsLoading } = usePermissions();
  const grouped = permData?.grouped || {};
  const moduleGroups = useMemo(() => Object.entries(grouped), [grouped]);

  const updatePermissions = useUpdateRolePermissions();

  if (!canManage) {
    return (
      <PageContainer>
        <SectionCard title="Not authorized">
          <p className="text-[13px] text-muted-foreground">Your role does not have permission to view the permission matrix.</p>
        </SectionCard>
      </PageContainer>
    );
  }

  const toggleCell = async (role, permissionId) => {
    if (role.isSystem) return;
    const current = role.permissions.map((p) => p._id || p);
    const next = current.includes(permissionId) ? current.filter((p) => p !== permissionId) : [...current, permissionId];
    try {
      await updatePermissions.mutateAsync({ id: role._id, permissions: next });
    } catch (err) {
      toast.error(err.message || "Couldn't update permission");
    }
  };

  const loading = rolesLoading || permsLoading;

  return (
    <PageContainer>
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link to="/app/roles" className="hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Roles
        </Link>
        <span>/</span>
        <span className="text-foreground">Permission matrix</span>
      </div>

      <PageHeader title="Permission matrix" description="Every role against every permission — toggle a cell to grant or revoke it instantly." />

      <SectionCard bodyClassName="p-0">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground text-[13px]">Loading…</div>
        ) : roles.length === 0 || moduleGroups.length === 0 ? (
          <div className="p-5"><EmptyState icon={Grid3x3} title="Nothing to show yet" description="Create roles and permissions first." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-[12.5px] border-collapse w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-background text-left font-medium px-4 py-2.5 border-b border-r border-border min-w-[220px]">Permission</th>
                  {roles.map((role) => (
                    <th key={role._id} className="text-center font-medium px-3 py-2.5 border-b border-border min-w-[110px]">
                      <div className="flex items-center justify-center gap-1">
                        {role.name}
                        {role.isSystem && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {moduleGroups.map(([module, perms]) => (
                  <Fragment key={module}>
                    <tr className="bg-muted/40">
                      <td colSpan={roles.length + 1} className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border sticky left-0">
                        {module}
                      </td>
                    </tr>
                    {perms.map((perm) => (
                      <tr key={perm._id} className="hover:bg-accent/30">
                        <td className="sticky left-0 bg-background px-4 py-2 border-b border-r border-border truncate">{perm.label}</td>
                        {roles.map((role) => {
                          const checked = role.permissions.some((p) => (p._id || p) === perm._id) || role.permissions.includes("*");
                          return (
                            <td key={role._id} className="text-center px-3 py-2 border-b border-border">
                              <Checkbox
                                checked={checked}
                                disabled={role.isSystem}
                                onCheckedChange={() => toggleCell(role, perm._id)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
}
