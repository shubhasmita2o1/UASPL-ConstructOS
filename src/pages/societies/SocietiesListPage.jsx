import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download, Search, Filter, LayoutGrid, List, Landmark, Building2, Home,
  Users2, MapPin, Phone, X, ArrowUpAZ, ArrowDownAZ, Plus,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import ActionGuard from "@/components/common/ActionGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { csvEscape, downloadBlob } from "@/utils/downloadCsv";
import { SOCIETY_PHASES, SOCIETY_PHASE_TONE } from "@/data/societies";
import { useSocieties } from "@/hooks/useSocietiesStore";
import { ORGANIZATIONS } from "@/data/mockData";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";

export default function SocietiesListPage() {
  const navigate = useNavigate();
  const SOCIETIES_FULL = useSocieties();
  const [view, setView] = useState("grid");
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState("all");
  const [org, setOrg] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const filtered = useMemo(() => {
    let list = SOCIETIES_FULL.filter((s) => {
      const term = q.trim().toLowerCase();
      if (term && !`${s.name} ${s.address} ${s.orgName}`.toLowerCase().includes(term)) return false;
      if (phase !== "all" && s.phase !== phase) return false;
      if (org !== "all" && s.orgId !== org) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = a[sortKey]; const vb = b[sortKey];
      if (typeof va === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return list;
  }, [SOCIETIES_FULL, q, phase, org, sortKey, sortDir]);

  const stats = useMemo(() => {
    const societies = SOCIETIES_FULL.length;
    const units = SOCIETIES_FULL.reduce((s, x) => s + x.units, 0);
    const buildings = SOCIETIES_FULL.reduce((s, x) => s + x.buildings, 0);
    const executing = SOCIETIES_FULL.filter((x) => x.phase === "Execution").length;
    return { societies, units, buildings, executing };
  }, [SOCIETIES_FULL]);

  const resetFilters = () => { setQ(""); setPhase("all"); setOrg("all"); };
  const filtersActive = q || phase !== "all" || org !== "all";

  return (
    <PageContainer>
      <PageHeader
        title="Societies"
        description="Every cooperative housing society engaged with UASPL — registration, consent, buildings and delivery phase."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportCsv(filtered)}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <ActionGuard permission="society.create">
              <Button size="sm" className="gap-1.5" onClick={() => navigate("/app/societies/onboard")}>
                <Plus className="h-3.5 w-3.5" /> New society
              </Button>
            </ActionGuard>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total societies" value={String(stats.societies)} delta={2} icon={Landmark} tone="primary" />
        <StatCard label="Buildings" value={String(stats.buildings)} delta={3} icon={Building2} tone="info" />
        <StatCard label="Units under management" value={String(stats.units)} delta={5} icon={Home} tone="success" />
        <StatCard label="In execution" value={String(stats.executing)} delta={1} deltaLabel="this quarter" icon={Users2} tone="warning" />
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, address or organization" className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger className="h-9 min-w-[140px] text-[12.5px]">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All phases</SelectItem>
                {SOCIETY_PHASES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={org} onValueChange={setOrg}>
              <SelectTrigger className="h-9 min-w-[150px] text-[12.5px]"><SelectValue placeholder="Organization" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All organizations</SelectItem>
                {ORGANIZATIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="h-6 w-px bg-border mx-1" />
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger className="h-9 w-[130px] text-[12.5px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="units">Units</SelectItem>
                <SelectItem value="buildings">Buildings</SelectItem>
                <SelectItem value="consentPct">Consent %</SelectItem>
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
              { k: "grid", label: "Grid", icon: LayoutGrid },
              { k: "list", label: "List", icon: List },
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
            Showing <span className="font-medium text-foreground">{filtered.length}</span> societies
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Landmark}
              title="No societies match your filters"
              description="Try adjusting the search or filters."
              action={filtersActive && <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>}
            />
          </div>
        ) : view === "grid" ? (
          <GridView items={filtered} onOpen={(id) => navigate(`/app/societies/${id}`)} />
        ) : (
          <ListView items={filtered} onOpen={(id) => navigate(`/app/societies/${id}`)} />
        )}
      </SectionCard>
    </PageContainer>
  );
}

function SocietyLogo({ name, size = 40 }) {
  return (
    <div className="rounded-lg grid place-items-center bg-primary/10 text-primary font-semibold shrink-0" style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {initials(name)}
    </div>
  );
}

function GridView({ items, onOpen }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
      {items.map((s) => (
        <div key={s.id} role="button" tabIndex={0} onClick={() => onOpen(s.id)} onKeyDown={(e) => { if (e.key === "Enter") onOpen(s.id); }} className="text-left rounded-xl border border-border bg-background p-4 hover:border-primary/40 hover:shadow-card transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex items-start gap-3">
            <SocietyLogo name={s.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[14px] truncate">{s.name}</span>
                <StatusBadge tone={SOCIETY_PHASE_TONE[s.phase] ?? "neutral"} className="!text-[10px] ml-auto shrink-0">{s.phase}</StatusBadge>
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" /> {s.address}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-border text-center">
            <StatMini label="Buildings" value={s.buildings} />
            <StatMini label="Units" value={s.units} />
            <StatMini label="Consent" value={`${s.consentPct}%`} />
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>Redevelopment consent</span><span className="tabular-nums">{s.consentPct}%</span>
            </div>
            <Progress value={s.consentPct} className="h-1.5" />
          </div>
          <div className="mt-3 pt-3 border-t border-border text-[11.5px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {s.orgName}</div>
            <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {s.chairperson} · {s.chairPhone}</div>
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

function ListView({ items, onOpen }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="text-left font-medium px-5 py-2.5">Society</th>
            <th className="text-left font-medium px-2 py-2.5">Organization</th>
            <th className="text-left font-medium px-2 py-2.5">Phase</th>
            <th className="text-right font-medium px-2 py-2.5">Buildings</th>
            <th className="text-right font-medium px-2 py-2.5">Units</th>
            <th className="text-left font-medium px-5 py-2.5 w-[160px]">Consent</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} onClick={() => onOpen(s.id)} className="border-t border-border hover:bg-accent/40 transition-colors cursor-pointer">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <SocietyLogo name={s.name} size={34} />
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{s.name}</div>
                    <div className="text-[11.5px] text-muted-foreground truncate">{s.address} · {s.registrationNo}</div>
                  </div>
                </div>
              </td>
              <td className="px-2 py-3 text-muted-foreground">{s.orgName}</td>
              <td className="px-2 py-3"><StatusBadge tone={SOCIETY_PHASE_TONE[s.phase] ?? "neutral"}>{s.phase}</StatusBadge></td>
              <td className="px-2 py-3 text-right tabular-nums font-medium">{s.buildings}</td>
              <td className="px-2 py-3 text-right tabular-nums font-medium">{s.units}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <Progress value={s.consentPct} className="h-1.5 flex-1" />
                  <span className="text-[12px] font-medium tabular-nums w-9 text-right">{s.consentPct}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function exportCsv(items) {
  if (!items.length) { toast.info("Nothing to export"); return; }
  const cols = [
    ["Name", "name"], ["Organization", "orgName"], ["City", "city"], ["Address", "address"],
    ["Phase", "phase"], ["Buildings", "buildings"], ["Units", "units"],
    ["Consent %", "consentPct"], ["Registration", "registrationNo"],
    ["Chairperson", "chairperson"], ["Chair phone", "chairPhone"],
  ];
  const rows = [cols.map((c) => c[0]).join(",")];
  items.forEach((s) => rows.push(cols.map((c) => csvEscape(s[c[1]])).join(",")));
  downloadBlob(
    `societies-${new Date().toISOString().slice(0, 10)}.csv`,
    new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }),
  );
  toast.success(`Exported ${items.length} societies`);
}
