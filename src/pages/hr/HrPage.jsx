import { useMemo, useState } from "react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import StatCard from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users2, Clock, Briefcase, UserPlus, Search } from "lucide-react";
import { HR_DIRECTORY, HR_LEAVE_QUEUE, HR_ONBOARDING, HR_OPEN_ROLES } from "@/data/roleDashboards";
import { initials } from "@/utils/format";

const TONE = {
  Active: "success",
  "On leave": "warning",
  Onboarding: "info",
  Pending: "warning",
  Approved: "success",
};

export default function HrPage() {
  const [q, setQ] = useState("");
  const people = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return HR_DIRECTORY;
    return HR_DIRECTORY.filter((p) =>
      [p.name, p.title, p.dept, p.site, p.type].join(" ").toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <PageContainer>
      <PageHeader
        title="Human Resources"
        description="People, leave, onboarding and open roles for this organization"
        actions={
          <Button size="sm" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> New hire
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="On roll" value="312" icon={Users2} tone="primary" />
        <StatCard label="On leave today" value="8" icon={Clock} tone="warning" />
        <StatCard label="Onboarding" value={String(HR_ONBOARDING.length)} icon={UserPlus} tone="info" />
        <StatCard label="Open roles" value="4" icon={Briefcase} tone="success" />
      </div>

      <Tabs defaultValue="people">
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="roles">Open roles</TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="mt-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" className="pl-8 h-9" />
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40">
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-medium px-4 py-2">Employee</th>
                  <th className="text-left font-medium px-2 py-2">Department</th>
                  <th className="text-left font-medium px-2 py-2">Site</th>
                  <th className="text-left font-medium px-2 py-2">Type</th>
                  <th className="text-left font-medium px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.name} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[11px] font-semibold bg-primary text-primary-foreground">{initials(p.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-[11.5px] text-muted-foreground">{p.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{p.dept}</td>
                    <td className="px-2 py-3 text-muted-foreground">{p.site}</td>
                    <td className="px-2 py-3 text-muted-foreground">{p.type}</td>
                    <td className="px-4 py-3"><StatusBadge tone={TONE[p.status] || "neutral"}>{p.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40">
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-medium px-4 py-2">Request</th>
                  <th className="text-left font-medium px-2 py-2">Type</th>
                  <th className="text-left font-medium px-2 py-2">Dates</th>
                  <th className="text-left font-medium px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {HR_LEAVE_QUEUE.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{l.name}</div>
                      <div className="text-[11.5px] text-muted-foreground">{l.id} · {l.role}</div>
                    </td>
                    <td className="px-2 py-3">{l.type}</td>
                    <td className="px-2 py-3 text-muted-foreground">{l.days}</td>
                    <td className="px-4 py-3"><StatusBadge tone={TONE[l.status]}>{l.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-4 grid md:grid-cols-3 gap-3">
          {HR_ONBOARDING.map((p) => (
            <div key={p.name} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-[11px] font-semibold bg-primary text-primary-foreground">{initials(p.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-[13px] font-semibold">{p.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">{p.role}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">{p.day}</span>
                <StatusBadge tone="info">{p.stage}</StatusBadge>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="roles" className="mt-4 grid md:grid-cols-3 gap-3">
          {HR_OPEN_ROLES.map((r) => (
            <div key={r.title} className="rounded-xl border border-border p-4">
              <div className="text-[14px] font-semibold">{r.title}</div>
              <div className="text-[12.5px] text-muted-foreground mt-1">{r.openings} opening · {r.applicants} applicants</div>
              <Button variant="outline" size="sm" className="mt-3">View pipeline</Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
