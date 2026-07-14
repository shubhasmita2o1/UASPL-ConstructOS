import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, HardHat } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProject, projectsStore } from "@/hooks/useProjectsStore";
import { PROJECT_PHASES, PROJECT_PRIORITIES } from "@/data/projects";
import { SOCIETIES } from "@/data/mockData";

const HEALTH = ["on-track", "at-risk", "delayed", "paused"];

const emptyForm = {
  name: "", code: "", location: "", societyId: "", phase: "Design",
  priority: "Medium", health: "on-track", startDate: "", endDate: "",
  budget: 0, spend: 0, progress: 0, description: "", tags: "",
};

export default function ProjectFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { org, societies } = useWorkspace();
  const caps = {
    create: hasPermission("project.create"),
    edit: hasPermission("project.edit"),
    delete: hasPermission("project.delete"),
  };
  const existing = useProject(id);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const societyOptions = societies?.length ? societies : (org ? SOCIETIES[org.id] ?? [] : []);
  const canProceed = mode === "create" ? caps.create : caps.edit;

  useEffect(() => {
    if (mode === "edit" && existing) {
      setForm({
        name: existing.name,
        code: existing.code,
        location: existing.location,
        societyId: existing.societyId,
        phase: existing.phase,
        priority: existing.priority,
        health: existing.health,
        startDate: existing.startDate,
        endDate: existing.endDate,
        budget: existing.budget,
        spend: existing.spend,
        progress: existing.progress,
        description: existing.description,
        tags: (existing.tags ?? []).join(", "),
      });
    }
  }, [mode, existing?.id]);

  if (!canProceed) {
    return (
      <PageContainer>
        <EmptyState
          icon={HardHat}
          title="You don't have access"
          description={`Your role (${user?.role}) can't ${mode === "create" ? "create" : "edit"} projects. Ask an admin to grant you the right permissions.`}
          action={<Button size="sm" variant="outline" onClick={() => navigate("/app/projects")}><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to projects</Button>}
        />
      </PageContainer>
    );
  }

  if (mode === "edit" && !existing) {
    return (
      <PageContainer>
        <EmptyState icon={HardHat} title="Project not found" description="It may have been deleted." action={<Button size="sm" onClick={() => navigate("/app/projects")}>Back to projects</Button>} />
      </PageContainer>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.code.trim()) next.code = "Code is required";
    if (!form.location.trim()) next.location = "Location is required";
    if (!form.societyId) next.societyId = "Select a society";
    if (Number(form.budget) <= 0) next.budget = "Budget must be greater than 0";
    if (form.startDate && form.endDate && form.startDate > form.endDate) next.endDate = "End date must be after start";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    const society = societyOptions.find((s) => s.id === form.societyId);
    const payload = {
      ...form,
      societyName: society?.name ?? "",
      orgId: org?.id,
      budget: Number(form.budget),
      spend: Number(form.spend),
      progress: Number(form.progress),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      manager: existing?.manager ?? { id: user?.id ?? "u-current", name: user?.name ?? "You", avatar: (user?.name ?? "You").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() },
      team: existing?.team ?? [],
    };
    if (mode === "create") {
      const created = projectsStore.create(payload);
      toast.success(`${created.name} created`);
      navigate(`/app/projects/${created.id}`);
    } else {
      projectsStore.update(existing.id, payload);
      toast.success("Project updated");
      navigate(`/app/projects/${existing.id}`);
    }
  };

  return (
    <PageContainer>
      <div>
        <Link to={mode === "edit" ? `/app/projects/${existing.id}` : "/app/projects"} className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {mode === "edit" ? "Back to project" : "Back to projects"}
        </Link>
      </div>

      <PageHeader
        title={mode === "create" ? "New project" : `Edit — ${existing.name}`}
        description={mode === "create" ? "Set up a new redevelopment programme in this workspace." : "Update project details, timelines and financials."}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={onSubmit}><Save className="h-3.5 w-3.5" /> {mode === "create" ? "Create project" : "Save changes"}</Button>
          </>
        }
      />

      <form onSubmit={onSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <SectionCard title="Project basics" description="Name, identifier and where the work happens.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Project name" error={errors.name} required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Sea Pearl Towers" />
              </Field>
              <Field label="Project code" error={errors.code} required>
                <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="SPT-BAN-24" />
              </Field>
              <Field label="Society" error={errors.societyId} required>
                <Select value={form.societyId} onValueChange={(v) => set("societyId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select society" /></SelectTrigger>
                  <SelectContent>
                    {societyOptions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Location" error={errors.location} required>
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Bandra West, Mumbai" />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What this project covers, scope and any notable constraints." className="min-h-[100px]" />
              </Field>
              <Field label="Tags" className="md:col-span-2" hint="Comma separated">
                <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Redevelopment, Highrise, RERA" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Timeline & status">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phase">
                <Select value={form.phase} onValueChange={(v) => set("phase", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROJECT_PHASES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROJECT_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Health">
                <Select value={form.health} onValueChange={(v) => set("health", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{HEALTH.map((h) => <SelectItem key={h} value={h}>{h.replace("-", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Progress (%)">
                <Input type="number" min={0} max={100} value={form.progress} onChange={(e) => set("progress", e.target.value)} />
              </Field>
              <Field label="Start date">
                <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </Field>
              <Field label="Target end date" error={errors.endDate}>
                <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Financials">
            <div className="space-y-4">
              <Field label="Budget (₹ Lakhs)" error={errors.budget} required>
                <Input type="number" min={0} value={form.budget} onChange={(e) => set("budget", e.target.value)} />
              </Field>
              <Field label="Committed spend (₹ Lakhs)">
                <Input type="number" min={0} value={form.spend} onChange={(e) => set("spend", e.target.value)} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Owner">
            <div className="text-[12.5px] text-muted-foreground">Created by</div>
            <div className="mt-1 text-[13px] font-semibold">{user?.name}</div>
            <div className="text-[11.5px] text-muted-foreground">{user?.title}</div>
          </SectionCard>
        </div>

        <button type="submit" className="sr-only">Submit</button>
      </form>
    </PageContainer>
  );
}

function Field({ label, error, required, hint, children, className }) {
  return (
    <div className={className}>
      <Label className="text-[12px] font-medium text-foreground flex items-center gap-1">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
      {error && <div className="text-[11px] text-destructive mt-1">{error}</div>}
    </div>
  );
}
