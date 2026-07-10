import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Download, Search, Filter, LayoutGrid, List, Building2, Users2, Landmark,
  TrendingUp, MoreHorizontal, Pencil, Trash2, Eye, ArrowUpAZ, ArrowDownAZ, X,
  ShieldCheck, Power,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizations, organizationsStore } from "@/hooks/useOrganizationsStore";
import { ORG_PLANS, ORG_STATUSES, ORG_STATUS_TONE, orgCapsFor } from "@/data/organizations";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

export default function OrganizationsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const caps = orgCapsFor(user?.role);
  const organizations = useOrganizations();

  const [view, setView] = useState("list");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const filtered = useMemo(() => {
    let list = organizations.filter((o) => {
      const term = q.trim().toLowerCase();
      if (term && !`${o.name} ${o.city} ${o.industry ?? ""}`.toLowerCase().includes(term)) return false;
      if (status !== "all" && o.status !== status) return false;
      if (plan !== "all" && o.plan !== plan) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = a[sortKey]; const vb = b[sortKey];
      if (typeof va === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return list;
  }, [organizations, q, status, plan, sortKey, sortDir]);

  const stats = useMemo(() => {
    const active = organizations.filter((o) => o.status === "Active").length;
    const onboarding = organizations.filter((o) => o.status === "Onboarding").length;
    const societies = organizations.reduce((s, o) => s + (o.assignedSocieties?.length ?? 0), 0);
    const members = organizations.reduce((s, o) => s + o.members, 0);
    return { active, onboarding, societies, members, count: organizations.length };
  }, [organizations]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetFilters = () => { setQ(""); setStatus("all"); setPlan("all"); };
  const filtersActive = q || status !== "all" || plan !== "all";

  const confirmDelete = () => {
    if (!toDelete) return;
    organizationsStore.remove(toDelete.id);
    toast.success(`Deleted ${toDelete.name}`);
    setToDelete(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Organizations"
        description="Every tenant that operates on the ConstructOS platform — plans, societies, teams and status."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Export queued")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            {caps.create && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/app/organizations/new")}>
                <Plus className="h-3.5 w-3.5" /> New organization
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total tenants" value={String(stats.count)} delta={3} icon={Building2} tone="primary" />
        <StatCard label="Active" value={String(stats.active)} delta={2} icon={TrendingUp} tone="success" />
        <StatCard label="Onboarding" value={String(stats.onboarding)} delta={1} deltaLabel="this month" icon={ShieldCheck} tone="info" />
        <StatCard label="Assigned societies" value={String(stats.societies)} delta={4} icon={Landmark} tone="warning" />
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by name, city or industry" className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterSelect icon={Filter} value={status} onChange={(v) => { setStatus(v); setPage(1); }} placeholder="Status" options={[["all","All status"], ...ORG_STATUSES.map((s) => [s, s])]} />
            <FilterSelect value={plan} onChange={(v) => { setPlan(v); setPage(1); }} placeholder="Plan" options={[["all","All plans"], ...ORG_PLANS.map((p) => [p, p])]} />
            <div className="h-6 w-px bg-border mx-1" />
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger className="h-9 w-[150px] text-[12.5px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="members">Members</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
              {sortDir === "asc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
            </Button>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 pt-3">
          <div className="flex items-center gap-1">
            {[
              { k: "list", label: "List", icon: List },
              { k: "grid", label: "Grid", icon: LayoutGrid },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setView(t.k)}
                className={cn(
                  "h-9 px-3 text-[13px] font-medium inline-flex items-center gap-1.5 border-b-2 -mb-px transition-colors",
                  view === t.k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
          <div className="text-[12px] text-muted-foreground">
            Showing <span className="font-medium text-foreground">{paged.length}</span> of {filtered.length}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Building2}
              title="No organizations match your filters"
              description="Try adjusting the search or filters, or create a new organization."
              action={
                filtersActive
                  ? <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
                  : caps.create && <Button size="sm" onClick={() => navigate("/app/organizations/new")} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New organization</Button>
              }
            />
          </div>
        ) : view === "list" ? (
          <ListView items={paged} caps={caps} onDelete={setToDelete} />
        ) : (
          <GridView items={paged} caps={caps} onDelete={setToDelete} />
        )}

        {filtered.length > 0 && <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />}
      </SectionCard>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{toDelete?.name}</span> and all associated data will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function FilterSelect({ value, onChange, placeholder, options, icon: Icon }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 min-w-[130px] text-[12.5px]">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function RowActions({ org, caps, onDelete }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => navigate(`/app/organizations/${org.id}`)}>
          <Eye className="h-3.5 w-3.5 mr-2" /> View details
        </DropdownMenuItem>
        {caps.edit && (
          <DropdownMenuItem onClick={() => navigate(`/app/organizations/${org.id}/edit`)}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
          </DropdownMenuItem>
        )}
        {caps.status && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">Set status</DropdownMenuLabel>
            {ORG_STATUSES.map((s) => (
              <DropdownMenuItem key={s} disabled={org.status === s} onClick={() => { organizationsStore.setStatus(org.id, s); toast.success(`${org.name} → ${s}`); }}>
                <Power className="h-3.5 w-3.5 mr-2" /> {s}
              </DropdownMenuItem>
            ))}
          </>
        )}
        {caps.delete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(org)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrgLogo({ org, size = 40 }) {
  return (
    <div
      className="rounded-lg grid place-items-center text-white font-semibold shrink-0"
      style={{ backgroundColor: org.logoColor, width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials(org.name)}
    </div>
  );
}

function ListView({ items, caps, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="text-left font-medium px-5 py-2.5">Organization</th>
            <th className="text-left font-medium px-2 py-2.5">Plan</th>
            <th className="text-left font-medium px-2 py-2.5">Status</th>
            <th className="text-right font-medium px-2 py-2.5">Projects</th>
            <th className="text-right font-medium px-2 py-2.5">Societies</th>
            <th className="text-right font-medium px-2 py-2.5">Members</th>
            <th className="px-5 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {items.map((o) => (
            <tr key={o.id} className="border-t border-border hover:bg-accent/40 transition-colors">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <OrgLogo org={o} size={36} />
                  <div className="min-w-0">
                    <Link to={`/app/organizations/${o.id}`} className="font-semibold text-foreground hover:text-primary">{o.name}</Link>
                    <div className="text-[11.5px] text-muted-foreground">{o.city}{o.industry ? ` · ${o.industry}` : ""}</div>
                  </div>
                </div>
              </td>
              <td className="px-2 py-3"><StatusBadge tone="primary" dot={false}>{o.plan}</StatusBadge></td>
              <td className="px-2 py-3"><StatusBadge tone={ORG_STATUS_TONE[o.status] ?? "neutral"}>{o.status ?? "—"}</StatusBadge></td>
              <td className="px-2 py-3 text-right tabular-nums font-medium">{o.projects}</td>
              <td className="px-2 py-3 text-right tabular-nums font-medium">{o.assignedSocieties?.length ?? o.societies}</td>
              <td className="px-2 py-3 text-right tabular-nums font-medium">{o.members}</td>
              <td className="px-5 py-3 text-right"><RowActions org={o} caps={caps} onDelete={onDelete} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GridView({ items, caps, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
      {items.map((o) => (
        <div key={o.id} className="rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:shadow-card transition-all">
          <div className="flex items-start gap-3">
            <OrgLogo org={o} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link to={`/app/organizations/${o.id}`} className="font-semibold text-[14px] truncate hover:text-primary">{o.name}</Link>
                <StatusBadge tone={ORG_STATUS_TONE[o.status] ?? "neutral"} className="!text-[10px] ml-auto shrink-0">{o.status}</StatusBadge>
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">{o.city} · {o.plan}</div>
            </div>
            <RowActions org={o} caps={caps} onDelete={onDelete} />
          </div>
          {o.description && <p className="text-[12.5px] text-muted-foreground mt-3 line-clamp-2">{o.description}</p>}
          <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
            <StatMini label="Projects" value={o.projects} />
            <StatMini label="Societies" value={o.assignedSocieties?.length ?? o.societies} />
            <StatMini label="Members" value={o.members} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatMini({ label, value }) {
  return (
    <div>
      <div className="text-[15px] font-semibold tabular-nums">{value}</div>
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border text-[12.5px]">
      <div className="text-muted-foreground">Page {page} of {totalPages}</div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
