import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Download, Search, Filter, LayoutGrid, List, KanbanSquare,
  HardHat, TrendingUp, AlertTriangle, IndianRupee, ArrowUpRight,
  ArrowDownAZ, ArrowUpAZ, MoreHorizontal, Pencil, Trash2, Eye,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects, projectsStore } from "@/hooks/useProjectsStore";
import { PROJECT_HEALTH_TONES, PROJECT_PHASES, PROJECT_PRIORITIES } from "@/data/projects";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const PRIORITY_TONE = { Low: "neutral", Medium: "info", High: "warning", Critical: "destructive" };
const PAGE_SIZE = 6;

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const caps = {
    create: hasPermission("project.create"),
    edit: hasPermission("project.edit"),
    delete: hasPermission("project.delete"),
  };
  const projects = useProjects();

  const [view, setView] = useState("list");
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState("all");
  const [health, setHealth] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      const term = q.trim().toLowerCase();
      if (term && !`${p.name} ${p.code} ${p.location} ${p.societyName}`.toLowerCase().includes(term)) return false;
      if (phase !== "all" && p.phase !== phase) return false;
      if (health !== "all" && p.health !== health) return false;
      if (priority !== "all" && p.priority !== priority) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return list;
  }, [projects, q, phase, health, priority, sortKey, sortDir]);

  const stats = useMemo(() => {
    const active = projects.filter((p) => !["Closed", "Handover"].includes(p.phase)).length;
    const atRisk = projects.filter((p) => ["at-risk", "delayed"].includes(p.health)).length;
    const spend = projects.reduce((s, p) => s + p.spend, 0);
    const budget = projects.reduce((s, p) => s + p.budget, 0);
    return { active, atRisk, spend, budget, count: projects.length };
  }, [projects]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetFilters = () => {
    setQ(""); setPhase("all"); setHealth("all"); setPriority("all");
  };
  const filtersActive = q || phase !== "all" || health !== "all" || priority !== "all";

  const confirmDelete = () => {
    if (!toDelete) return;
    projectsStore.remove(toDelete.id);
    toast.success(`Deleted ${toDelete.name}`);
    setToDelete(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Every active and upcoming redevelopment programme across your workspace."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Export queued")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            {caps.create && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/app/projects/new")}>
                <Plus className="h-3.5 w-3.5" /> New project
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total projects" value={String(stats.count)} delta={6} icon={HardHat} tone="primary" />
        <StatCard label="In execution" value={String(stats.active)} delta={4} icon={TrendingUp} tone="info" />
        <StatCard label="At risk" value={String(stats.atRisk)} delta={-2} deltaLabel="vs last week" icon={AlertTriangle} tone="warning" />
        <StatCard label="Committed spend" value={formatCurrency(stats.spend)} delta={5} icon={IndianRupee} tone="success" />
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by name, code, society or location" className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterSelect icon={Filter} value={phase} onChange={(v) => { setPhase(v); setPage(1); }} placeholder="Phase" options={[["all","All phases"], ...PROJECT_PHASES.map((p) => [p, p])]} />
            <FilterSelect value={health} onChange={(v) => { setHealth(v); setPage(1); }} placeholder="Health" options={[["all","All health"],["on-track","On track"],["at-risk","At risk"],["delayed","Delayed"],["paused","Paused"]]} />
            <FilterSelect value={priority} onChange={(v) => { setPriority(v); setPage(1); }} placeholder="Priority" options={[["all","All priorities"], ...PROJECT_PRIORITIES.map((p) => [p, p])]} />
            <div className="h-6 w-px bg-border mx-1" />
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger className="h-9 w-[150px] text-[12.5px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="spend">Spend</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="startDate">Start date</SelectItem>
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
              { k: "kanban", label: "Kanban", icon: KanbanSquare },
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
              icon={HardHat}
              title="No projects match your filters"
              description="Try adjusting the search or filters, or create a new project to get started."
              action={
                filtersActive
                  ? <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
                  : caps.create && <Button size="sm" onClick={() => navigate("/app/projects/new")} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New project</Button>
              }
            />
          </div>
        ) : view === "list" ? (
          <ListView items={paged} caps={caps} onDelete={setToDelete} />
        ) : view === "grid" ? (
          <GridView items={paged} caps={caps} onDelete={setToDelete} />
        ) : (
          <KanbanView items={filtered} caps={caps} />
        )}

        {view !== "kanban" && filtered.length > 0 && (
          <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />
        )}
      </SectionCard>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{toDelete?.name}</span> ({toDelete?.code}) and all associated data will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete project
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

function RowActions({ project, caps, onDelete }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => navigate(`/app/projects/${project.id}`)}>
          <Eye className="h-3.5 w-3.5 mr-2" /> View details
        </DropdownMenuItem>
        {caps.edit && (
          <DropdownMenuItem onClick={() => navigate(`/app/projects/${project.id}/edit`)}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
          </DropdownMenuItem>
        )}
        {caps.delete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(project)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ListView({ items, caps, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="text-left font-medium px-5 py-2.5">Project</th>
            <th className="text-left font-medium px-2 py-2.5">Phase</th>
            <th className="text-left font-medium px-2 py-2.5 w-[200px]">Progress</th>
            <th className="text-right font-medium px-2 py-2.5">Spend / Budget</th>
            <th className="text-left font-medium px-2 py-2.5">Team</th>
            <th className="text-left font-medium px-2 py-2.5">Health</th>
            <th className="text-left font-medium px-2 py-2.5">Priority</th>
            <th className="px-5 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-t border-border hover:bg-accent/40 transition-colors">
              <td className="px-5 py-3">
                <Link to={`/app/projects/${p.id}`} className="font-semibold text-foreground hover:text-primary">{p.name}</Link>
                <div className="text-[11.5px] text-muted-foreground">{p.code} · {p.location}</div>
              </td>
              <td className="px-2 py-3 text-muted-foreground">{p.phase}</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <Progress value={p.progress} className="h-1.5 flex-1" />
                  <span className="text-[12px] font-medium tabular-nums w-9 text-right">{p.progress}%</span>
                </div>
              </td>
              <td className="px-2 py-3 text-right tabular-nums">
                <div className="font-semibold">{formatCurrency(p.spend)}</div>
                <div className="text-[11px] text-muted-foreground">of {formatCurrency(p.budget)}</div>
              </td>
              <td className="px-2 py-3">
                <div className="flex -space-x-2">
                  {p.team.slice(0, 3).map((m) => (
                    <Avatar key={m.id} className="h-6 w-6 border-2 border-card">
                      <AvatarFallback className="text-[9.5px] font-semibold bg-secondary text-secondary-foreground">{m.avatar}</AvatarFallback>
                    </Avatar>
                  ))}
                  {p.team.length > 3 && (
                    <div className="h-6 w-6 rounded-full border-2 border-card bg-muted text-[9.5px] font-medium text-muted-foreground grid place-items-center">
                      +{p.team.length - 3}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-2 py-3"><StatusBadge tone={PROJECT_HEALTH_TONES[p.health]}>{p.health.replace("-", " ")}</StatusBadge></td>
              <td className="px-2 py-3"><StatusBadge dot={false} tone={PRIORITY_TONE[p.priority]}>{p.priority}</StatusBadge></td>
              <td className="px-5 py-3 text-right"><RowActions project={p} caps={caps} onDelete={onDelete} /></td>
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
      {items.map((p) => (
        <div key={p.id} className="rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:shadow-card transition-all">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <HardHat className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link to={`/app/projects/${p.id}`} className="font-semibold text-[14px] truncate hover:text-primary">{p.name}</Link>
                <StatusBadge dot={false} tone={PRIORITY_TONE[p.priority]} className="!text-[10px] ml-auto shrink-0">{p.priority}</StatusBadge>
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">{p.code} · {p.location}</div>
            </div>
            <RowActions project={p} caps={caps} onDelete={onDelete} />
          </div>
          <p className="text-[12.5px] text-muted-foreground mt-3 line-clamp-2">{p.description}</p>
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Progress value={p.progress} className="h-1.5 flex-1" />
              <span className="text-[12px] font-medium tabular-nums w-9 text-right">{p.progress}%</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">{p.phase}</span>
              <StatusBadge tone={PROJECT_HEALTH_TONES[p.health]}>{p.health.replace("-", " ")}</StatusBadge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex -space-x-2">
                {p.team.slice(0, 4).map((m) => (
                  <Avatar key={m.id} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-[9.5px] font-semibold bg-secondary text-secondary-foreground">{m.avatar}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-right tabular-nums">
                <div className="text-[12.5px] font-semibold">{formatCurrency(p.spend)}</div>
                <div className="text-[10.5px] text-muted-foreground">of {formatCurrency(p.budget)}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanView({ items, caps }) {
  const columns = PROJECT_PHASES;
  return (
    <div className="overflow-x-auto p-5">
      <div className="flex gap-4 min-w-max">
        {columns.map((col) => {
          const list = items.filter((p) => p.phase === col);
          return (
            <div key={col} className="w-[280px] shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="text-[12px] font-semibold text-foreground uppercase tracking-wider">{col}</div>
                <span className="text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground font-medium">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-[12px] text-muted-foreground text-center">
                    No projects
                  </div>
                )}
                {list.map((p) => (
                  <Link
                    key={p.id}
                    to={`/app/projects/${p.id}`}
                    className="block rounded-lg border border-border bg-background p-3 hover:border-primary/40 hover:shadow-card transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-[13px] truncate flex-1">{p.name}</div>
                      <StatusBadge dot={false} tone={PRIORITY_TONE[p.priority]} className="!text-[10px]">{p.priority}</StatusBadge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{p.code}</div>
                    <div className="flex items-center gap-2 mt-3">
                      <Progress value={p.progress} className="h-1.5 flex-1" />
                      <span className="text-[11px] font-medium tabular-nums">{p.progress}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex -space-x-2">
                        {p.team.slice(0, 3).map((m) => (
                          <Avatar key={m.id} className="h-5 w-5 border-2 border-background">
                            <AvatarFallback className="text-[8.5px] font-semibold bg-secondary text-secondary-foreground">{m.avatar}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <StatusBadge tone={PROJECT_HEALTH_TONES[p.health]} className="!text-[10px]">{p.health.replace("-", " ")}</StatusBadge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border">
      <div className="text-[12px] text-muted-foreground">Page {page} of {totalPages}</div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8 gap-1" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={cn(
              "h-8 min-w-8 px-2 rounded-md text-[12.5px] font-medium border transition-colors",
              n === page ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-accent",
            )}
          >
            {n}
          </button>
        ))}
        <Button variant="outline" size="sm" className="h-8 gap-1" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
