import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Pencil, Trash2, Lock, Unlock, KeyRound, LogOut as LogOutIcon,
  ShieldCheck, Mail, Phone, IdCard, CalendarClock, Clock, ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUser, useDeleteUser, useLockUser, useUnlockUser, useResetUserPassword, useForceLogoutUser, useRevokeUserRole,
} from "@/hooks/useUsersApi";
import { useAuditLogs } from "@/hooks/useAuditLogsApi";
import { initials, formatDate, formatDateTime } from "@/utils/format";

const STATUS_TONE = { active: "success", inactive: "neutral", locked: "destructive" };

export default function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasAnyPermission, user: currentUser } = useAuth();
  const canEdit = hasAnyPermission(["user.edit", "users.manage"]);
  const canDelete = hasAnyPermission(["user.delete", "users.manage"]);

  const { data: u, isLoading } = useUser(id);
  const { data: auditData } = useAuditLogs({ targetType: "User", targetId: id, limit: 20 });

  const deleteUser = useDeleteUser();
  const lockUser = useLockUser();
  const unlockUser = useUnlockUser();
  const resetPassword = useResetUserPassword();
  const forceLogout = useForceLogoutUser();
  const revokeRole = useRevokeUserRole();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  if (isLoading) {
    return <PageContainer><SectionCard><p className="text-[13px] text-muted-foreground">Loading…</p></SectionCard></PageContainer>;
  }

  if (!u) {
    return (
      <PageContainer>
        <SectionCard title="User not found">
          <Link to="/app/users" className="text-primary text-[13px]">Back to users</Link>
        </SectionCard>
      </PageContainer>
    );
  }

  const isSelf = String(u._id) === String(currentUser?.id);

  const onToggleLock = async () => {
    try {
      if (u.status === "locked") { await unlockUser.mutateAsync(u._id); toast.success("Account unlocked"); }
      else { await lockUser.mutateAsync(u._id); toast.success("Account locked"); }
    } catch (err) {
      toast.error(err.message || "Couldn't update lock status");
    }
  };

  const onResetPassword = async () => {
    try {
      const result = await resetPassword.mutateAsync(u._id);
      setResetResult(result.temporaryPassword);
    } catch (err) {
      toast.error(err.message || "Couldn't reset password");
    }
  };

  const onForceLogout = async () => {
    try {
      await forceLogout.mutateAsync(u._id);
      toast.success("Signed out everywhere");
    } catch (err) {
      toast.error(err.message || "Couldn't force logout");
    }
  };

  const onDelete = async () => {
    try {
      await deleteUser.mutateAsync(u._id);
      toast.success("User deleted");
      navigate("/app/users");
    } catch (err) {
      toast.error(err.message || "Couldn't delete user");
    }
  };

  const onRevokeRole = async (assignment) => {
    try {
      await revokeRole.mutateAsync({ id: u._id, userRoleId: assignment._id });
      toast.success("Role removed");
    } catch (err) {
      toast.error(err.message || "Couldn't remove role");
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link to="/app/users" className="hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Users
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{u.name}</span>
      </div>

      <PageHeader
        title={u.name}
        description={u.title || u.email}
        actions={
          <>
            {canEdit && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/app/users/${u._id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/app/users/${u._id}/roles`)}>
                <ShieldCheck className="h-3.5 w-3.5" /> Manage roles
              </Button>
            )}
            {canDelete && !isSelf && (
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </>
        }
      />

      <SectionCard>
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <Avatar className="h-16 w-16"><AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{initials(u.name)}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-semibold text-foreground">{u.name}</h2>
              <StatusBadge tone={STATUS_TONE[u.status] ?? "neutral"}>{u.status}</StatusBadge>
              {u.mustChangePassword && <StatusBadge tone="warning" dot={false}>Must change password</StatusBadge>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-[12.5px]">
              <InfoRow icon={Mail} label={<a className="hover:text-primary" href={`mailto:${u.email}`}>{u.email}</a>} />
              <InfoRow icon={Phone} label={u.phone || "—"} />
              <InfoRow icon={IdCard} label={u.employeeId ? `Employee ID · ${u.employeeId}` : "No employee ID"} />
              <InfoRow icon={CalendarClock} label={`Created ${formatDate(u.createdAt)}`} />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Roles assigned" value={String((u.roleAssignments || []).length)} icon={ShieldCheck} tone="primary" />
        <StatCard label="Last login" value={u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"} icon={Clock} tone="info" />
        <StatCard label="Failed attempts" value={String(u.failedLoginAttempts ?? 0)} icon={Lock} tone="warning" />
        <StatCard label="Status" value={u.status} icon={ShieldCheck} tone={STATUS_TONE[u.status] === "success" ? "success" : STATUS_TONE[u.status] === "destructive" ? "destructive" : "neutral"} />
      </div>

      <SectionCard bodyClassName="p-0">
        <Tabs defaultValue="overview">
          <div className="px-5 pt-4 border-b border-border">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="roles">Roles &amp; Scope</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionCard
                title="Account access"
                description={u.status === "locked" ? "This account is locked and cannot sign in." : "Lock this account to immediately block sign-in."}
                action={canEdit && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggleLock}>
                    {u.status === "locked" ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {u.status === "locked" ? "Unlock account" : "Lock account"}
                  </Button>
                )}
              />
              <ActionCard
                title="Password"
                description="Generate a new temporary password and force a change on next sign-in."
                action={canEdit && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={onResetPassword}>
                    <KeyRound className="h-3.5 w-3.5" /> Reset password
                  </Button>
                )}
              />
              <ActionCard
                title="Active sessions"
                description="Revoke every active session and refresh token for this user."
                action={canEdit && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={onForceLogout}>
                    <LogOutIcon className="h-3.5 w-3.5" /> Force logout
                  </Button>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="roles" className="p-5">
            {(u.roleAssignments || []).length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No roles assigned"
                description="Assign a role to grant this user access."
                action={canEdit && <Button size="sm" onClick={() => navigate(`/app/users/${u._id}/roles`)}>Assign a role</Button>}
              />
            ) : (
              <ul className="divide-y divide-border -m-5">
                {u.roleAssignments.map((a) => (
                  <li key={a._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-foreground">{a.role?.name}</div>
                      <div className="text-[11.5px] text-muted-foreground truncate">
                        {[a.organization?.name, a.society?.name, a.project?.name].filter(Boolean).join(" · ") || "Global scope"}
                      </div>
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onRevokeRole(a)}>
                        Remove
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="activity" className="p-5">
            {(auditData?.items || []).length === 0 ? (
              <EmptyState icon={ScrollText} title="No activity recorded yet" description="Actions on this account will show up here." />
            ) : (
              <ul className="space-y-3">
                {auditData.items.map((entry) => (
                  <li key={entry._id} className="flex items-start gap-3 text-[13px]">
                    <div className="h-7 w-7 rounded-full bg-muted grid place-items-center shrink-0 mt-0.5">
                      <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <span className="font-semibold text-foreground">{entry.actor?.name || "System"}</span>{" "}
                        <span className="text-muted-foreground">{entry.action}</span>
                        {entry.status === "failure" && <StatusBadge tone="destructive" dot={false} className="ml-2 !text-[10px]">Failed</StatusBadge>}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(entry.createdAt)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {u.name}?</AlertDialogTitle>
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
            <AlertDialogTitle>Password reset</AlertDialogTitle>
            <AlertDialogDescription>Share this temporary password securely — it won't be shown again.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-[14px] text-center select-all">{resetResult}</div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResetResult(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function InfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate text-foreground/90">{label}</span>
    </div>
  );
}

function ActionCard({ title, description, action }) {
  return (
    <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
      <div>
        <div className="text-[13px] font-semibold text-foreground">{title}</div>
        <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      {action}
    </div>
  );
}
