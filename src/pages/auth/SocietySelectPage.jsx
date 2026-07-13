import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, MapPin, Building, Check, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/common/StatusBadge";

const PHASE_TONE = { Execution: "info", Planning: "warning", Approvals: "warning", Design: "primary", Handover: "success" };

export default function SocietySelectPage() {
  const { org, societies, setSociety, societyId } = useWorkspace();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(societyId);
  const [pending, setPending] = useState(false);

  if (!org) return <Navigate to="/auth/select-organization" replace />;

  const proceed = async () => {
    if (!selected) return;
    setPending(true);
    try {
      await setSociety(selected);
      navigate("/app/dashboard", { replace: true });
    } catch {
      toast.error("Couldn't select that society");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/auth/select-organization")} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Change organization
      </button>

      <div>
        <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground font-semibold">Step 2 of 2</div>
        <h2 className="text-[24px] font-semibold tracking-tight mt-1">Select a society</h2>
        <p className="text-[13.5px] text-muted-foreground mt-1">
          Working in <span className="text-foreground font-medium">{org.name}</span> · {societies.length} societies
        </p>
      </div>

      <div className="space-y-2 max-h-[440px] overflow-auto scrollbar-thin pr-1">
        {societies.map((s) => {
          const active = selected === s.id;
          return (
            <button key={s.id} onClick={() => setSelected(s.id)} className={cn(
              "w-full text-left rounded-xl border p-4 flex items-center gap-4 transition-all",
              active ? "border-primary bg-primary/5 shadow-card" : "border-border hover:border-primary/40 hover:bg-accent/40",
            )}>
              <div className="h-11 w-11 rounded-lg bg-secondary text-secondary-foreground grid place-items-center shrink-0">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-[14px] truncate">{s.name}</div>
                  <StatusBadge tone={PHASE_TONE[s.phase] ?? "neutral"}>{s.phase}</StatusBadge>
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.address}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {s.buildings} buildings</span>
                  <span>·</span>
                  <span>{s.units} units</span>
                </div>
              </div>
              <div className={cn("h-5 w-5 rounded-full border grid place-items-center shrink-0", active ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {active && <Check className="h-3 w-3" />}
              </div>
            </button>
          );
        })}
      </div>

      <Button className="w-full h-10 gap-2" disabled={!selected || pending} onClick={proceed}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enter workspace <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </div>
  );
}
