import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Pencil, Trash2, Power, Building2, MapPin, Globe, Phone, Mail,
  Landmark, HardHat, Users2, Plus, Search, X, CheckCircle2, Circle, Calendar,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOrganization, organizationsStore, useSocietyLibrary,
} from "@/hooks/useOrganizationsStore";
import {
  ORG_STATUSES, ORG_STATUS_TONE, activityForOrg, orgCapsFor,
} from "@/data/organizations";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";

export default function OrganizationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const caps = orgCapsFor(user?.role);
  const org = useOrganization(id);
  const societyLib = useSocietyLibrary();

  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [societyQ, setSocietyQ] = useState("");

  const assignedSocieties = useMemo(() => {
    if (!org) return [];
    return org.assignedSocieties
      .map((sid) => societyLib.find((s) => s.id === sid))
      .filter(Boolean);
  }, [org, societyLib]);

  const availableSocieties = useMemo(() => {
    if (!org) return [];
    const term = societyQ.trim().toLowerCase();
    return societyLib
      .filter((s) => !org.assignedSocieties.includes(s.id))
      .filter((s) => !term || `${s.name} ${s.address}`.toLowerCase().includes(term));
  }, [org, societyLib, societyQ]);

  if (!org) {
    return (
      <PageContainer>
        <SectionCard title="Organization not found">
          <p className="text-[13px] text-muted-foreground mb-3">The organization you're looking for doesn't exist or was removed.</p>
          <Link to="/app/organizations" className="text-primary text-[13px]">Back to organizations</Link>
        </SectionCard>
      </PageContainer>
    );
  }

  const activity = activityForOrg(org.id);

  const setStatus = (s) => {
    organizationsStore.setStatus(org.id, s);
    toast.success(`Status set to ${s}`);
  };

  const assign = (sid, name) => {
    organizationsStore.assignSociety(org.id, sid);
    toast.success(`Assigned ${name}`);
  };

  const unassign = (sid, name) => {
    organizationsStore.unassignSociety(org.id, sid);
    toast.success(`Removed ${name}`);
  };

  const doDelete = () => {
    organizationsStore.remove(org.id);
    toast.success(`Deleted ${org.name}`);
    navigate("/app/organizations");
  };

  return (
    <PageContainer>
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link to="/app/organizations" className="hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Organizations
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{org.name}</span>
      </div>

      <PageHeader
        title={org.name}
        description={org.description}
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
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">Set status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ORG_STATUSES.map((s) => (
                    <DropdownMenuItem key={s} disabled={org.status === s} onClick={() => setStatus(s)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full mr-2", {
                        Active: "bg-success", Onboarding: "bg-info", Suspended: "bg-warning", Archived: "bg-muted-foreground",
                      }[s])} />
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {caps.edit && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/app/organizations/${org.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {caps.delete && (
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </>
        }
      />

      {/* Identity card */}
      <SectionCard>
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="h-16 w-16 rounded-xl grid place-items-center text-white font-semibold text-lg shrink-0" style={{ backgroundColor: org.logoColor }}>
            {initials(org.name)}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-semibold text-foreground">{org.name}</h2>
              <StatusBadge tone={ORG_STATUS_TONE[org.status] ?? "neutral"}>{org.status}</StatusBadge>
              <StatusBadge tone="primary" dot={false}>{org.plan}</StatusBadge>
              {org.industry && <StatusBadge tone="info" dot={false}>{org.industry}</StatusBadge>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-[12.5px]">
              <InfoRow icon={MapPin} label={org.address || org.city} />
              <InfoRow icon={Globe} label={org.website ? <a className="text-primary hover:underline" href={org.website} target="_blank" rel="noreferrer">{org.website}</a> : "—"} />
              <InfoRow icon={Building2} label={`GSTIN · ${org.gstin || "—"}`} />
              <InfoRow icon={Calendar} label={`Founded ${org.founded || "—"} · created ${org.createdAt}`} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Projects" value={String(org.projects)} icon={HardHat} tone="primary" />
        <StatCard label="Societies" value={String(assignedSocieties.length)} icon={Landmark} tone="info" />
        <StatCard label="Members" value={String(org.members)} icon={Users2} tone="success" />
        <StatCard label="Status" value={org.status} icon={Power} tone={ORG_STATUS_TONE[org.status] === "success" ? "success" : ORG_STATUS_TONE[org.status] === "warning" ? "warning" : "info"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned societies */}
          <SectionCard
            title="Assigned societies"
            description="Societies that operate under this organization."
            action={caps.assign && (
              <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Assign society</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Assign society</DialogTitle>
                    <DialogDescription>Pick a society from the library to attach to {org.name}.</DialogDescription>
                  </DialogHeader>
                  <div className="relative">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input value={societyQ} onChange={(e) => setSocietyQ(e.target.value)} placeholder="Search societies" className="pl-9" />
                  </div>
                  <div className="max-h-[320px] overflow-auto space-y-2 pr-1">
                    {availableSocieties.length === 0 ? (
                      <div className="text-[13px] text-muted-foreground text-center py-8">No societies available to assign.</div>
                    ) : availableSocieties.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { assign(s.id, s.name); }}
                        className="w-full text-left rounded-lg border border-border hover:border-primary/40 hover:bg-accent/40 p-3 flex items-center gap-3 transition-all"
                      >
                        <div className="h-9 w-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-foreground truncate">{s.name}</div>
                          <div className="text-[11.5px] text-muted-foreground truncate">{s.address} · {s.units} units</div>
                        </div>
                        <StatusBadge dot={false} tone="info" className="!text-[10px]">{s.phase}</StatusBadge>
                      </button>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setAssignOpen(false)}>Done</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          >
            {assignedSocieties.length === 0 ? (
              <EmptyState
                icon={Landmark}
                title="No societies assigned yet"
                description="Assign societies from the platform library to make them available to this organization."
                action={caps.assign && <Button size="sm" onClick={() => setAssignOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Assign society</Button>}
              />
            ) : (
              <ul className="divide-y divide-border -m-5">
                {assignedSocieties.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-foreground truncate">{s.name}</div>
                      <div className="text-[11.5px] text-muted-foreground truncate">{s.address} · {s.buildings} buildings · {s.units} units</div>
                    </div>
                    <StatusBadge tone="info" dot={false} className="!text-[10px]">{s.phase}</StatusBadge>
                    {caps.assign && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => unassign(s.id, s.name)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Activity */}
          <SectionCard title="Recent activity">
            <ul className="space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 text-[10.5px] font-semibold mt-0.5">
                    {initials(a.user)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px]">
                      <span className="font-semibold text-foreground">{a.user}</span>{" "}
                      <span className="text-muted-foreground">{a.action}</span>{" "}
                      <span className="text-foreground">{a.target}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{a.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Primary contact */}
          <SectionCard title="Primary contact">
            {org.contact ? (
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-[12px] font-semibold">{org.contact.avatar}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-foreground">{org.contact.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">Account owner</div>
                  <div className="mt-3 space-y-1.5">
                    <InfoRow icon={Mail} label={<a className="hover:text-primary" href={`mailto:${org.contact.email}`}>{org.contact.email}</a>} />
                    <InfoRow icon={Phone} label={org.contact.phone} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">No contact assigned.</p>
            )}
          </SectionCard>

          {/* Status management */}
          <SectionCard title="Status management" description="Control the lifecycle state of this tenant.">
            <div className="space-y-2">
              {ORG_STATUSES.map((s) => {
                const active = org.status === s;
                return (
                  <button
                    key={s}
                    disabled={!caps.status || active}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/40",
                      !caps.status && "cursor-not-allowed opacity-70",
                    )}
                  >
                    {active ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-foreground">{s}</div>
                      <div className="text-[11.5px] text-muted-foreground">{STATUS_DESCRIPTIONS[s]}</div>
                    </div>
                    {active && <StatusBadge tone={ORG_STATUS_TONE[s]}>Current</StatusBadge>}
                  </button>
                );
              })}
            </div>
            {!caps.status && <p className="text-[11.5px] text-muted-foreground mt-3">Your role can't change status.</p>}
          </SectionCard>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{org.name}</span> and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

const STATUS_DESCRIPTIONS = {
  Active: "Fully operational and billable.",
  Onboarding: "Setup in progress — limited access.",
  Suspended: "Access paused; billing on hold.",
  Archived: "Read-only historical record.",
};

function InfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate text-foreground/90">{label}</span>
    </div>
  );
}
