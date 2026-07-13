import { useMemo, useState } from "react";
import {
  Plus, Search, Filter, List, KanbanSquare, X, MoreHorizontal, Pencil, Trash2,
  ListChecks, CheckCircle2, AlertTriangle, Clock, CalendarDays, Download,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import SectionCard from "@/components/common/SectionCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, tasksStore } from "@/hooks/useTasksStore";
import { useProjects } from "@/hooks/useProjectsStore";
import {
  TASK_STATUSES, TASK_STATUS_LABELS, TASK_STATUS_TONES,
  TASK_PRIORITIES, TASK_PRIORITY_TONES, TASK_TYPES, TASK_ASSIGNEES, taskCapsFor,
} from "@/data/tasks";
import { cn } from "@/lib/utils";

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function isOverdue(iso, status) {
  if (!iso || status === "done") return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

export default function TasksPage() {
  const { user } = useAuth();
  const caps = taskCapsFor(user?.role);
  const tasks = useTasks();
  const projects = useProjects();

  const [view, setView] = useState("list");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [editing, setEditing] = useState(null); // task or {} for new
  const [toDelete, setToDelete] = useState(null);

  const projectName = (id) => projects.find((p) => p.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const term = q.trim().toLowerCase();
      if (term && !`${t.title} ${t.id} ${projectName(t.projectId)}`.toLowerCase().includes(term)) return false;
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (projectId !== "all" && t.projectId !== projectId) return false;
      if (assignee !== "all" && t.assignee?.id !== assignee) return false;
      return true;
    });
  }, [tasks, q, status, priority, projectId, assignee, projects]);

  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "done").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
    const dueToday = tasks.filter((t) => t.dueDate === new Date().toISOString().slice(0, 10) && t.status !== "done").length;
    return { total: tasks.length, open, done, overdue, dueToday };
  }, [tasks]);

  const filtersActive = q || status !== "all" || priority !== "all" || projectId !== "all" || assignee !== "all";
  const resetFilters = () => { setQ(""); setStatus("all"); setPriority("all"); setProjectId("all"); setAssignee("all"); };

  const confirmDelete = () => {
    if (!toDelete) return;
    tasksStore.remove(toDelete.id);
    toast.success(`Deleted ${toDelete.id}`);
    setToDelete(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Tasks"
        description="Track every work item across your active society — approvals, inspections, delivery tasks and milestones."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Export queued")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            {caps.create && (
              <Button size="sm" className="gap-1.5" onClick={() => setEditing({})}>
                <Plus className="h-3.5 w-3.5" /> New task
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total tasks" value={String(stats.total)} delta={3} icon={ListChecks} tone="primary" />
        <StatCard label="Open" value={String(stats.open)} delta={-1} icon={Clock} tone="info" />
        <StatCard label="Overdue" value={String(stats.overdue)} delta={stats.overdue > 0 ? 8 : 0} icon={AlertTriangle} tone="warning" />
        <StatCard label="Completed" value={String(stats.done)} delta={5} icon={CheckCircle2} tone="success" />
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks, IDs, projects" className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterSelect icon={Filter} value={status} onChange={setStatus} placeholder="Status"
              options={[["all", "All statuses"], ...TASK_STATUSES.map((s) => [s, TASK_STATUS_LABELS[s]])]} />
            <FilterSelect value={priority} onChange={setPriority} placeholder="Priority"
              options={[["all", "All priorities"], ...TASK_PRIORITIES.map((p) => [p, p])]} />
            <FilterSelect value={projectId} onChange={setProjectId} placeholder="Project"
              options={[["all", "All projects"], ...projects.map((p) => [p.id, p.name])]} />
            <FilterSelect value={assignee} onChange={setAssignee} placeholder="Assignee"
              options={[["all", "Anyone"], ...TASK_ASSIGNEES.map((a) => [a.id, a.name])]} />
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
            <span className="font-medium text-foreground">{filtered.length}</span> results
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={ListChecks}
              title="No tasks match your filters"
              description="Adjust your search or filters, or create a new task to get started."
              action={filtersActive
                ? <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
                : caps.create && <Button size="sm" className="gap-1.5" onClick={() => setEditing({})}><Plus className="h-3.5 w-3.5" /> New task</Button>}
            />
          </div>
        ) : view === "list" ? (
          <ListView tasks={filtered} caps={caps} projectName={projectName} onEdit={setEditing} onDelete={setToDelete} />
        ) : (
          <KanbanView tasks={filtered} caps={caps} projectName={projectName} onEdit={setEditing} />
        )}
      </SectionCard>

      {editing && (
        <TaskDialog
          task={editing}
          projects={projects}
          onClose={() => setEditing(null)}
          onSave={(payload) => {
            if (editing.id) {
              tasksStore.update(editing.id, payload);
              toast.success(`Updated ${editing.id}`);
            } else {
              const t = tasksStore.create(payload);
              toast.success(`Created ${t.id}`);
            }
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{toDelete?.title}</span> will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
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
      <SelectTrigger className="h-9 min-w-[140px] text-[12.5px]">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function RowActions({ task, caps, onEdit, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {caps.edit && (
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {TASK_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onClick={() => { tasksStore.update(task.id, { status: s }); toast.success(`Moved to ${TASK_STATUS_LABELS[s]}`); }}>
            Move to {TASK_STATUS_LABELS[s]}
          </DropdownMenuItem>
        ))}
        {caps.delete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ListView({ tasks, caps, projectName, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <th className="text-left font-medium px-5 py-2.5">Task</th>
            <th className="text-left font-medium px-2 py-2.5">Project</th>
            <th className="text-left font-medium px-2 py-2.5">Status</th>
            <th className="text-left font-medium px-2 py-2.5">Priority</th>
            <th className="text-left font-medium px-2 py-2.5">Assignee</th>
            <th className="text-left font-medium px-2 py-2.5">Due</th>
            <th className="px-5 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-t border-border hover:bg-accent/40 transition-colors">
              <td className="px-5 py-3">
                <button onClick={() => caps.edit && onEdit(t)} className="text-left">
                  <div className="font-semibold text-foreground hover:text-primary">{t.title}</div>
                  <div className="text-[11.5px] text-muted-foreground">{t.id} · {t.type}</div>
                </button>
              </td>
              <td className="px-2 py-3 text-muted-foreground">{projectName(t.projectId)}</td>
              <td className="px-2 py-3"><StatusBadge tone={TASK_STATUS_TONES[t.status]}>{TASK_STATUS_LABELS[t.status]}</StatusBadge></td>
              <td className="px-2 py-3"><StatusBadge dot={false} tone={TASK_PRIORITY_TONES[t.priority]}>{t.priority}</StatusBadge></td>
              <td className="px-2 py-3">
                {t.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[9.5px] font-semibold bg-secondary text-secondary-foreground">{t.assignee.avatar}</AvatarFallback></Avatar>
                    <span className="text-[12.5px]">{t.assignee.name}</span>
                  </div>
                ) : <span className="text-muted-foreground">Unassigned</span>}
              </td>
              <td className={cn("px-2 py-3 tabular-nums", isOverdue(t.dueDate, t.status) && "text-destructive font-medium")}>
                {fmtDate(t.dueDate)}
              </td>
              <td className="px-5 py-3 text-right"><RowActions task={t} caps={caps} onEdit={onEdit} onDelete={onDelete} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KanbanView({ tasks, caps, projectName, onEdit }) {
  const grouped = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const onDragStart = (e, id) => e.dataTransfer.setData("text/plain", id);
  const onDrop = (e, status) => {
    const id = e.dataTransfer.getData("text/plain");
    if (id) { tasksStore.update(id, { status }); toast.success(`Moved to ${TASK_STATUS_LABELS[status]}`); }
  };

  return (
    <div className="p-5 overflow-x-auto">
      <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4">
        {TASK_STATUSES.map((s) => (
          <div key={s}
               onDragOver={(e) => e.preventDefault()}
               onDrop={(e) => onDrop(e, s)}
               className="rounded-xl border border-border bg-muted/30 flex flex-col min-h-[300px]">
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge tone={TASK_STATUS_TONES[s]}>{TASK_STATUS_LABELS[s]}</StatusBadge>
                <span className="text-[11.5px] text-muted-foreground tabular-nums">{grouped[s].length}</span>
              </div>
            </div>
            <div className="p-2.5 flex flex-col gap-2">
              {grouped[s].map((t) => (
                <div key={t.id}
                     draggable={caps.edit}
                     onDragStart={(e) => onDragStart(e, t.id)}
                     onClick={() => caps.edit && onEdit(t)}
                     className="rounded-lg border border-border bg-card p-3 shadow-sm cursor-pointer hover:border-primary/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-[13px] leading-snug">{t.title}</div>
                    <StatusBadge dot={false} tone={TASK_PRIORITY_TONES[t.priority]} className="!text-[10px] shrink-0">{t.priority}</StatusBadge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{t.id} · {projectName(t.projectId)}</div>
                  <div className="mt-2.5 flex items-center justify-between">
                    {t.assignee && (
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[9.5px] font-semibold bg-secondary text-secondary-foreground">{t.assignee.avatar}</AvatarFallback></Avatar>
                    )}
                    <div className={cn("text-[11.5px] tabular-nums text-muted-foreground inline-flex items-center gap-1", isOverdue(t.dueDate, t.status) && "text-destructive font-medium")}>
                      <CalendarDays className="h-3 w-3" /> {fmtDate(t.dueDate)}
                    </div>
                  </div>
                </div>
              ))}
              {grouped[s].length === 0 && (
                <div className="text-[12px] text-muted-foreground text-center py-6">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskDialog({ task, projects, onClose, onSave }) {
  const isEdit = !!task.id;
  const [form, setForm] = useState({
    title: task.title ?? "",
    type: task.type ?? "Task",
    status: task.status ?? "todo",
    priority: task.priority ?? "Medium",
    projectId: task.projectId ?? projects[0]?.id ?? "",
    assigneeId: task.assignee?.id ?? TASK_ASSIGNEES[0].id,
    dueDate: task.dueDate ?? new Date().toISOString().slice(0, 10),
    estimate: task.estimate ?? 1,
    description: task.description ?? "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    const assignee = TASK_ASSIGNEES.find((a) => a.id === form.assigneeId);
    onSave({
      title: form.title.trim(),
      type: form.type, status: form.status, priority: form.priority,
      projectId: form.projectId, assignee,
      dueDate: form.dueDate, estimate: Number(form.estimate) || 1,
      description: form.description,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${task.id}` : "New task"}</DialogTitle>
          <DialogDescription>Capture work, set an owner and a due date.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Short, action-led title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormSelect label="Type" value={form.type} onChange={(v) => set("type", v)} options={TASK_TYPES.map((t) => [t, t])} />
            <FormSelect label="Priority" value={form.priority} onChange={(v) => set("priority", v)} options={TASK_PRIORITIES.map((p) => [p, p])} />
            <FormSelect label="Status" value={form.status} onChange={(v) => set("status", v)} options={TASK_STATUSES.map((s) => [s, TASK_STATUS_LABELS[s]])} />
            <FormSelect label="Project" value={form.projectId} onChange={(v) => set("projectId", v)} options={projects.map((p) => [p.id, p.name])} />
            <FormSelect label="Assignee" value={form.assigneeId} onChange={(v) => set("assigneeId", v)} options={TASK_ASSIGNEES.map((a) => [a.id, a.name])} />
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional details, acceptance criteria, links" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
