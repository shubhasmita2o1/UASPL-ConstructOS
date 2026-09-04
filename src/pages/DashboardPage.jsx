import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import ActionGuard from "@/components/common/ActionGuard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";
import {
  HardHat, ClipboardCheck, AlertTriangle, IndianRupee, Plus, Download,
  ArrowUpRight, TrendingUp, FileCheck2, Bell, CalendarClock, ChevronRight,
  Building2, Users2, Landmark, UserCog, ListChecks, Truck, Package,
  FileUp, Clock, UserPlus, Briefcase, BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { getRoleExperience, hasWidget } from "@/constants/roleExperience";
import { KPI_TRENDS, CATEGORY_SPLIT, APPROVAL_QUEUE, PROJECT_HEALTH, RECENT_ACTIVITY } from "@/data/mockData";
import {
  PLATFORM_TENANTS, ACCESS_EVENTS, ENGINEER_TASKS, ENGINEER_NCRS, ENGINEER_DRAWINGS,
  VENDOR_POS, VENDOR_DELIVERIES, HR_HEADCOUNT_SPLIT, HR_LEAVE_QUEUE, HR_ONBOARDING,
  HR_OPEN_ROLES, HR_SITE_MANPOWER, HR_ATTENDANCE_TREND,
} from "@/data/roleDashboards";
import { formatCurrency, initials } from "@/utils/format";
import DashCard from "@/pages/dashboard/DashCard";

const HEALTH = { "on-track": "success", "at-risk": "warning", delayed: "destructive" };
const PIE_COLORS = ["#2563a8", "#3ea678", "#e0a34a", "#8a5cd6", "#d94a4a"];

function ActivityList({ items }) {
  return (
    <ol className="space-y-3 relative">
      <span className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
      {items.map((a) => (
        <li key={a.id} className="flex gap-3 relative">
          <Avatar className="h-8 w-8 border-2 border-background z-10">
            <AvatarFallback className="text-[10.5px] font-semibold bg-secondary text-secondary-foreground">
              {initials(a.who || a.user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-[12.5px] leading-tight">
              <span className="font-semibold text-foreground">{a.who || a.user}</span>
              <span className="text-muted-foreground"> {a.action} </span>
              <span className="font-medium text-foreground">{a.target}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <CalendarClock className="h-3 w-3" /> {a.time}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { org, society, currentProject } = useWorkspace();
  const { data: summary } = useDashboardSummary();
  const xp = getRoleExperience(user);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const scope = [org?.name, society?.name, currentProject?.name].filter(Boolean).join(" · ");
  const w = (id) => hasWidget(xp, id);

  return (
    <PageContainer>
      <PageHeader
        title={`Good day, ${firstName}`}
        description={`${xp.headline} · ${scope || "workspace"} — ${xp.tagline}`}
        actions={
          <>
            <StatusBadge tone="info" dot={false}>{xp.label}</StatusBadge>
            {xp.slug === "super_admin" || xp.slug === "org_admin" ? (
              <ActionGuard permission="reports.export">
                <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
              </ActionGuard>
            ) : null}
            {xp.slug === "org_admin" || xp.slug === "project_manager" ? (
              <ActionGuard permission="project.create">
                <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New project</Button>
              </ActionGuard>
            ) : null}
            {xp.slug === "hr_manager" ? (
              <Button size="sm" className="gap-1.5" asChild>
                <a href="/app/hr"><UserPlus className="h-3.5 w-3.5" /> New hire</a>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {w("platformOrgs") && <StatCard label="Organizations" value="3" delta={0} icon={Building2} tone="primary" />}
        {w("platformUsers") && <StatCard label="Active users" value="544" delta={6} icon={UserCog} tone="info" />}
        {w("platformSocieties") && <StatCard label="Societies" value="33" delta={4} icon={Landmark} tone="success" />}
        {w("platformProjects") && <StatCard label="Live projects" value={String(summary?.activeProjects ?? 24)} delta={8} icon={HardHat} tone="primary" />}

        {w("orgSocieties") && <StatCard label="Societies" value="18" delta={2} icon={Landmark} tone="primary" />}
        {w("orgProjects") && <StatCard label="Active projects" value={String(summary?.activeProjects ?? "—")} delta={8} icon={HardHat} tone="info" />}
        {w("orgMembers") && <StatCard label="People on roll" value="312" delta={3} icon={Users2} tone="success" />}
        {w("orgSpend") && <StatCard label="Committed spend" value={formatCurrency(1284)} delta={3} icon={IndianRupee} tone="warning" />}

        {w("myProjects") && <StatCard label="My projects" value={String(summary?.activeProjects ?? "2")} delta={0} icon={HardHat} tone="primary" />}
        {w("pendingApprovals") && <StatCard label="Pending approvals" value="11" delta={-12} deltaLabel="vs last week" icon={ClipboardCheck} tone="info" />}
        {w("openTasks") && <StatCard label="Open tasks" value="28" delta={5} icon={ListChecks} tone="warning" />}
        {w("committedSpend") && <StatCard label="Project spend" value={formatCurrency(128.4)} delta={3} icon={IndianRupee} tone="success" />}

        {w("myTasks") && <StatCard label="My tasks today" value="4" delta={-8} deltaLabel="vs yesterday" icon={ListChecks} tone="primary" />}
        {w("openNcrs") && <StatCard label="Open NCRs" value="3" delta={4} icon={AlertTriangle} tone="warning" />}
        {w("drawingsToReview") && <StatCard label="Drawings to review" value="3" icon={FileCheck2} tone="info" />}
        {w("siteAttendance") && <StatCard label="Labour present" value="91 / 96" delta={-2} deltaLabel="vs plan" icon={Users2} tone="success" />}

        {w("openPOs") && <StatCard label="Open POs" value="3" icon={Truck} tone="primary" />}
        {w("deliveriesDue") && <StatCard label="Deliveries due" value="2" icon={Package} tone="warning" />}
        {w("pendingInvoices") && <StatCard label="Pending invoices" value={formatCurrency(18.4)} icon={IndianRupee} tone="info" />}
        {w("drawingsToUpload") && <StatCard label="Docs to upload" value="4" icon={FileUp} tone="success" />}

        {w("hrHeadcount") && <StatCard label="Headcount" value="312" delta={3} icon={Users2} tone="primary" />}
        {w("hrAttendance") && <StatCard label="Present today" value="286" delta={2} deltaLabel="vs yesterday" icon={BadgeCheck} tone="success" />}
        {w("hrLeave") && <StatCard label="Leave pending" value="3" icon={Clock} tone="warning" />}
        {w("hrOpenRoles") && <StatCard label="Open roles" value="4" icon={Briefcase} tone="info" />}
      </div>

      {xp.slug === "super_admin" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <DashCard title="Tenants" description="Organizations on this platform" className="xl:col-span-2">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-medium py-2">Organization</th>
                  <th className="text-left font-medium py-2">Plan</th>
                  <th className="text-right font-medium py-2">Societies</th>
                  <th className="text-right font-medium py-2">Members</th>
                  <th className="text-left font-medium py-2 pl-4">Health</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_TENANTS.map((t) => (
                  <tr key={t.name} className="border-t border-border">
                    <td className="py-3 font-semibold">{t.name}</td>
                    <td className="py-3 text-muted-foreground">{t.plan}</td>
                    <td className="py-3 text-right tabular-nums">{t.societies}</td>
                    <td className="py-3 text-right tabular-nums">{t.members}</td>
                    <td className="py-3 pl-4"><StatusBadge tone={t.status === "Healthy" ? "success" : "warning"}>{t.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DashCard>
          <DashCard title="Access events" description="Privileged actions in the last 24h" action={<Bell className="h-4 w-4 text-muted-foreground" />}>
            <ActivityList items={ACCESS_EVENTS} />
          </DashCard>
        </div>
      )}

      {xp.slug === "org_admin" && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <DashCard title="Project health" description="Executing societies in this organization" className="xl:col-span-2">
              <ProjectHealthTable />
            </DashCard>
            <DashCard title="Vendor onboarding" description="KYC / GST / MSME">
              <ul className="space-y-3">
                {[
                  { name: "Konkan Steels", state: "Verified" },
                  { name: "Ashoka Interiors", state: "In review" },
                  { name: "Metro RMC", state: "Docs pending" },
                ].map((v) => (
                  <li key={v.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-[13px] font-semibold">{v.name}</span>
                    <StatusBadge tone={v.state === "Verified" ? "success" : v.state === "In review" ? "info" : "warning"}>{v.state}</StatusBadge>
                  </li>
                ))}
              </ul>
            </DashCard>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <DashCard title="Monthly spend" className="xl:col-span-2" action={<div className="inline-flex items-center gap-1 text-[12px] font-medium text-success"><TrendingUp className="h-3.5 w-3.5" /> On target</div>}>
              <SpendChart />
            </DashCard>
            <DashCard title="Recent activity"><ActivityList items={RECENT_ACTIVITY} /></DashCard>
          </div>
        </>
      )}

      {xp.slug === "project_manager" && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <DashCard title="Programme performance" description="Planned vs actual — your projects" className="xl:col-span-2">
              <div className="h-[260px] -ml-2">
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
            </DashCard>
            <DashCard title="Approvals awaiting you" description={`${APPROVAL_QUEUE.length} in your queue`}>
              <ul className="space-y-2 -mx-1">
                {APPROVAL_QUEUE.map((a) => (
                  <li key={a.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] font-semibold text-muted-foreground">{a.type}</span>
                      <StatusBadge tone={a.priority === "High" ? "destructive" : "warning"} dot={false} className="!py-0 !text-[10px]">{a.priority}</StatusBadge>
                    </div>
                    <div className="text-[13px] font-semibold mt-0.5">{a.title}</div>
                    <div className="text-[11.5px] text-muted-foreground">{a.submittedBy} · {a.submittedOn}</div>
                  </li>
                ))}
              </ul>
            </DashCard>
          </div>
          <DashCard title="Project health" description="Only projects in your assignment">
            <ProjectHealthTable rows={PROJECT_HEALTH.slice(0, 2)} />
          </DashCard>
        </>
      )}

      {xp.slug === "site_engineer" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <DashCard title="Today's work" description="Assigned to you" className="xl:col-span-2">
            <ul className="divide-y divide-border">
              {ENGINEER_TASKS.map((t) => (
                <li key={t.id} className="py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{t.title}</div>
                    <div className="text-[11.5px] text-muted-foreground">{t.id} · due {t.due}</div>
                  </div>
                  <StatusBadge tone={t.status === "Open" ? "warning" : "info"}>{t.status}</StatusBadge>
                </li>
              ))}
            </ul>
          </DashCard>
          <DashCard title="Open NCRs">
            <ul className="space-y-2">
              {ENGINEER_NCRS.map((n) => (
                <li key={n.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">{n.id}</span>
                    <StatusBadge tone={n.severity === "High" ? "destructive" : n.severity === "Medium" ? "warning" : "neutral"}>{n.severity}</StatusBadge>
                  </div>
                  <div className="text-[13px] font-medium mt-1">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground">{n.age} old</div>
                </li>
              ))}
            </ul>
          </DashCard>
          <DashCard title="Drawings for site" className="xl:col-span-3">
            <div className="grid md:grid-cols-3 gap-3">
              {ENGINEER_DRAWINGS.map((d) => (
                <div key={d.code} className="rounded-lg border border-border p-4">
                  <div className="text-[11px] font-semibold text-muted-foreground">{d.code}</div>
                  <div className="text-[13px] font-semibold mt-1">{d.title}</div>
                  <Button variant="outline" size="sm" className="mt-3">{d.action}</Button>
                </div>
              ))}
            </div>
          </DashCard>
        </div>
      )}

      {xp.slug === "vendor" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <DashCard title="Purchase orders" description="Assigned to your firm" className="xl:col-span-2">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-medium py-2">PO</th>
                  <th className="text-left font-medium py-2">Item</th>
                  <th className="text-right font-medium py-2">Amount</th>
                  <th className="text-left font-medium py-2 pl-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {VENDOR_POS.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-3 font-semibold">{p.id}</td>
                    <td className="py-3 text-muted-foreground">{p.item}</td>
                    <td className="py-3 text-right tabular-nums">{formatCurrency(p.amount)}</td>
                    <td className="py-3 pl-4"><StatusBadge tone={p.status === "Delivered" ? "success" : p.status === "Open" ? "warning" : "info"}>{p.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DashCard>
          <DashCard title="Upcoming deliveries">
            <ul className="space-y-3">
              {VENDOR_DELIVERIES.map((d) => (
                <li key={d.id} className="rounded-lg border border-border p-3">
                  <div className="text-[12px] font-semibold text-muted-foreground">{d.po}</div>
                  <div className="text-[13px] font-semibold mt-0.5">{d.what}</div>
                  <div className="text-[11.5px] text-muted-foreground mt-1">{d.when} · {d.gate}</div>
                </li>
              ))}
            </ul>
          </DashCard>
        </div>
      )}

      {xp.slug === "hr_manager" && <HrDashboardBody />}
    </PageContainer>
  );
}

function ProjectHealthTable({ rows = PROJECT_HEALTH }) {
  return (
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
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border hover:bg-accent/40">
              <td className="px-5 py-3">
                <div className="font-semibold">{p.name}</div>
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
  );
}

function SpendChart() {
  return (
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
  );
}

function HrDashboardBody() {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashCard title="Attendance this week" description="On-roll present vs absent" className="xl:col-span-2">
          <div className="h-[220px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HR_ATTENDANCE_TREND}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Present" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashCard>
        <DashCard title="Headcount mix">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={HR_HEADCOUNT_SPLIT} innerRadius={48} outerRadius={74} paddingAngle={2} dataKey="value">
                  {HR_HEADCOUNT_SPLIT.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {HR_HEADCOUNT_SPLIT.map((c, i) => (
              <li key={c.name} className="flex items-center gap-2 text-[12.5px]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-muted-foreground">{c.name}</span>
                <span className="ml-auto font-semibold tabular-nums">{c.value}</span>
              </li>
            ))}
          </ul>
        </DashCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashCard title="Leave approvals" description="Waiting on HR" action={<Button variant="ghost" size="sm" className="text-primary gap-1">Open HR <ChevronRight className="h-3.5 w-3.5" /></Button>}>
          <ul className="space-y-2">
            {HR_LEAVE_QUEUE.filter((l) => l.status === "Pending").map((l) => (
              <li key={l.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">{l.name}</span>
                  <StatusBadge tone="warning">{l.type}</StatusBadge>
                </div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5">{l.role} · {l.days}</div>
              </li>
            ))}
          </ul>
        </DashCard>
        <DashCard title="Onboarding">
          <ul className="space-y-3">
            {HR_ONBOARDING.map((p) => (
              <li key={p.name} className="flex items-center gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-[11px] font-semibold bg-primary text-primary-foreground">{initials(p.name)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.role} · {p.day}</div>
                </div>
                <StatusBadge tone="info" className="ml-auto" dot={false}>{p.stage}</StatusBadge>
              </li>
            ))}
          </ul>
        </DashCard>
        <DashCard title="Open roles">
          <ul className="space-y-3">
            {HR_OPEN_ROLES.map((r) => (
              <li key={r.title} className="rounded-lg border border-border p-3">
                <div className="text-[13px] font-semibold">{r.title}</div>
                <div className="text-[11.5px] text-muted-foreground mt-0.5">{r.openings} opening · {r.applicants} applicants</div>
              </li>
            ))}
          </ul>
        </DashCard>
      </div>

      <DashCard title="Site manpower today" description="Planned vs present including contractors">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium py-2">Site</th>
              <th className="text-right font-medium py-2">Planned</th>
              <th className="text-right font-medium py-2">Present</th>
              <th className="text-right font-medium py-2">Contractors</th>
              <th className="text-left font-medium py-2 pl-4 w-[180px]">Fill</th>
            </tr>
          </thead>
          <tbody>
            {HR_SITE_MANPOWER.map((s) => (
              <tr key={s.site} className="border-t border-border">
                <td className="py-3 font-semibold">{s.site}</td>
                <td className="py-3 text-right tabular-nums">{s.planned}</td>
                <td className="py-3 text-right tabular-nums">{s.present}</td>
                <td className="py-3 text-right tabular-nums">{s.contractors}</td>
                <td className="py-3 pl-4">
                  <div className="flex items-center gap-2">
                    <Progress value={Math.round((s.present / s.planned) * 100)} className="h-1.5 flex-1" />
                    <span className="text-[12px] tabular-nums w-10 text-right">{Math.round((s.present / s.planned) * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DashCard>
    </>
  );
}
