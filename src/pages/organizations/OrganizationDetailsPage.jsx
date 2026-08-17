import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Power,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Landmark,
  HardHat,
  Users2,
  CheckCircle2,
  Circle,
  Calendar,
  Loader2,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOrganization,
  useDeleteOrganization,
  useSetOrganizationStatus,
  normalizeOrg,
} from "@/hooks/useOrganizationsApi";
import { apiClient } from "@/lib/apiClient";
import { ORG_STATUSES, ORG_STATUS_TONE } from "@/data/organizations";
import InvitationsSection from "@/components/organization/InvitationsSection";
import KycSection from "@/components/organization/KycSection";
import AuditLogSection from "@/components/organization/AuditLogSection";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";

const STATUS_DESCRIPTIONS = {
  Active: "Fully operational and billable.",
  Onboarding: "Setup in progress — limited access.",
  Suspended: "Access paused; billing on hold.",
  Archived: "Read-only historical record.",
};

function formatCreated(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

export default function OrganizationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const caps = {
    create: hasPermission("organization.create"),
    edit: hasPermission("organization.edit"),
    delete: hasPermission("organization.delete"),
    assign: hasPermission("organization.assign"),
    status: hasPermission("organization.status"),
    invite: hasPermission("organization.invite"),
    kyc: hasPermission("organization.kyc"),
    audit: hasPermission("organization.audit"),
  };

  const { data: org, isLoading, isError, error, refetch } = useOrganization(id);
  const deleteOrg = useDeleteOrganization();
  const setStatusMutation = useSetOrganizationStatus();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Real societies under this organization (read-only until Societies write APIs ship)
  const { data: societies = [] } = useQuery({
    queryKey: ["societies", { organizationId: id }],
    queryFn: async () => {
      const data = await apiClient.get(`/societies?organizationId=${id}`);
      return (data || []).map((s) => ({
        ...s,
        id: s.id || String(s._id),
      }));
    },
    enabled: !!id && !!org,
  });

  const handleStatus = async (s) => {
    if (!org || org.status === s) return;
    try {
      await setStatusMutation.mutateAsync({ id: org.id, status: s });
      toast.success(`Status set to ${s}`);
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const doDelete = async () => {
    if (!org) return;
    try {
      await deleteOrg.mutateAsync(org.id);
      toast.success(`${org.name} archived`);
      navigate("/app/organizations");
    } catch (err) {
      toast.error(err?.message || "Failed to archive organization");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading organization…
        </div>
      </PageContainer>
    );
  }

  if (isError || !org) {
    return (
      <PageContainer>
        <SectionCard title="Organization not found">
          <p className="text-[13px] text-muted-foreground mb-3">
            {error?.message ||
              "The organization you're looking for doesn't exist or was removed."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
            <Button size="sm" asChild>
              <Link to="/app/organizations">Back to organizations</Link>
            </Button>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  // Ensure nested shape for contact / tabs that still key off org.id
  const safeOrg = normalizeOrg(org) || org;
  const contact = safeOrg.contact || {};

  return (
    <PageContainer>
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link
          to="/app/organizations"
          className="hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Organizations
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{safeOrg.name}</span>
      </div>

      <PageHeader
        title={safeOrg.name}
        description={safeOrg.description || undefined}
        actions={
          <>
            {caps.status && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Power className="h-3.5 w-3.5" /> Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Set status
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ORG_STATUSES.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={safeOrg.status === s || setStatusMutation.isPending}
                      onClick={() => handleStatus(s)}
                    >
                      <span
                        className={cn("h-1.5 w-1.5 rounded-full mr-2", {
                          Active: "bg-success",
                          Onboarding: "bg-info",
                          Suspended: "bg-warning",
                          Archived: "bg-muted-foreground",
                        }[s])}
                      />
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {caps.edit && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate(`/app/organizations/${safeOrg.id}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {caps.delete && safeOrg.status !== "Archived" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Archive
              </Button>
            )}
          </>
        }
      />

      {/* Identity card */}
      <SectionCard>
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div
            className="h-16 w-16 rounded-xl grid place-items-center text-white font-semibold text-lg shrink-0"
            style={{ backgroundColor: safeOrg.logoColor || "oklch(0.58 0.16 240)" }}
          >
            {initials(safeOrg.name)}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-semibold text-foreground">{safeOrg.name}</h2>
              <StatusBadge tone={ORG_STATUS_TONE[safeOrg.status] ?? "neutral"}>
                {safeOrg.status}
              </StatusBadge>
              <StatusBadge tone="primary" dot={false}>
                {safeOrg.plan}
              </StatusBadge>
              {safeOrg.industry && (
                <StatusBadge tone="info" dot={false}>
                  {safeOrg.industry}
                </StatusBadge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-[12.5px]">
              <InfoRow icon={MapPin} label={safeOrg.address || safeOrg.city || "—"} />
              <InfoRow
                icon={Globe}
                label={
                  safeOrg.website ? (
                    <a
                      className="text-primary hover:underline"
                      href={safeOrg.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {safeOrg.website}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow icon={Building2} label={`GSTIN · ${safeOrg.gstin || "—"}`} />
              <InfoRow
                icon={Calendar}
                label={`Founded ${safeOrg.founded || "—"} · created ${formatCreated(safeOrg.createdAt)}`}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Projects"
          value={String(safeOrg.projects ?? 0)}
          icon={HardHat}
          tone="primary"
        />
        <StatCard
          label="Societies"
          value={String(societies.length || safeOrg.societies || 0)}
          icon={Landmark}
          tone="info"
        />
        <StatCard
          label="Members"
          value={String(safeOrg.members ?? 0)}
          icon={Users2}
          tone="success"
        />
        <StatCard
          label="Status"
          value={safeOrg.status}
          icon={Power}
          tone={
            ORG_STATUS_TONE[safeOrg.status] === "success"
              ? "success"
              : ORG_STATUS_TONE[safeOrg.status] === "warning"
                ? "warning"
                : "info"
          }
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Societies (read-only from API) */}
              <SectionCard
                title="Societies"
                description="Societies linked to this organization in the database."
              >
                {societies.length === 0 ? (
                  <EmptyState
                    icon={Landmark}
                    title="No societies yet"
                    description="Societies created under this organization will appear here. Full assign/create flows ship in the next step."
                  />
                ) : (
                  <ul className="divide-y divide-border -m-5">
                    {societies.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="h-9 w-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-foreground truncate">
                            {s.name}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground truncate">
                            {s.address || "—"}
                            {s.buildings != null ? ` · ${s.buildings} buildings` : ""}
                            {s.units != null ? ` · ${s.units} units` : ""}
                          </div>
                        </div>
                        {s.phase && (
                          <StatusBadge tone="info" dot={false} className="!text-[10px]">
                            {s.phase}
                          </StatusBadge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>

            <div className="space-y-6">
              {/* Primary contact */}
              <SectionCard title="Primary contact">
                {contact.name || contact.email || contact.phone ? (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-[12px] font-semibold">
                        {initials(contact.name || contact.email || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-foreground">
                        {contact.name || "—"}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">Account owner</div>
                      <div className="mt-3 space-y-1.5">
                        {contact.email && (
                          <InfoRow
                            icon={Mail}
                            label={
                              <a className="hover:text-primary" href={`mailto:${contact.email}`}>
                                {contact.email}
                              </a>
                            }
                          />
                        )}
                        {contact.phone && <InfoRow icon={Phone} label={contact.phone} />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">No contact assigned.</p>
                )}
              </SectionCard>

              {/* Status management */}
              <SectionCard
                title="Status management"
                description="Control the lifecycle state of this tenant."
              >
                <div className="space-y-2">
                  {ORG_STATUSES.map((s) => {
                    const active = safeOrg.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!caps.status || active || setStatusMutation.isPending}
                        onClick={() => handleStatus(s)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-accent/40",
                          (!caps.status || setStatusMutation.isPending) &&
                            "cursor-not-allowed opacity-70",
                        )}
                      >
                        {active ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-foreground">{s}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {STATUS_DESCRIPTIONS[s]}
                          </div>
                        </div>
                        {active && (
                          <StatusBadge tone={ORG_STATUS_TONE[s]}>Current</StatusBadge>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!caps.status && (
                  <p className="text-[11.5px] text-muted-foreground mt-3">
                    Your role can&apos;t change status.
                  </p>
                )}
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="mt-0">
          <InvitationsSection org={safeOrg} caps={caps} />
        </TabsContent>
        <TabsContent value="kyc" className="mt-0">
          <KycSection org={safeOrg} caps={caps} />
        </TabsContent>
        <TabsContent value="audit" className="mt-0">
          <AuditLogSection org={safeOrg} caps={caps} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive organization?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{safeOrg.name}</span> will be set to
              Archived. You can reactivate it later by changing status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteOrg.isPending}
            >
              {deleteOrg.isPending ? "Archiving…" : "Archive organization"}
            </AlertDialogAction>
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