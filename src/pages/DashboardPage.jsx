import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import ActionGuard from "@/components/common/ActionGuard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";
import {
  HardHat, ClipboardCheck, AlertTriangle, IndianRupee, Plus, Download,
  ArrowUpRight, TrendingUp, FileCheck2, MessagesSquare,
  Bell, CalendarClock, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { KPI_TRENDS, CATEGORY_SPLIT, APPROVAL_QUEUE, PROJECT_HEALTH, RECENT_ACTIVITY } from "@/data/mockData";
import { formatCurrency, initials } from "@/utils/format";

const HEALTH = { "on-track": "success", "at-risk": "warning", delayed: "destructive" };
const PIE_COLORS = ["#2563a8", "#3ea678", "#e0a34a", "#8a5cd6", "#d94a4a"];

function Card({ title, description, action, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-border bg-card shadow-card ${className}`}>
      {(title || action) && (
        <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>}
            {description && <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function DashboardPage() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const { org, society, currentProject } = useWorkspace();
  const { data: summary } = useDashboardSummary();
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const canSeeApprovals = hasAnyPermission(["drawing.approve", "finance.approve"]);
  const canSeeFinance = hasPermission("finance.view");
  const canSeeProjects = hasPermission("project.view");
  const canSeeQuality = hasAnyPermission(["drawing.review", "drawing.approve"]);

  return (
    <PageContainer>
      <PageHeader
        title={`Good day, ${firstName}`}
        description={`${org?.name} · ${society?.name}${currentProject ? ` · ${currentProject.name}` : ""} — real-time redevelopment operations overview`}
        actions={
          <>
            <ActionGuard permission="reports.export">
              <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
            </ActionGuard>
            <ActionGuard permission="project.create">
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New project</Button>
            </ActionGuard>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {canSeeProjects && (
          <StatCard label="Active projects" value={String(summary?.activeProjects ?? "—")} delta={8} icon={HardHat} tone="primary" />
        )}
        {canSeeApprovals && (
          <StatCard label="Pending approvals" value="37" delta={-12} deltaLabel="vs last week" icon={ClipboardCheck} tone="info" />
        )}
        {canSeeQuality && (
          <StatCard label="Open NCRs" value="9" delta={4} icon={AlertTriangle} tone="warning" />
        )}
        {canSeeFinance && (
          <StatCard label="Committed spend" value={formatCurrency(1284)} delta={3} icon={IndianRupee} tone="success" />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {canSeeProjects && (
          <Card
            title="Programme performance"
            description="Planned vs. actual progress across all active projects"
            className="xl:col-span-2"
            action={
              <Tabs defaultValue="12m">
                <TabsList className="h-8">
                  <TabsTrigger value="30d" className="text-[12px] px-2.5">30d</TabsTrigger>
                  <TabsTrigger value="90d" className="text-[12px] px-2.5">90d</TabsTrigger>
                  <TabsTrigger value="12m" className="text-[12px] px-2.5">12m</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            <div className="h-[280px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={KPI_TRENDS} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="planned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="planned" name="Planned %" stroke="var(--chart-1)" strokeWidth={2} fill="url(#planned)" />
                  <Area type="monotone" dataKey="actual" name="Actual %" stroke="var(--chart-2)" strokeWidth={2} fill="url(#actual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {canSeeFinance && (
          <Card title="Cost breakdown" description="Current period · category share">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={CATEGORY_SPLIT} innerRadius={54} outerRadius={82} paddingAngle={2} dataKey="value">
                    {CATEGORY_SPLIT.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-1.5">
              {CATEGORY_SPLIT.map((c, i) => (
                <li key={c.name} className="flex items-center gap-2 text-[12.5px]">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{c.name}</span>
                  <span className="ml-auto font-semibold tabular-nums">{c.value}%</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {canSeeProjects && (
          <Card
            title="Project health"
            description="Live status across executing projects"
            className="xl:col-span-2"
            action={<Button variant="ghost" size="sm" className="text-primary gap-1">View all <ChevronRight className="h-3.5 w-3.5" /></Button>}
          >
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-5 py-2">Project</th>
                    <th className="text-left font-medium px-2 py-2">Phase</th>
                    <th className="text-left font-medium px-2 py-2 w-[180px]">Progress</th>
                    <th className="text-right font-medium px-2 py-2">Spend / Budget</th>
                    <th className="text-left font-medium px-2 py-2">Health</th>
                    <th className="px-5 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {PROJECT_HEALTH.map((p) => (
                    <tr key={p.id} className="border-t border-border hover:bg-accent/40">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-[11.5px] text-muted-foreground">{p.id} · {p.risks} risks</div>
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">{p.phase}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={p.progress} className="h-1.5 flex-1" />
                          <span className="text-[12px] font-medium tabular-nums w-8 text-right">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums">
                        <div className="font-semibold">{formatCurrency(p.spend)}</div>
                        <div className="text-[11px] text-muted-foreground">of {formatCurrency(p.budget)}</div>
                      </td>
                      <td className="px-2 py-3"><StatusBadge tone={HEALTH[p.health]}>{p.health.replace("-", " ")}</StatusBadge></td>
                      <td className="px-5 py-3 text-right"><ArrowUpRight className="h-4 w-4 text-muted-foreground inline" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {canSeeApprovals && (
          <Card title="Approvals awaiting you" description={`${APPROVAL_QUEUE.length} items in your queue`} action={<Button variant="ghost" size="sm" className="text-primary gap-1">Open queue <ChevronRight className="h-3.5 w-3.5" /></Button>}>
            <ul className="space-y-2 -mx-1">
              {APPROVAL_QUEUE.map((a) => (
                <li key={a.id} className="p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/40 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                      <FileCheck2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-semibold text-muted-foreground">{a.type}</span>
                        <StatusBadge tone={a.priority === "High" ? "destructive" : a.priority === "Medium" ? "warning" : "neutral"} dot={false} className="!py-0 !text-[10px]">
                          {a.priority}
                        </StatusBadge>
                      </div>
                      <div className="text-[13px] font-semibold text-foreground truncate mt-0.5">{a.title}</div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5 truncate">{a.stage} · {a.submittedBy} · {a.submittedOn}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {canSeeFinance && (
          <Card
            title="Monthly spend"
            description="Cash outflow trend across active projects"
            className="xl:col-span-2"
            action={<div className="inline-flex items-center gap-1 text-[12px] font-medium text-success"><TrendingUp className="h-3.5 w-3.5" /> On target</div>}
          >
            <div className="h-[220px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={KPI_TRENDS}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="spend" name="Spend (₹L)" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card title="Recent activity" description="Across your workspace" action={<Bell className="h-4 w-4 text-muted-foreground" />}>
          <ol className="space-y-3 relative">
            <span className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
            {RECENT_ACTIVITY.map((a) => (
              <li key={a.id} className="flex gap-3 relative">
                <Avatar className="h-8 w-8 border-2 border-background z-10">
                  <AvatarFallback className="text-[10.5px] font-semibold bg-secondary text-secondary-foreground">{initials(a.user)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-[12.5px] leading-tight">
                    <span className="font-semibold text-foreground">{a.user}</span>
                    <span className="text-muted-foreground"> {a.action} </span>
                    <span className="font-medium text-foreground">{a.target}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {a.time}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card title="Team pulse" description="Comments, mentions and site notes from the last 24 hours" action={<MessagesSquare className="h-4 w-4 text-muted-foreground" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Priya Nair", role: "Site Engineer", msg: "Slab pour for Tower B, L-14 completed at 06:20. Cube samples collected — TMI-2410 uploaded.", tag: "Site update" },
            { name: "S. Menon", role: "MEP Lead", msg: "Coordination clash on L-9 shaft resolved with revised layout MEP-09-Rev-04. RFI closed.", tag: "Engineering" },
            { name: "N. Kulkarni", role: "Org Admin", msg: "Konkan Steels onboarded across all Mumbai projects — GST and MSME docs verified.", tag: "Compliance" },
          ].map((c) => (
            <div key={c.name} className="rounded-lg border border-border p-4 bg-background">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-[11px] font-semibold bg-primary text-primary-foreground">{initials(c.name)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.role}</div>
                </div>
                <StatusBadge tone="info" dot={false} className="ml-auto !text-[10px]">{c.tag}</StatusBadge>
              </div>
              <p className="text-[12.5px] text-muted-foreground mt-3 leading-relaxed">{c.msg}</p>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
