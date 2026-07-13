import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Pencil, Copy, Trash2, ShieldCheck, Lock, Users2, KeySquare } from "lucide-react";
import { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useRole, useRoleAssignedUsers, useDuplicateRole, useDeleteRole } from "@/hooks/useRolesApi";
import { initials } from "@/utils/format";

export default function RoleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuth();
  const canManage = hasAnyPermission(["role.manage", "roles.manage"]);

  const { data: role, isLoading } = useRole(id);
  const { data: assignedUsers = [] } = useRoleAssignedUsers(id);
  const duplicateRole = useDuplicateRole();
  const deleteRole = useDeleteRole();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return <PageContainer><SectionCard><p className="text-[13px] text-muted-foreground">Loading…</p></SectionCard></PageContainer>;
  }

  if (!role) {
    return (
      <PageContainer>
        <SectionCard title="Role not found">
          <Link to="/app/roles" className="text-primary text-[13px]">Back to roles</Link>
        </SectionCard>
      </PageContainer>
    );
  }

  const grouped = (role.permissions || []).reduce((acc, p) => {
    acc[p.module] = acc[p.module] || [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const onDuplicate = async () => {
    try {
      const clone = await duplicateRole.mutateAsync(role._id);
      toast.success(`Duplicated as "${clone.name}"`);
      navigate(`/app/roles/${clone._id}`);
    } catch (err) {
      toast.error(err.message || "Couldn't duplicate role");
    }
  };

  const onDelete = async () => {
    try {
      await deleteRole.mutateAsync(role._id);
      toast.success("Role deleted");
      navigate("/app/roles");
    } catch (err) {
      toast.error(err.message || "Couldn't delete role");
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link to="/app/roles" className="hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Roles
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{role.name}</span>
      </div>

      <PageHeader
        title={role.name}
        description={role.description}
        actions={
          <>
            {canManage && !role.isSystem && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/app/roles/${role._id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {canManage && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onDuplicate}>
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </Button>
            )}
            {canManage && !role.isSystem && (
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </>
        }
      />

      <SectionCard>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={role.isActive ? "success" : "neutral"}>{role.isActive ? "Active" : "Disabled"}</StatusBadge>
          {role.isSystem && <StatusBadge tone="neutral" dot={false}><Lock className="h-2.5 w-2.5 mr-1" /> System role</StatusBadge>}
          <StatusBadge tone="primary" dot={false} className="capitalize">{role.dataScope} scope</StatusBadge>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Permissions" value={String(role.permissions?.length ?? 0)} icon={KeySquare} tone="primary" />
        <StatCard label="Assigned users" value={String(assignedUsers.length)} icon={Users2} tone="info" />
        <StatCard label="Sidebar menus" value={String(role.sidebarMenus?.length ?? 0)} icon={ShieldCheck} tone="neutral" />
        <StatCard label="Dashboard widgets" value={String(role.dashboardWidgets?.length ?? 0)} icon={ShieldCheck} tone="neutral" />
      </div>

      <SectionCard bodyClassName="p-0">
        <Tabs defaultValue="overview">
          <div className="px-5 pt-4 border-b border-border">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="users">Assigned users</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-5 space-y-4">
            <p className="text-[13px] text-muted-foreground">{role.description || "No description provided."}</p>
          </TabsContent>

          <TabsContent value="permissions" className="p-5">
            <div className="flex justify-end mb-3">
              {canManage && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/app/roles/${role._id}/permissions`)}>
                  <Pencil className="h-3.5 w-3.5" /> Manage permissions
                </Button>
              )}
            </div>
            {Object.keys(grouped).length === 0 ? (
              <EmptyState icon={KeySquare} title="No permissions assigned" description="This role currently grants no access." />
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([module, perms]) => (
                  <div key={module}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{module}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {perms.map((p) => (
                        <span key={p._id} className="rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-medium">{p.label}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="p-5">
            {assignedUsers.length === 0 ? (
              <EmptyState icon={Users2} title="No users assigned" description="Assign this role to users from the User Management screen." />
            ) : (
              <ul className="divide-y divide-border -m-5">
                {assignedUsers.map((a) => (
                  <li key={a._id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">{initials(a.user?.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <Link to={`/app/users/${a.user?._id}`} className="text-[13px] font-semibold text-foreground hover:text-primary">{a.user?.name}</Link>
                      <div className="text-[11.5px] text-muted-foreground truncate">
                        {[a.organization?.name, a.society?.name, a.project?.name].filter(Boolean).join(" · ") || "Global scope"}
                      </div>
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
            <AlertDialogTitle>Delete "{role.name}"?</AlertDialogTitle>
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
