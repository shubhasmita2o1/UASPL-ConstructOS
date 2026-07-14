 import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, Paperclip, MessageSquare, ListChecks, Activity,
  CalendarDays, User, Folder, Plus, X, Upload, CheckCircle2, Clock,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTask, tasksStore } from "@/hooks/useTasksStore";
import { useProjects } from "@/hooks/useProjectsStore";
import {
  TASK_STATUSES, TASK_STATUS_LABELS, TASK_STATUS_TONES, TASK_PRIORITY_TONES,
} from "@/data/tasks";
import { cn } from "@/lib/utils";

const TABS = [
  { k: "comments", label: "Comments", icon: MessageSquare },
  { k: "subtasks", label: "Subtasks", icon: ListChecks },
  { k: "attachments", label: "Attachments", icon: Paperclip },
  { k: "activity", label: "Activity", icon: Activity },
];

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function TaskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const task = useTask(id);
  const projects = useProjects();
  const { user, hasPermission } = useAuth();
  const caps = {
    edit: hasPermission("task.edit"),
    delete: hasPermission("task.delete"),
  };
  const [tab, setTab] = useState("comments");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!task) {
    return (
      <PageContainer>
        <EmptyState icon={ListChecks} title="Task not found"
          description="It may have been deleted or the link is out of date."
          action={<Button size="sm" onClick={() => navigate("/app/tasks")}>Back to tasks</Button>} />
      </PageContainer>
    );
  }

  const project = projects.find((p) => p.id === task.projectId);
  const doneSubs = (task.subtasks ?? []).filter((s) => s.done).length;
  const totalSubs = (task.subtasks ?? []).length;

  const onDelete = () => {
    tasksStore.remove(task.id);
    toast.success(`Deleted ${task.id}`);
    navigate("/app/tasks");
  };

  return (
    <PageContainer>
      <PageHeader
        title={task.title}
        description={`${task.id} · ${task.type} · Last updated ${fmtDateTime(task.activity?.[0]?.at ?? new Date().toISOString())}`}
        breadcrumbs={[
          { label: "Tasks", to: "/app/tasks" },
          { label: task.id },
        ]}
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/app/tasks"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
            </Button>
            {caps.edit && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate(`/app/tasks?edit=${task.id}`)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {caps.delete && (
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Description">
            {task.description
              ? <p className="text-[13.5px] leading-relaxed text-foreground whitespace-pre-wrap">{task.description}</p>
              : <p className="text-[13px] text-muted-foreground italic">No description provided.</p>}
          </SectionCard>

          <SectionCard bodyClassName="p-0">
            <div className="flex items-center border-b border-border px-2">
              {TABS.map((t) => (
                <button key={t.k} onClick={() => setTab(t.k)}
                  className={cn(
                    "h-11 px-3 text-[13px] font-medium inline-flex items-center gap-1.5 border-b-2 -mb-px transition-colors",
                    tab === t.k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}>
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                  {t.k === "comments" && task.comments?.length > 0 && <span className="text-[10.5px] text-muted-foreground">({task.comments.length})</span>}
                  {t.k === "subtasks" && totalSubs > 0 && <span className="text-[10.5px] text-muted-foreground">({doneSubs}/{totalSubs})</span>}
                  {t.k === "attachments" && task.attachments?.length > 0 && <span className="text-[10.5px] text-muted-foreground">({task.attachments.length})</span>}
                </button>
              ))}
            </div>
            <div className="p-5">
              {tab === "comments" && <CommentsTab task={task} user={user} />}
              {tab === "subtasks" && <SubtasksTab task={task} canEdit={caps.edit} />}
              {tab === "attachments" && <AttachmentsTab task={task} canEdit={caps.edit} />}
              {tab === "activity" && <ActivityTab task={task} />}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Details">
            <dl className="space-y-3 text-[13px]">
              <Row label="Status">
                {caps.edit ? (
                  <select
                    value={task.status}
                    onChange={(e) => { tasksStore.update(task.id, { status: e.target.value }); toast.success("Status updated"); }}
                    className="h-8 rounded-md border border-border bg-background px-2 text-[12.5px]"
                  >
                    {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
                  </select>
                ) : (
                  <StatusBadge tone={TASK_STATUS_TONES[task.status]}>{TASK_STATUS_LABELS[task.status]}</StatusBadge>
                )}
              </Row>
              <Row label="Priority"><StatusBadge dot={false} tone={TASK_PRIORITY_TONES[task.priority]}>{task.priority}</StatusBadge></Row>
              <Row label="Type"><span className="text-foreground">{task.type}</span></Row>
              <Row label="Project" icon={Folder}>
                {project
                  ? <Link to={`/app/projects/${project.id}`} className="text-primary hover:underline">{project.name}</Link>
                  : "—"}
              </Row>
              <Row label="Assignee" icon={User}>
                {task.assignee ? (
                  <span className="inline-flex items-center gap-2">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[9.5px] font-semibold bg-secondary text-secondary-foreground">{task.assignee.avatar}</AvatarFallback></Avatar>
                    {task.assignee.name}
                  </span>
                ) : "Unassigned"}
              </Row>
              <Row label="Due date" icon={CalendarDays}><span className="tabular-nums">{fmtDate(task.dueDate)}</span></Row>
              <Row label="Estimate" icon={Clock}><span className="tabular-nums">{task.estimate ?? 0} h</span></Row>
              {task.tags?.length > 0 && (
                <Row label="Tags">
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((t) => <span key={t} className="text-[10.5px] px-1.5 py-0.5 rounded border border-border bg-muted">{t}</span>)}
                  </div>
                </Row>
              )}
            </dl>
          </SectionCard>

          <SectionCard title="Progress">
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtasks</span>
                <span className="tabular-nums font-medium">{doneSubs}/{totalSubs || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all"
                  style={{ width: totalSubs ? `${(doneSubs / totalSubs) * 100}%` : "0%" }} />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{task.title}</span> will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function Row({ label, icon: Icon, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground text-[12.5px] inline-flex items-center gap-1.5 pt-0.5">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </dt>
      <dd className="text-right min-w-0">{children}</dd>
    </div>
  );
}

function CommentsTab({ task, user }) {
  const [text, setText] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    tasksStore.addComment(task.id, user?.name ?? "You", text.trim());
    setText("");
  };
  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex gap-2">
        <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" />
        <Button type="submit" className="self-start">Post</Button>
      </form>
      {task.comments?.length ? (
        <ul className="space-y-3">
          {task.comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-[10.5px] font-semibold bg-secondary text-secondary-foreground">{c.author.split(" ").map((s) => s[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[12.5px]">
                  <span className="font-semibold">{c.author}</span>
                  <span className="text-muted-foreground">{fmtDateTime(c.at)}</span>
                </div>
                <p className="text-[13px] text-foreground mt-0.5 whitespace-pre-wrap">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground italic text-center py-4">No comments yet.</p>
      )}
    </div>
  );
}

function SubtasksTab({ task, canEdit }) {
  const [title, setTitle] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    tasksStore.addSubtask(task.id, title.trim());
    setTitle("");
  };
  return (
    <div className="space-y-3">
      {canEdit && (
        <form onSubmit={submit} className="flex gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a subtask…" />
          <Button type="submit" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add</Button>
        </form>
      )}
      {task.subtasks?.length ? (
        <ul className="space-y-1.5">
          {task.subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <input type="checkbox" checked={s.done} disabled={!canEdit}
                onChange={() => tasksStore.toggleSubtask(task.id, s.id)}
                className="h-4 w-4 rounded border-border accent-primary" />
              <span className={cn("flex-1 text-[13px]", s.done && "line-through text-muted-foreground")}>{s.title}</span>
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => tasksStore.removeSubtask(task.id, s.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground italic text-center py-4">No subtasks yet.</p>
      )}
    </div>
  );
}

function AttachmentsTab({ task, canEdit }) {
  const onFiles = (e) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => tasksStore.addAttachment(task.id, f.name, f.size));
    e.target.value = "";
    if (files.length) toast.success(`Attached ${files.length} file${files.length > 1 ? "s" : ""}`);
  };
  return (
    <div className="space-y-3">
      {canEdit && (
        <label className="inline-flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 w-full cursor-pointer hover:bg-muted/50 transition-colors">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">Click to upload files (mock — metadata only)</span>
          <input type="file" multiple className="sr-only" onChange={onFiles} />
        </label>
      )}
      {task.attachments?.length ? (
        <ul className="divide-y divide-border rounded-md border border-border">
          {task.attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{a.name}</div>
                <div className="text-[11.5px] text-muted-foreground">{(a.size / 1024).toFixed(1)} KB · {fmtDateTime(a.at)}</div>
              </div>
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => tasksStore.removeAttachment(task.id, a.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground italic text-center py-4">No attachments yet.</p>
      )}
    </div>
  );
}

function ActivityTab({ task }) {
  if (!task.activity?.length) {
    return <p className="text-[13px] text-muted-foreground italic text-center py-4">No activity recorded.</p>;
  }
  return (
    <ol className="relative border-l border-border ml-2 space-y-4 pl-4">
      {task.activity.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
          <div className="text-[13px] font-medium">{a.text}</div>
          <div className="text-[11.5px] text-muted-foreground">{fmtDateTime(a.at)}</div>
        </li>
      ))}
    </ol>
  );
}
