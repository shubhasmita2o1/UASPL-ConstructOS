import { useMemo, useState } from "react";
import { Download, Search, X, Activity, CheckCircle2, FileText, IndianRupee, CalendarClock } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ACTIVITY_FEED, ACTIVITY_TYPES, activityTypeMeta, formatTime } from "@/data/activity";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";

const DAY_ORDER = ["Today", "Yesterday", "Earlier"];

export default function ActivityCenterPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => {
    return ACTIVITY_FEED.filter((a) => {
      const term = q.trim().toLowerCase();
      if (term && !`${a.user} ${a.action} ${a.target} ${a.project}`.toLowerCase().includes(term)) return false;
      if (type !== "all" && a.type !== type) return false;
      return true;
    });
  }, [q, type]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((a) => { (map[a.day] ??= []).push(a); });
    return DAY_ORDER.filter((d) => map[d]?.length).map((d) => [d, map[d]]);
  }, [filtered]);

  const stats = useMemo(() => {
    const total = ACTIVITY_FEED.length;
    const today = ACTIVITY_FEED.filter((a) => a.day === "Today").length;
    const approvals = ACTIVITY_FEED.filter((a) => a.type === "approval").length;
    const finance = ACTIVITY_FEED.filter((a) => a.type === "finance").length;
    return { total, today, approvals, finance };
  }, []);

  const filtersActive = q || type !== "all";

  return (
    <PageContainer>
      <PageHeader
        title="Activity Center"
        description="A unified, real-time stream of every approval, upload, task and transaction across your workspace."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Export queued")}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total events" value={String(stats.total)} delta={6} icon={Activity} tone="primary" />
        <StatCard label="Today" value={String(stats.today)} delta={4} deltaLabel="vs yesterday" icon={CalendarClock} tone="info" />
        <StatCard label="Approvals" value={String(stats.approvals)} delta={2} icon={CheckCircle2} tone="success" />
        <StatCard label="Financial events" value={String(stats.finance)} delta={1} icon={IndianRupee} tone="warning" />
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, actions or projects" className="pl-9 h-9" />
          </div>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={() => { setQ(""); setType("all"); }} className="gap-1 text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap px-5 py-3 border-b border-border">
          <FilterChip active={type === "all"} onClick={() => setType("all")}>All</FilterChip>
          {Object.entries(ACTIVITY_TYPES).map(([key, meta]) => (
            <FilterChip key={key} active={type === key} onClick={() => setType(key)}>
              <meta.icon className="h-3 w-3" /> {meta.label}
            </FilterChip>
          ))}
        </div>

        <div className="p-5">
          {grouped.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity matches your filters"
              description="Try a different search term or activity type."
              action={filtersActive && <Button variant="outline" size="sm" onClick={() => { setQ(""); setType("all"); }}>Clear filters</Button>}
            />
          ) : (
            <div className="space-y-6">
              {grouped.map(([day, items]) => (
                <div key={day}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{day}</span>
                    <span className="text-[11px] text-muted-foreground">· {items.length}</span>
                    <span className="h-px bg-border flex-1" />
                  </div>
                  <ol className="space-y-3 relative">
                    <span className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                    {items.map((a) => {
                      const meta = activityTypeMeta(a.type);
                      return (
                        <li key={a.id} className="flex gap-3 relative">
                          <Avatar className="h-8 w-8 border-2 border-background z-10">
                            <AvatarFallback className="text-[10.5px] font-semibold bg-secondary text-secondary-foreground">{initials(a.user)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 hover:border-primary/40 transition-colors">
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1 text-[12.5px] leading-tight">
                                <span className="font-semibold text-foreground">{a.user}</span>
                                <span className="text-muted-foreground"> {a.action} </span>
                                <span className="font-medium text-foreground">{a.target}</span>
                              </div>
                              <StatusBadge tone={meta.tone} dot={false} className="!text-[10px] shrink-0">
                                <meta.icon className="h-3 w-3" /> {meta.label}
                              </StatusBadge>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                              <FileText className="h-3 w-3" /> {a.project}
                              <span>·</span>
                              <CalendarClock className="h-3 w-3" /> {formatTime(a.ts)}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>
    </PageContainer>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
