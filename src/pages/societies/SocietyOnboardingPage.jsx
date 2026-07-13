import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Save, X, Check, Landmark, Building2,
  FileText, Users2, ClipboardCheck,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ORGANIZATIONS } from "@/data/mockData";
import { SOCIETY_PHASES, SOCIETY_PHASE_TONE } from "@/data/societies";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "profile", label: "Society profile", icon: Landmark },
  { id: "structure", label: "Structure", icon: Building2 },
  { id: "registration", label: "Registration", icon: FileText },
  { id: "committee", label: "Committee", icon: Users2 },
  { id: "review", label: "Review", icon: ClipboardCheck },
];

const EMPTY = {
  name: "", orgId: "", address: "", city: "", phase: "Feasibility",
  buildings: "", units: "", consentPct: "",
  registrationNo: "", registeredOn: "", area: "",
  chairperson: "", chairPhone: "", secretary: "", secretaryPhone: "",
  notes: "",
};

export default function SocietyOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: value }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validateStep = (idx) => {
    const err = {};
    if (idx === 0) {
      if (!form.name.trim()) err.name = "Society name is required";
      if (!form.orgId) err.orgId = "Select an organization";
      if (!form.address.trim()) err.address = "Address is required";
    }
    if (idx === 1) {
      if (form.buildings && Number(form.buildings) < 0) err.buildings = "Must be positive";
      if (form.units && Number(form.units) < 0) err.units = "Must be positive";
      if (form.consentPct && (Number(form.consentPct) < 0 || Number(form.consentPct) > 100))
        err.consentPct = "Between 0 and 100";
    }
    if (idx === 3) {
      if (form.chairPhone && !/^[+\d][\d\s-]{6,}$/.test(form.chairPhone)) err.chairPhone = "Invalid phone";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) { toast.error("Please fix the highlighted fields"); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (!validateStep(i)) { setStep(i); toast.error("Please complete all required fields"); return; }
    }
    toast.success(`${form.name} onboarded successfully`);
    navigate("/app/societies");
  };

  const orgName = ORGANIZATIONS.find((o) => o.id === form.orgId)?.name ?? "—";
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  return (
    <PageContainer>
      <PageHeader
        title="Onboard a society"
        description="Register a new cooperative housing society and capture the details needed to begin delivery."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/app/societies")}>
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Stepper */}
        <SectionCard bodyClassName="p-3" className="h-fit">
          <div className="px-2 pt-1 pb-3">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>Progress</span><span className="tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => i <= step && setStep(i)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                      active ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-accent/50",
                      i > step && "cursor-default",
                    )}
                  >
                    <span className={cn(
                      "h-6 w-6 rounded-full grid place-items-center shrink-0 text-[11px] font-semibold",
                      done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}>
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </SectionCard>

        {/* Step content */}
        <div className="space-y-6">
          {step === 0 && (
            <SectionCard title="Society profile" description="Identity, location and current delivery phase.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Society name" error={errors.name} required>
                  <Input value={form.name} onChange={set("name")} placeholder="e.g. Sea Pearl CHS" />
                </Field>
                <Field label="Organization" error={errors.orgId} required>
                  <Select value={form.orgId} onValueChange={set("orgId")}>
                    <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                    <SelectContent>
                      {ORGANIZATIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Registered address" error={errors.address} required className="md:col-span-2">
                  <Textarea rows={2} value={form.address} onChange={set("address")} placeholder="Building, area, city, PIN" />
                </Field>
                <Field label="City / region">
                  <Input value={form.city} onChange={set("city")} placeholder="Mumbai, MH" />
                </Field>
                <Field label="Delivery phase">
                  <Select value={form.phase} onValueChange={set("phase")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOCIETY_PHASES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </SectionCard>
          )}

          {step === 1 && (
            <SectionCard title="Structure & consent" description="Physical footprint and redevelopment consent.">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Buildings" error={errors.buildings}>
                  <Input type="number" min="0" value={form.buildings} onChange={set("buildings")} placeholder="e.g. 4" />
                </Field>
                <Field label="Total units" error={errors.units}>
                  <Input type="number" min="0" value={form.units} onChange={set("units")} placeholder="e.g. 120" />
                </Field>
                <Field label="Plot area (sq.m)">
                  <Input value={form.area} onChange={set("area")} placeholder="e.g. 3200" />
                </Field>
                <Field label="Redevelopment consent (%)" error={errors.consentPct} className="md:col-span-3">
                  <Input type="number" min="0" max="100" value={form.consentPct} onChange={set("consentPct")} placeholder="0 – 100" />
                </Field>
              </div>
            </SectionCard>
          )}

          {step === 2 && (
            <SectionCard title="Registration" description="Cooperative registration and statutory records.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Registration number">
                  <Input value={form.registrationNo} onChange={set("registrationNo")} placeholder="MUM/CHS/1998/4412" />
                </Field>
                <Field label="Registered on">
                  <Input type="date" value={form.registeredOn} onChange={set("registeredOn")} />
                </Field>
              </div>
            </SectionCard>
          )}

          {step === 3 && (
            <SectionCard title="Managing committee" description="Primary contacts for the society.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Chairperson">
                  <Input value={form.chairperson} onChange={set("chairperson")} placeholder="Full name" />
                </Field>
                <Field label="Chairperson phone" error={errors.chairPhone}>
                  <Input value={form.chairPhone} onChange={set("chairPhone")} placeholder="+91 ..." />
                </Field>
                <Field label="Secretary">
                  <Input value={form.secretary} onChange={set("secretary")} placeholder="Full name" />
                </Field>
                <Field label="Secretary phone">
                  <Input value={form.secretaryPhone} onChange={set("secretaryPhone")} placeholder="+91 ..." />
                </Field>
                <Field label="Notes" className="md:col-span-2">
                  <Textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Any additional context for onboarding." />
                </Field>
              </div>
            </SectionCard>
          )}

          {step === 4 && (
            <SectionCard title="Review & confirm" description="Verify the details before onboarding.">
              <div className="flex items-start gap-3 pb-4 border-b border-border">
                <div className="rounded-lg grid place-items-center bg-primary/10 text-primary font-semibold shrink-0 h-11 w-11 text-[15px]">
                  {initials(form.name || "New Society")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] truncate">{form.name || "Untitled society"}</span>
                    <StatusBadge tone={SOCIETY_PHASE_TONE[form.phase] ?? "neutral"} className="!text-[10px]">{form.phase}</StatusBadge>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{orgName}</p>
                </div>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-4">
                <Review label="Address" value={form.address} />
                <Review label="City / region" value={form.city} />
                <Review label="Buildings" value={form.buildings} />
                <Review label="Total units" value={form.units} />
                <Review label="Plot area" value={form.area && `${form.area} sq.m`} />
                <Review label="Consent" value={form.consentPct && `${form.consentPct}%`} />
                <Review label="Registration no." value={form.registrationNo} />
                <Review label="Registered on" value={form.registeredOn} />
                <Review label="Chairperson" value={form.chairperson && `${form.chairperson}${form.chairPhone ? ` · ${form.chairPhone}` : ""}`} />
                <Review label="Secretary" value={form.secretary && `${form.secretary}${form.secretaryPhone ? ` · ${form.secretaryPhone}` : ""}`} />
                <Review label="Notes" value={form.notes} className="sm:col-span-2" />
              </dl>
            </SectionCard>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/app/societies")} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={back} className="gap-1.5">
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" size="sm" onClick={next} className="gap-1.5">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={submit} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" /> Onboard society
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function Field({ label, children, error, required, className }) {
  return (
    <div className={className}>
      <Label className="text-[12.5px] font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="text-[11.5px] text-destructive mt-1">{error}</p>}
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
