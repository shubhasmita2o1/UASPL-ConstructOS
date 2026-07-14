import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, Trash2, Download, HardHat, MapPin, Calendar,
  IndianRupee, Users2, AlertTriangle, TrendingUp, Paperclip,
  Send, FileText, File as FileIcon, FileSpreadsheet, FileArchive,
  CheckCircle2, Circle, Clock, MessageSquare, Milestone,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProject, projectsStore } from "@/hooks/useProjectsStore";
import {
  PROJECT_HEALTH_TONES, activityFor, attachmentsFor, commentsFor, milestonesFor,
} from "@/data/projects";
import { formatCurrency, initials } from "@/utils/format";
import { cn } from "@/lib/utils";

const PRIORITY_TONE = { Low: "neutral", Medium: "info", High: "warning", Critical: "destructive" };
const FILE_ICON = { pdf: FileText, dwg: FileIcon, xlsx: FileSpreadsheet, zip: FileArchive };

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const caps = {
    create: hasPermission("project.create"),
    edit: hasPermission("project.edit"),
    delete: hasPermission("project.delete"),
  };
  const project = useProject(id);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 220);
    return () => clearTimeout(t);
  }, [id]);

  useEffect(() => {
    if (project) setComments(commentsFor(project.id));
  }, [project?.id]);

  const activity = useMemo(() => (project ? activityFor(project.id) : []), [project?.id]);
  const attachments = useMemo(() => (project ? attachmentsFor(project.id) : []), [project?.id]);
  const milestones = useMemo(() => (project ? milestonesFor(project.id) : []), [project?.id]);

  if (loading) return <ProjectDetailsSkeleton />;

  if (!project) {
    return (
      <PageContainer>
        <EmptyState
          icon={HardHat}
          title="Project not found"
          description="The project you're looking for doesn't exist or has been deleted."
          action={<Button size="sm" onClick={() => navigate("/app/projects")} className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back to projects</Button>}
        />
      </PageContainer>
    );
  }

  const budgetUsed = Math.round((project.spend / project.budget) * 100);

  const handleDelete = () => {
    projectsStore.remove(project.id);
    toast.success(`Deleted ${project.name}`);
    navigate("/app/projects");
  };

  const addComment = () => {
    if (!comment.trim()) return;
    setComments((prev) => [
      { id: `c-${Date.now()}`, user: user?.name ?? "You", avatar: initials(user?.name ?? "You"), role: user?.title ?? "Member", time: "Just now", body: comment.trim() },
      ...prev,
    ]);
    setComment("");
    toast.success("Comment posted");
  };

  return (
    <PageContainer>
      <div>
        <Link to="/app/projects" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>
      </div>

      <PageHeader
        title={project.name}
        description={
          <span className="inline-flex items-center gap-3 flex-wrap">
            <span className="font-medium text-foreground">{project.code}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {project.location}</span>
            <span>·</span>
            <span>{project.societyName}</span>
          </span>
        }
        actions={
          <>
            <StatusBadge tone={PROJECT_HEALTH_TONES[project.health]}>{project.health.replace("-", " ")}</StatusBadge>
            <StatusBadge dot={false} tone={PRIORITY_TONE[project.priority]}>{project.priority}</StatusBadge>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Export queued")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            {caps.edit && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/app/projects/${project.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {caps.delete && (
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Progress" value={`${project.progress}%`} icon={TrendingUp} tone="primary" />
        <StatCard label="Budget utilised" value={`${budgetUsed}%`} icon={IndianRupee} tone={budgetUsed > 90 ? "warning" : "success"} />
        <StatCard label="Open risks" value={String(project.risks)} icon={AlertTriangle} tone={project.risks > 2 ? "destructive" : "warning"} />
        <StatCard label="Team members" value={String(project.team.length)} icon={Users2} tone="info" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Tabs defaultValue="overview">
            <TabsList className="h-9">
              <TabsTrigger value="overview" className="text-[12.5px] px-3">Overview</TabsTrigger>
              <TabsTrigger value="activity" className="text-[12.5px] px-3">Activity</TabsTrigger>
              <TabsTrigger value="comments" className="text-[12.5px] px-3">Comments</TabsTrigger>
              <TabsTrigger value="attachments" className="text-[12.5px] px-3">Attachments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <SectionCard title="About this project">
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.tags.map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 border border-border">{t}</span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetaItem label="Phase" value={project.phase} />
                  <MetaItem label="Start date" value={project.startDate} icon={Calendar} />
                  <MetaItem label="Target end" value={project.endDate} icon={Calendar} />
                  <MetaItem label="Budget" value={formatCurrency(project.budget)} icon={IndianRupee} />
                </div>
              </SectionCard>

              <SectionCard title="Programme progress" description={`${project.milestonesCompleted} of ${project.milestonesTotal} milestones complete`}>
                <div className="flex items-center gap-3 mb-4">
                  <Progress value={project.progress} className="h-2 flex-1" />
                  <span className="text-[13px] font-semibold tabular-nums w-10 text-right">{project.progress}%</span>
                </div>
                <ol className="space-y-3">
                  {milestones.map((m) => (
                    <li key={m.id} className="flex items-start gap-3">
                      <div className={cn("h-7 w-7 rounded-full grid place-items-center shrink-0 border",
                        m.status === "done" ? "bg-success/10 border-success/30 text-success" :
                        m.status === "in-progress" ? "bg-primary/10 border-primary/30 text-primary" :
                        "bg-muted border-border text-muted-foreground")}>
                        {m.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : m.status === "in-progress" ? <Clock className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-foreground">{m.name}</div>
                        <div className="text-[11.5px] text-muted-foreground mt-0.5">{m.date}</div>
                      </div>
                      <StatusBadge tone={m.status === "done" ? "success" : m.status === "in-progress" ? "primary" : "neutral"} dot={false} className="!text-[10.5px]">
                        {m.status.replace("-", " ")}
                      </StatusBadge>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <SectionCard title="Activity timeline" description="All events across this project">
                <ol className="space-y-3 relative">
                  <span className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                  {activity.map((a) => (
                    <li key={a.id} className="flex gap-3 relative">
                      <Avatar className="h-8 w-8 border-2 border-background z-10">
                        <AvatarFallback className="text-[10.5px] font-semibold bg-secondary text-secondary-foreground">{a.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="text-[12.5px] leading-tight">
                          <span className="font-semibold text-foreground">{a.user}</span>
                          <span className="text-muted-foreground"> {a.action} </span>
                          <span className="font-medium text-foreground">{a.target}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{a.time}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <SectionCard title="Comments" description={`${comments.length} messages`}>
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[10.5px] font-semibold bg-primary text-primary-foreground">{initials(user?.name ?? "You")}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave a comment, mention a teammate or attach a note…" className="min-h-[80px] resize-none text-[13px]" />
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" onClick={addComment} disabled={!comment.trim()} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" /> Post comment
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {comments.length === 0 ? (
                    <EmptyState icon={MessageSquare} title="No comments yet" description="Be the first to add a note or update on this project." />
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar className="h-8 w-8"><AvatarFallback className="text-[10.5px] font-semibold bg-secondary text-secondary-foreground">{c.avatar}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0 rounded-lg border border-border bg-background p-3">
                          <div className="flex items-center gap-2 text-[12px]">
                            <span className="font-semibold text-foreground">{c.user}</span>
                            <span className="text-muted-foreground">· {c.role}</span>
                            <span className="text-muted-foreground ml-auto">{c.time}</span>
                          </div>
                          <p className="text-[12.5px] text-foreground mt-1.5 leading-relaxed">{c.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <SectionCard
                title="Attachments"
                description={`${attachments.length} files`}
                action={caps.edit && <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info("Upload dialog opens here")}><Paperclip className="h-3.5 w-3.5" /> Upload</Button>}
              >
                {attachments.length === 0 ? (
                  <EmptyState icon={Paperclip} title="No attachments" description="Upload drawings, reports and site photos to keep everything in one place." />
                ) : (
                  <ul className="divide-y divide-border -my-2">
                    {attachments.map((a) => {
                      const Icon = FILE_ICON[a.type] ?? FileIcon;
                      return (
                        <li key={a.id} className="py-3 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium text-foreground truncate">{a.name}</div>
                            <div className="text-[11.5px] text-muted-foreground">{a.size} · uploaded by {a.uploader} · {a.uploadedOn}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Downloading…")}><Download className="h-4 w-4" /></Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <SectionCard title="Team">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="text-[11px] font-semibold bg-primary text-primary-foreground">{project.manager.avatar}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-foreground truncate">{project.manager.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">Project Manager</div>
                </div>
              </li>
              {project.team.filter((m) => m.id !== project.manager.id).map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback className="text-[11px] font-semibold bg-secondary text-secondary-foreground">{m.avatar}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-foreground truncate">{m.name}</div>
                    <div className="text-[11.5px] text-muted-foreground">Team member</div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Financials">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                  <span className="text-muted-foreground">Committed spend</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(project.spend)}</span>
                </div>
                <Progress value={budgetUsed} className="h-1.5" />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                  <span>{budgetUsed}% of budget</span>
                  <span className="tabular-nums">Budget {formatCurrency(project.budget)}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Quick facts">
            <dl className="space-y-3 text-[12.5px]">
              <FactRow icon={Milestone} label="Milestones" value={`${project.milestonesCompleted} / ${project.milestonesTotal}`} />
              <FactRow icon={AlertTriangle} label="Open risks" value={project.risks} />
              <FactRow icon={Calendar} label="Timeline" value={`${project.startDate} → ${project.endDate}`} />
              <FactRow icon={MapPin} label="Location" value={project.location} />
            </dl>
          </SectionCard>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{project.name}</span> ({project.code}) will be removed permanently. Team members will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function MetaItem({ label, value, icon: Icon }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="mt-1 text-[13px] font-semibold text-foreground inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />} {value}
      </div>
    </div>
  );
}

function FactRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function ProjectDetailsSkeleton() {
  return (
    <PageContainer>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Skeleton className="h-[420px] xl:col-span-2 rounded-xl" />
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    </PageContainer>
  );
}
