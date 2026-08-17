import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Download,
  Search,
  Filter,
  LayoutGrid,
  List,
  Building2,
  Users2,
  TrendingUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ArrowUpAZ,
  ArrowDownAZ,
  ShieldCheck,
  Power,
  Loader2,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
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
  useOrganizations,
  useDeleteOrganization,
  useSetOrganizationStatus,
} from "@/hooks/useOrganizationsApi";
import { ORG_PLANS, ORG_STATUSES, ORG_STATUS_TONE } from "@/data/organizations";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";
import { csvEscape, downloadBlob } from "@/utils/downloadCsv";

const PAGE_SIZE = 6;

export default function OrganizationsListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const caps = {
    create: hasPermission("organization.create"),
    edit: hasPermission("organization.edit"),
    delete: hasPermission("organization.delete"),
    assign: hasPermission("organization.assign"),
    status: hasPermission("organization.status"),
  };

  const { data: organizations = [], isLoading, isError, error, refetch } = useOrganizations();
  const deleteOrg = useDeleteOrganization();
  const setStatus = useSetOrganizationStatus();

  const [view, setView] = useState("list");
  const [q, setQ] = useState("");
  const [status, setStatusFilter] = useState("all");
  const [plan, setPlan] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const filtered = useMemo(() => {
    let list = organizations.filter((o) => {
      const term = q.trim().toLowerCase();
      if (
        term &&
        !`${o.name} ${o.city || ""} ${o.industry || ""} ${o.code || ""}`
          .toLowerCase()
          .includes(term)
      ) {
        return false;
      }
      if (status !== "all" && o.status !== status) return false;
      if (plan !== "all" && o.plan !== plan) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString().toLowerCase();
      const bv = (b[sortKey] ?? "").toString().toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [organizations, q, status, plan, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = organizations.length;
    const active = organizations.filter((o) => o.status === "Active").length;
    const projects = organizations.reduce((s, o) => s + (o.projects || 0), 0);
    const members = organizations.reduce((s, o) => s + (o.members || 0), 0);
    return { total, active, projects, members };
  }, [organizations]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteOrg.mutateAsync(toDelete.id);
      toast.success(`${toDelete.name} archived`);
      setToDelete(null);
    } catch (err) {
      toast.error(err?.message || "Failed to archive organization");
    }
  };

  const handleStatus = async (org, nextStatus) => {
    try {
      await setStatus.mutateAsync({ id: org.id, status: nextStatus });
      toast.success(`${org.name} → ${nextStatus}`);
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleExport = () => {
    const headers = [
      "name",
      "city",
      "plan",
      "status",
      "industry",
      "projects",
      "societies",
      "members",
    ];
    const lines = [
      headers.join(","),
      ...filtered.map((o) => headers.map((h) => csvEscape(o[h] ?? "")).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    downloadBlob("organizations.csv", blob);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading organizations…
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <EmptyState
          title="Could not load organizations"
          description={error?.message || "Check your connection and try again."}
          action={
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Organizations"
        description="Manage tenant organizations across the platform."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            {caps.create && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => navigate("/app/organizations/new")}
              >
                <Plus className="h-3.5 w-3.5" /> New organization
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Organizations"
          value={String(stats.total)}
          icon={Building2}
          tone="primary"
        />
        <StatCard label="Active" value={String(stats.active)} icon={ShieldCheck} tone="success" />
        <StatCard
          label="Projects"
          value={String(stats.projects)}
          icon={TrendingUp}
          tone="info"
        />
        <StatCard label="Members" value={String(stats.members)} icon={Users2} tone="warning" />
      </div>

      <SectionCard className="!p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, city, industry or code"
              className="pl-9 h-9"
            />
          </div>
          <FilterSelect
            icon={Filter}
            value={status}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            placeholder="Status"
            options={[["all", "All statuses"], ...ORG_STATUSES.map((s) => [s, s])]}
          />
          <FilterSelect
            value={plan}
            onChange={(v) => {
              setPlan(v);
              setPage(1);
            }}
            placeholder="Plan"
            options={[["all", "All plans"], ...ORG_PLANS.map((p) => [p, p])]}
          />
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              type="button"
              className={cn("h-9 w-9 grid place-items-center", view === "list" && "bg-muted")}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn("h-9 w-9 grid place-items-center", view === "grid" && "bg-muted")}
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No organizations found"
            description={
              q || status !== "all" || plan !== "all"
                ? "Try adjusting filters."
                : "Create your first organization to get started."
            }
            action={
              caps.create ? (
                <Button size="sm" onClick={() => navigate("/app/organizations/new")}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> New organization
                </Button>
              ) : null
            }
          />
        ) : view === "list" ? (
          <ListView
            items={pageItems}
            caps={caps}
            onDelete={setToDelete}
            onStatus={handleStatus}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key) => {
              if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
              else {
                setSortKey(key);
                setSortDir("asc");
              }
            }}
          />
        ) : (
          <GridView
            items={pageItems}
            caps={caps}
            onDelete={setToDelete}
            onStatus={handleStatus}
          />
        )}

        {filtered.length > PAGE_SIZE && (
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        )}
      </SectionCard>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive organization?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{toDelete?.name}</span> will be set
              to Archived. You can reactivate it later by changing status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

function FilterSelect({ value, onChange, placeholder, options, icon: Icon }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 min-w-[130px] text-[12.5px]">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => (
          <SelectItem key={v} value={v}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RowActions({ org, caps, onDelete, onStatus }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
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
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Set status
            </DropdownMenuLabel>
            {ORG_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                disabled={org.status === s}
                onClick={() => onStatus(org, s)}
              >
                <Power className="h-3.5 w-3.5 mr-2" /> {s}
              </DropdownMenuItem>
            ))}
          </>
        )}
        {caps.delete && org.status !== "Archived" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(org)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Archive
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
      style={{
        width: size,
        height: size,
        backgroundColor: org.logoColor || "oklch(0.58 0.16 240)",
        fontSize: size * 0.35,
      }}
    >
      {initials(org.name)}
    </div>
  );
}

