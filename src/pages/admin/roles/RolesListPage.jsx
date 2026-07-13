import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Search, MoreHorizontal, Pencil, Copy, Trash2, Eye, Lock, Grid3x3, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles, useDuplicateRole, useUpdateRoleStatus, useDeleteRole } from "@/hooks/useRolesApi";

export default function RolesListPage() {
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuth();
  const canManage = hasAnyPermission(["role.manage", "roles.manage"]);
  const canViewMatrix = hasAnyPermission(["permissions.manage"]);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading } = useRoles({ page, limit: 10, q: q || undefined });
  const items = data?.items ?? [];
  const totalPages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  const duplicateRole = useDuplicateRole();
  const updateStatus = useUpdateRoleStatus();
  const deleteRole = useDeleteRole();

  const onDuplicate = async (role) => {
    try {
      await duplicateRole.mutateAsync(role._id);
      toast.success(`Duplicated "${role.name}"`);
    } catch (err) {
      toast.error(err.message || "Couldn't duplicate role");
    }
  };

  const onToggleStatus = async (role) => {
    try {
      await updateStatus.mutateAsync({ id: role._id, isActive: !role.isActive });
    } catch (err) {
      toast.error(err.message || "Couldn't update role status");
    }
  };

  const onDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteRole.mutateAsync(toDelete._id);
      toast.success("Role deleted");
    } catch (err) {
      toast.error(err.message || "Couldn't delete role");
    } finally {
      setToDelete(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Roles & Permissions"
        description="Define what each role can see and do across ConstructOS."
        actions={
          <>
            {canViewMatrix && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/app/roles/matrix")}>
                <Grid3x3 className="h-3.5 w-3.5" /> Permission matrix
              </Button>
            )}
            {canManage && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/app/roles/new")}>
                <Plus className="h-3.5 w-3.5" /> New role
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total roles" value={String(total)} icon={ShieldCheck} tone="primary" />
        <StatCard label="System roles" value={String(items.filter((r) => r.isSystem).length)} icon={Lock} tone="info" />
        <StatCard label="Active (page)" value={String(items.filter((r) => r.isActive).length)} icon={ShieldCheck} tone="success" />
        <StatCard label="Disabled (page)" value={String(items.filter((r) => !r.isActive).length)} icon={ShieldCheck} tone="neutral" />
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search roles by name or description" className="pl-9 h-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground text-[13px]">Loading roles…</div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={ShieldCheck}
              title="No roles match your search"
              description="Try a different search, or create a new role."
              action={canManage && <Button size="sm" onClick={() => navigate("/app/roles/new")} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New role</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left font-medium px-5 py-2.5">Role</th>
                  <th className="text-left font-medium px-2 py-2.5">Data scope</th>
                  <th className="text-right font-medium px-2 py-2.5">Permissions</th>
                  <th className="text-left font-medium px-2 py-2.5">Status</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((role) => (
                  <tr key={role._id} className="border-t border-border hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/app/roles/${role._id}`} className="font-semibold text-foreground hover:text-primary">{role.name}</Link>
                        {role.isSystem && <StatusBadge tone="neutral" dot={false} className="!text-[10px]"><Lock className="h-2.5 w-2.5" /> System</StatusBadge>}
                      </div>
                      {role.description && <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate max-w-md">{role.description}</div>}
                    </td>
                    <td className="px-2 py-3 capitalize text-muted-foreground">{role.dataScope}</td>
                    <td className="px-2 py-3 text-right tabular-nums font-medium">{role.permissions?.length ?? 0}</td>
                    <td className="px-2 py-3"><StatusBadge tone={role.isActive ? "success" : "neutral"}>{role.isActive ? "Active" : "Disabled"}</StatusBadge></td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/app/roles/${role._id}`)}><Eye className="h-3.5 w-3.5 mr-2" /> View details</DropdownMenuItem>
                          {canManage && !role.isSystem && (
                            <DropdownMenuItem onClick={() => navigate(`/app/roles/${role._id}/edit`)}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                          )}
                          {canManage && (
                            <DropdownMenuItem onClick={() => onDuplicate(role)}><Copy className="h-3.5 w-3.5 mr-2" /> Duplicate</DropdownMenuItem>
                          )}
                          {canManage && !role.isSystem && (
                            <>
                              <DropdownMenuItem onClick={() => onToggleStatus(role)}>{role.isActive ? "Disable" : "Enable"}</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(role)}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-[12.5px]">
            <div className="text-muted-foreground">Page {page} of {totalPages} · {total} total</div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </SectionCard>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{toDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This role will be permanently removed. Users assigned to it must not have active assignments.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
