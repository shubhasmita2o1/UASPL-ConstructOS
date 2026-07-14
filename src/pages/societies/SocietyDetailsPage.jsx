import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Pencil, Trash2, Landmark, Building2, MapPin, Phone, FileText,
  Calendar, Home, ClipboardCheck,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSociety, societiesStore } from "@/hooks/useSocietiesStore";
import { SOCIETY_PHASE_TONE } from "@/data/societies";
import { initials } from "@/utils/format";

export default function SocietyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const caps = {
    edit: hasPermission("society.edit"),
    delete: hasPermission("society.delete"),
  };
  const society = useSociety(id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!society) {
    return (
      <PageContainer>
        <SectionCard title="Society not found">
          <p className="text-[13px] text-muted-foreground mb-3">The society you're looking for doesn't exist or was removed.</p>
          <Link to="/app/societies" className="text-primary text-[13px]">Back to societies</Link>
        </SectionCard>
      </PageContainer>
    );
  }

  const doDelete = () => {
    societiesStore.remove(society.id);
    toast.success(`Deleted ${society.name}`);
    navigate("/app/societies");
  };

  return (
    <PageContainer>
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link to="/app/societies" className="hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Societies
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{society.name}</span>
      </div>

      <PageHeader
        title={society.name}
        description={society.address}
        actions={
          <>
            {caps.edit && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/app/societies/${society.id}/edit`)}>
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

      {/* Identity card */}
      <SectionCard>
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="h-16 w-16 rounded-xl grid place-items-center bg-primary/10 text-primary font-semibold text-lg shrink-0">
            {initials(society.name)}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] font-semibold text-foreground">{society.name}</h2>
              <StatusBadge tone={SOCIETY_PHASE_TONE[society.phase] ?? "neutral"}>{society.phase}</StatusBadge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-[12.5px]">
              <InfoRow icon={MapPin} label={society.address || "—"} />
              <InfoRow icon={Building2} label={society.orgName || "—"} />
              <InfoRow icon={FileText} label={`Registration · ${society.registrationNo || "—"}`} />
              <InfoRow icon={Calendar} label={`Registered ${society.registeredOn || "—"}`} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Buildings" value={String(society.buildings ?? 0)} icon={Building2} tone="info" />
        <StatCard label="Units" value={String(society.units ?? 0)} icon={Home} tone="success" />
        <StatCard label="Redevelopment consent" value={`${society.consentPct ?? 0}%`} icon={ClipboardCheck} tone="primary" />
        <StatCard label="Phase" value={society.phase} icon={Landmark} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Structure & consent */}
          <SectionCard title="Structure & consent" description="Physical footprint and redevelopment consent status.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <StatMini label="Buildings" value={society.buildings ?? 0} />
              <StatMini label="Units" value={society.units ?? 0} />
              <StatMini label="Plot area" value={society.area ? `${society.area} sq.m` : "—"} />
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Redevelopment consent</span><span className="tabular-nums">{society.consentPct ?? 0}%</span>
              </div>
              <Progress value={society.consentPct ?? 0} className="h-1.5" />
            </div>
          </SectionCard>

          {/* Registration */}
          <SectionCard title="Registration" description="Cooperative registration and statutory records.">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <Review label="Registration number" value={society.registrationNo} />
              <Review label="Registered on" value={society.registeredOn} />
            </dl>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Managing committee */}
          <SectionCard title="Managing committee" description="Primary contacts for this society.">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 text-[11px] font-semibold">
                  {initials(society.chairperson && society.chairperson !== "—" ? society.chairperson : "Chairperson")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-foreground truncate">{society.chairperson || "—"}</div>
                  <div className="text-[11.5px] text-muted-foreground">Chairperson</div>
                  {society.chairPhone && (
                    <InfoRow icon={Phone} label={society.chairPhone} className="mt-1" />
                  )}
                </div>
              </div>
              {society.secretary && (
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 text-[11px] font-semibold">
                    {initials(society.secretary)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-foreground truncate">{society.secretary}</div>
                    <div className="text-[11.5px] text-muted-foreground">Secretary</div>
                    {society.secretaryPhone && (
                      <InfoRow icon={Phone} label={society.secretaryPhone} className="mt-1" />
                    )}
                  </div>
                </div>
              )}
              {society.notes && (
                <div className="pt-3 border-t border-border">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Notes</div>
                  <p className="text-[12.5px] text-foreground/90">{society.notes}</p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete society?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{society.name}</span> and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete society
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function StatMini({ label, value }) {
  return (
    <div>
      <div className="text-[15px] font-semibold tabular-nums">{value}</div>
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Review({ label, value, className }) {
  return (
    <div className={className}>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-[13px] text-foreground mt-0.5 break-words">{value || "—"}</dd>
    </div>
  );
}

function InfoRow({ icon: Icon, label, className }) {
  return (
    <div className={`flex items-center gap-2 text-[12.5px] text-muted-foreground ${className ?? ""}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate text-foreground/90">{label}</span>
    </div>
  );
}