function ListView({ items, caps, onDelete, onStatus, sortKey, sortDir, onSort }) {
  const SortBtn = ({ k, children }) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 hover:text-foreground"
      onClick={() => onSort?.(k)}
    >
      {children}
      {sortKey === k &&
        (sortDir === "asc" ? (
          <ArrowUpAZ className="h-3 w-3" />
        ) : (
          <ArrowDownAZ className="h-3 w-3" />
        ))}
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-2.5 font-medium">
              <SortBtn k="name">Organization</SortBtn>
            </th>
            <th className="px-5 py-2.5 font-medium">
              <SortBtn k="city">City</SortBtn>
            </th>
            <th className="px-5 py-2.5 font-medium">
              <SortBtn k="plan">Plan</SortBtn>
            </th>
            <th className="px-5 py-2.5 font-medium">
              <SortBtn k="status">Status</SortBtn>
            </th>
            <th className="px-5 py-2.5 font-medium text-right">Projects</th>
            <th className="px-5 py-2.5 font-medium text-right">Societies</th>
            <th className="px-5 py-2.5 font-medium text-right">Members</th>
            <th className="px-5 py-2.5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((o) => (
            <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/40">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <OrgLogo org={o} size={36} />
                  <div className="min-w-0">
                    <Link
                      to={`/app/organizations/${o.id}`}
                      className="font-medium hover:text-primary truncate block"
                    >
                      {o.name}
                    </Link>
                    <div className="text-[11.5px] text-muted-foreground truncate">
                      {o.industry || "—"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{o.city || "—"}</td>
              <td className="px-5 py-3">{o.plan}</td>
              <td className="px-5 py-3">
                <StatusBadge tone={ORG_STATUS_TONE[o.status] ?? "neutral"}>
                  {o.status}
                </StatusBadge>
              </td>
              <td className="px-5 py-3 text-right tabular-nums">{o.projects ?? 0}</td>
              <td className="px-5 py-3 text-right tabular-nums">{o.societies ?? 0}</td>
              <td className="px-5 py-3 text-right tabular-nums">{o.members ?? 0}</td>
              <td className="px-5 py-3 text-right">
                <RowActions org={o} caps={caps} onDelete={onDelete} onStatus={onStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GridView({ items, caps, onDelete, onStatus }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
      {items.map((o) => (
        <div
          key={o.id}
          className="rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:shadow-card transition-all"
        >
          <div className="flex items-start gap-3">
            <OrgLogo org={o} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  to={`/app/organizations/${o.id}`}
                  className="font-semibold text-[14px] truncate hover:text-primary"
                >
                  {o.name}
                </Link>
                <StatusBadge
                  tone={ORG_STATUS_TONE[o.status] ?? "neutral"}
                  className="!text-[10px] ml-auto shrink-0"
                >
                  {o.status}
                </StatusBadge>
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">
                {o.city || "—"} · {o.plan}
              </div>
            </div>
            <RowActions org={o} caps={caps} onDelete={onDelete} onStatus={onStatus} />
          </div>
          {o.description && (
            <p className="text-[12.5px] text-muted-foreground mt-3 line-clamp-2">
              {o.description}
            </p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
            <StatMini label="Projects" value={o.projects ?? 0} />
            <StatMini label="Societies" value={o.societies ?? 0} />
            <StatMini label="Members" value={o.members ?? 0} />
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
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border text-[12.5px]">
      <div className="text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}