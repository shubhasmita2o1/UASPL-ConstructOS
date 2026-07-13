import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CalendarDays, Plus, Filter, ListChecks, AlertTriangle,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTasks } from "@/hooks/useTasksStore";
import { useProjects } from "@/hooks/useProjectsStore";
import {
  TASK_STATUS_LABELS, TASK_STATUS_TONES, TASK_PRIORITY_TONES,
} from "@/data/tasks";
import { cn } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function ymd(d) { return d.toISOString().slice(0, 10); }
function sameDay(a, b) { return ymd(a) === ymd(b); }
function startOfMonthGrid(d) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  // Monday-first grid
  const day = (first.getDay() + 6) % 7;
  first.setDate(first.getDate() - day);
  return first;
}

export default function CalendarPage() {
  const tasks = useTasks();
  const projects = useProjects();
  const projectName = (id) => projects.find((p) => p.id === id)?.name ?? "—";

  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState("month"); // month | week | agenda
  const [projectFilter, setProjectFilter] = useState("all");

  const events = useMemo(() => tasks
    .filter((t) => (projectFilter === "all" || t.projectId === projectFilter) && t.dueDate)
    .map((t) => ({ ...t, date: new Date(t.dueDate) })), [tasks, projectFilter]);

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const today = new Date();

  const gridStart = useMemo(() => startOfMonthGrid(cursor), [cursor]);
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [gridStart]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const k = ymd(e.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    }
    return map;
  }, [events]);

  const weekDays = useMemo(() => {
    const start = new Date(cursor);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [cursor]);

  const agenda = useMemo(() => {
    const from = new Date(); from.setHours(0, 0, 0, 0);
    const to = new Date(from); to.setDate(to.getDate() + 30);
    return events
      .filter((e) => e.date >= from && e.date <= to)
      .sort((a, b) => a.date - b.date);
  }, [events]);

  const stats = useMemo(() => {
    const t = ymd(today);
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
    return {
      today: events.filter((e) => ymd(e.date) === t && e.status !== "done").length,
      week: events.filter((e) => e.date >= today && e.date <= weekEnd && e.status !== "done").length,
      overdue: events.filter((e) => e.date < new Date(today.toDateString()) && e.status !== "done").length,
      month: events.filter((e) => e.date.getMonth() === cursor.getMonth() && e.date.getFullYear() === cursor.getFullYear()).length,
    };
  }, [events, cursor]);

  const step = (dir) => {
    const next = new Date(cursor);
    if (view === "week") next.setDate(next.getDate() + dir * 7);
    else next.setMonth(next.getMonth() + dir);
    setCursor(next);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="A single view of tasks, approvals, inspections and milestones scheduled across your active society."
        actions={
          <>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-9 min-w-[180px] text-[12.5px]">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/app/tasks"><Plus className="h-3.5 w-3.5" /> New task</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Due today" value={String(stats.today)} icon={CalendarDays} tone="primary" />
        <StatCard label="Next 7 days" value={String(stats.week)} icon={ListChecks} tone="info" />
        <StatCard label="Overdue" value={String(stats.overdue)} icon={AlertTriangle} tone="warning" />
        <StatCard label="This month" value={String(stats.month)} icon={CalendarDays} tone="success" />
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
            <div className="flex">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-r-none" onClick={() => step(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-l-none border-l-0" onClick={() => step(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-[15px] font-semibold ml-2">{monthLabel}</div>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            {["month", "week", "agenda"].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn("h-8 px-3 text-[12.5px] font-medium rounded-[5px] capitalize",
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === "month" && (
          <MonthGrid days={days} cursor={cursor} today={today} eventsByDay={eventsByDay} projectName={projectName} />
        )}
        {view === "week" && (
          <WeekGrid days={weekDays} today={today} eventsByDay={eventsByDay} projectName={projectName} />
        )}
        {view === "agenda" && (
          <AgendaList events={agenda} projectName={projectName} />
        )}
      </SectionCard>
    </PageContainer>
  );
}

function EventPill({ e }) {
  const tone = TASK_PRIORITY_TONES[e.priority];
  const color = {
    neutral: "bg-muted text-foreground border-border",
    info: "bg-info/10 text-info border-info/20",
    warning: "bg-warning/15 text-warning-foreground border-warning/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
  }[tone];
  return (
    <div className={cn("truncate rounded-md border px-1.5 py-0.5 text-[11px] leading-tight", color, e.status === "done" && "line-through opacity-70")}>
      {e.title}
    </div>
  );
}

function MonthGrid({ days, cursor, today, eventsByDay, projectName }) {
  return (
    <div className="p-3">
      <div className="grid grid-cols-7 text-[11px] uppercase tracking-wider text-muted-foreground px-1 pb-1.5">
        {WEEKDAYS.map((w) => <div key={w} className="px-2">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = sameDay(d, today);
          const list = eventsByDay.get(ymd(d)) ?? [];
          return (
            <div key={ymd(d)} className={cn(
              "min-h-[104px] rounded-lg border border-border bg-background p-1.5 flex flex-col gap-1",
              !inMonth && "bg-muted/30 opacity-70",
              isToday && "ring-2 ring-primary/60",
            )}>
              <div className="flex items-center justify-between px-1">
                <span className={cn("text-[12px] font-semibold tabular-nums", isToday && "text-primary")}>
                  {d.getDate()}
                </span>
                {list.length > 0 && <span className="text-[10px] text-muted-foreground tabular-nums">{list.length}</span>}
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {list.slice(0, 3).map((e) => <EventPill key={e.id} e={e} />)}
                {list.length > 3 && (
                  <div className="text-[10.5px] text-muted-foreground px-1">+{list.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({ days, today, eventsByDay, projectName }) {
  return (
    <div className="p-3 grid grid-cols-7 gap-2">
      {days.map((d) => {
        const isToday = sameDay(d, today);
        const list = eventsByDay.get(ymd(d)) ?? [];
        return (
          <div key={ymd(d)} className={cn("rounded-lg border border-border bg-background flex flex-col min-h-[300px]", isToday && "ring-2 ring-primary/60")}>
            <div className="px-3 py-2 border-b border-border">
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                {WEEKDAYS[(d.getDay() + 6) % 7]}
              </div>
              <div className={cn("text-[16px] font-semibold tabular-nums", isToday && "text-primary")}>{d.getDate()}</div>
            </div>
            <div className="p-2 flex flex-col gap-1.5">
              {list.map((e) => (
                <div key={e.id} className="rounded-md border border-border bg-card p-2">
                  <div className="text-[12.5px] font-medium leading-snug">{e.title}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground truncate">{projectName(e.projectId)}</span>
                    <StatusBadge tone={TASK_STATUS_TONES[e.status]} className="!text-[10px]">{TASK_STATUS_LABELS[e.status]}</StatusBadge>
                  </div>
                </div>
              ))}
              {list.length === 0 && <div className="text-[11.5px] text-muted-foreground text-center py-6">No events</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgendaList({ events, projectName }) {
  const grouped = events.reduce((acc, e) => {
    const k = ymd(e.date);
    (acc[k] ||= []).push(e);
    return acc;
  }, {});
  const keys = Object.keys(grouped);
  if (keys.length === 0) {
    return <div className="p-10 text-center text-[13px] text-muted-foreground">Nothing scheduled in the next 30 days.</div>;
  }
  return (
    <div className="divide-y divide-border">
      {keys.map((k) => {
        const d = new Date(k);
        return (
          <div key={k} className="px-5 py-4">
            <div className="text-[12px] uppercase tracking-wider text-muted-foreground mb-2">
              {d.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short" })}
            </div>
            <div className="space-y-2">
              {grouped[k].map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium truncate">{e.title}</div>
                    <div className="text-[11.5px] text-muted-foreground">{e.id} · {projectName(e.projectId)} · {e.type}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge dot={false} tone={TASK_PRIORITY_TONES[e.priority]} className="!text-[10.5px]">{e.priority}</StatusBadge>
                    <StatusBadge tone={TASK_STATUS_TONES[e.status]} className="!text-[10.5px]">{TASK_STATUS_LABELS[e.status]}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
