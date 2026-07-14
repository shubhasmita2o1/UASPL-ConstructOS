import { useMemo, useState } from "react";
import { Download, FileText, History, Search, Filter } from "lucide-react";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useOrgAudit } from "@/hooks/useOrganizationsStore";
import { AUDIT_ACTIONS, AUDIT_LABEL, AUDIT_TONE } from "@/data/organizations";
import { exportAuditCsv, exportAuditPdf } from "@/utils/exportOrg";
import { initials } from "@/utils/format";

const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

const RANGES = [
  { k: "all", label: "All time", days: null },
  { k: "7",   label: "Last 7 days", days: 7 },
  { k: "30",  label: "Last 30 days", days: 30 },
  { k: "90",  label: "Last 90 days", days: 90 },
];

export default function AuditLogSection({ org, caps }) {
  const audit = useOrgAudit(org.id);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [range, setRange] = useState("all");
  const [actor, setActor] = useState("all");

  const actors = useMemo(() => Array.from(new Set(audit.map((a) => a.actor))).sort(), [audit]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const days = RANGES.find((r) => r.k === range)?.days;
    const cutoff = days ? Date.now() - days * 86400000 : null;
    return audit
      .filter((a) => {
        if (action !== "all" && a.action !== action) return false;
        if (actor !== "all" && a.actor !== actor) return false;
        if (cutoff && new Date(a.at).getTime() < cutoff) return false;
        if (term && !`${a.detail} ${a.actor} ${AUDIT_LABEL[a.action] ?? a.action}`.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [audit, q, action, range, actor]);

  const doExport = (kind) => {
    if (filtered.length === 0) { toast.error("No entries to export"); return; }
    if (kind === "csv") {
      const f = exportAuditCsv(org, filtered);
      toast.success(`Exported ${filtered.length} entries → ${f}`);
    } else {
      exportAuditPdf(org, filtered);
      toast.success(`Opened printable PDF for ${filtered.length} entries`);
    }
  };

  return (
    <SectionCard
      title="Audit log"
      description={`${filtered.length} of ${audit.length} entries · showing key actions (create, status, edits, invitations, KYC)`}
      action={caps.audit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">Download</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => doExport("csv")}>
              <FileText className="h-3.5 w-3.5 mr-2" /> CSV report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => doExport("pdf")}>
              <FileText className="h-3.5 w-3.5 mr-2" /> PDF report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search details or actor" className="pl-9 h-9" />
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="h-9 w-[170px] text-[12.5px]">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {AUDIT_ACTIONS.map((a) => <SelectItem key={a} value={a}>{AUDIT_LABEL[a]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger className="h-9 w-[160px] text-[12.5px]"><SelectValue placeholder="Actor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actors</SelectItem>
            {actors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="h-9 w-[140px] text-[12.5px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => <SelectItem key={r.k} value={r.k}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title={audit.length === 0 ? "No audit entries yet" : "No entries match your filters"}
          description={audit.length === 0
            ? "Key actions will appear here as they happen — status changes, edits, invitations, and KYC updates."
            : "Try clearing filters or widening the date range."}
        />
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-4 py-1">
          {filtered.map((a) => (
            <li key={a.id} className="pl-5 relative">
              <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-background border-2 border-primary" />
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={AUDIT_TONE[a.action] ?? "neutral"} className="!text-[10.5px]">{AUDIT_LABEL[a.action] ?? a.action}</StatusBadge>
                <span className="text-[11.5px] text-muted-foreground tabular-nums">{fmt(a.at)}</span>
              </div>
              <div className="text-[13px] text-foreground mt-1">{a.detail}</div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 rounded-full bg-primary/10 text-primary items-center justify-center text-[9px] font-semibold">
                  {initials(a.actor)}
                </span>
                by {a.actor}
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
