import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye, X, UserCog,
  Lock, Unlock, KeyRound, LogOut as LogOutIcon, Users2, ShieldCheck, UserX,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUsers, useDeleteUser, useLockUser, useUnlockUser, useResetUserPassword, useForceLogoutUser,
} from "@/hooks/useUsersApi";
import { useRoles } from "@/hooks/useRolesApi";
import { initials, formatDate } from "@/utils/format";

const STATUS_TONE = { active: "success", inactive: "neutral", locked: "destructive" };

export default function UsersListPage() {
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuth();
  const canCreate = hasAnyPermission(["user.create", "users.manage"]);
  const canEdit = hasAnyPermission(["user.edit", "users.manage"]);
  const canDelete = hasAnyPermission(["user.delete", "users.manage"]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [resetResult, setResetResult] = useState(null);

  const rolesQuery = useRoles({ limit: 100 });
  const roleOptions = rolesQuery.data?.items ?? [];

  const params = {
    page, limit: 10, q: q || undefined,
    status: status === "all" ? undefined : status,
    role: role === "all" ? undefined : role,
  };
  const { data, isLoading } = useUsers(params);
  const items = data?.items ?? [];
  const totalPages = data?.pages ?? 1;
  const total = data?.total ?? 0;

  const deleteUser = useDeleteUser();
  const lockUser = useLockUser();
  const unlockUser = useUnlockUser();
  const resetPassword = useResetUserPassword();
  const forceLogout = useForceLogoutUser();

  const resetFilters = () => { setQ(""); setStatus("all"); setRole("all"); setPage(1); };
  const filtersActive = q || status !== "all" || role !== "all";

  const onDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteUser.mutateAsync(toDelete._id);
      toast.success(`Deleted ${toDelete.name}`);
    } catch (err) {
      toast.error(err.message || "Couldn't delete user");
    } finally {
      setToDelete(null);
    }
  };

  const onToggleLock = async (u) => {
    try {
      if (u.status === "locked") {
        await unlockUser.mutateAsync(u._id);
        toast.success(`${u.name} unlocked`);
      } else {
        await lockUser.mutateAsync(u._id);
        toast.success(`${u.name} locked`);
      }
    } catch (err) {
      toast.error(err.message || "Couldn't update lock status");
    }
  };

  const onResetPassword = async (u) => {
    try {
      const result = await resetPassword.mutateAsync(u._id);
      setResetResult({ user: u, password: result.temporaryPassword });
    } catch (err) {
      toast.error(err.message || "Couldn't reset password");
    }
  };

  const onForceLogout = async (u) => {
    try {
      await forceLogout.mutateAsync(u._id);
      toast.success(`Signed ${u.name} out everywhere`);
    } catch (err) {
      toast.error(err.message || "Couldn't force logout");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="User Management"
        description="Create users, assign roles, and control account access."
        actions={canCreate && (
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/app/users/new")}>
            <Plus className="h-3.5 w-3.5" /> New user
          </Button>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total users" value={String(total)} icon={Users2} tone="primary" />
        <StatCard label="On this page" value={String(items.length)} icon={ShieldCheck} tone="info" />
        <StatCard label="Locked (page)" value={String(items.filter((u) => u.status === "locked").length)} icon={Lock} tone="warning" />
        <StatCard label="Inactive (page)" value={String(items.filter((u) => u.status === "inactive").length)} icon={UserX} tone="neutral" />
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search by name, email or employee ID"
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="h-9 min-w-[130px] text-[12.5px]">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
              <SelectTrigger className="h-9 min-w-[150px] text-[12.5px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roleOptions.map((r) => <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground text-[13px]">Loading users…</div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={UserCog}
              title="No users match your filters"
              description="Try adjusting the search or filters, or create a new user."
              action={filtersActive
                ? <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
                : canCreate && <Button size="sm" onClick={() => navigate("/app/users/new")} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New user</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left font-medium px-5 py-2.5">User</th>
                  <th className="text-left font-medium px-2 py-2.5">Designation</th>
                  <th className="text-left font-medium px-2 py-2.5">Roles</th>
                  <th className="text-left font-medium px-2 py-2.5">Status</th>
                  <th className="text-left font-medium px-2 py-2.5">Last login</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u._id} className="border-t border-border hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">{initials(u.name)}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <Link to={`/app/users/${u._id}`} className="font-semibold text-foreground hover:text-primary truncate block">{u.name}</Link>
                          <div className="text-[11.5px] text-muted-foreground truncate">{u.email}{u.employeeId ? ` · ${u.employeeId}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{u.title || "—"}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(u.roleAssignments || []).length === 0
                          ? <span className="text-muted-foreground">No roles</span>
                          : u.roleAssignments.map((a) => (
                            <span key={a._id} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{a.role?.name}</span>
                          ))}
                      </div>
                    </td>
                    <td className="px-2 py-3"><StatusBadge tone={STATUS_TONE[u.status] ?? "neutral"}>{u.status}</StatusBadge></td>
                    <td className="px-2 py-3 text-muted-foreground">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <RowActions
                        u={u} canEdit={canEdit} canDelete={canDelete}
                        onDelete={setToDelete} onToggleLock={onToggleLock}
                        onResetPassword={onResetPassword} onForceLogout={onForceLogout}
                      />
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
            <AlertDialogTitle>Delete {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the user and all of their role assignments.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resetResult} onOpenChange={(open) => !open && setResetResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password reset for {resetResult?.user?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Share this temporary password securely — it won't be shown again. They'll be asked to change it on next sign-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-[14px] text-center select-all">
            {resetResult?.password}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResetResult(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function RowActions({ u, canEdit, canDelete, onDelete, onToggleLock, onResetPassword, onForceLogout }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => navigate(`/app/users/${u._id}`)}>
          <Eye className="h-3.5 w-3.5 mr-2" /> View details
        </DropdownMenuItem>
        {canEdit && (
          <>
            <DropdownMenuItem onClick={() => navigate(`/app/users/${u._id}/edit`)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/app/users/${u._id}/roles`)}>
              <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Manage roles
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleLock(u)}>
              {u.status === "locked" ? <Unlock className="h-3.5 w-3.5 mr-2" /> : <Lock className="h-3.5 w-3.5 mr-2" />}
              {u.status === "locked" ? "Unlock account" : "Lock account"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(u)}>
              <KeyRound className="h-3.5 w-3.5 mr-2" /> Reset password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onForceLogout(u)}>
              <LogOutIcon className="h-3.5 w-3.5 mr-2" /> Force logout
            </DropdownMenuItem>
          </>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(u)}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
