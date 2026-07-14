import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, Save, X } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization, organizationsStore } from "@/hooks/useOrganizationsStore";
import { ORG_INDUSTRIES, ORG_PLANS, ORG_STATUSES } from "@/data/organizations";

const EMPTY = {
  name: "", city: "", industry: "Redevelopment", plan: "Business", status: "Onboarding",
  gstin: "", website: "", founded: "", address: "", description: "",
  contactName: "", contactEmail: "", contactPhone: "",
};

export default function OrganizationFormPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const caps = {
    create: hasPermission("organization.create"),
    edit: hasPermission("organization.edit"),
    delete: hasPermission("organization.delete"),
    assign: hasPermission("organization.assign"),
    status: hasPermission("organization.status"),
  };
  const existing = useOrganization(id);

  const canProceed = mode === "create" ? caps.create : caps.edit;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === "edit" && existing) {
      setForm({
        name: existing.name ?? "",
        city: existing.city ?? "",
        industry: existing.industry ?? "Redevelopment",
        plan: existing.plan ?? "Business",
        status: existing.status ?? "Onboarding",
        gstin: existing.gstin ?? "",
        website: existing.website ?? "",
        founded: existing.founded ?? "",
        address: existing.address ?? "",
        description: existing.description ?? "",
        contactName: existing.contact?.name ?? "",
        contactEmail: existing.contact?.email ?? "",
        contactPhone: existing.contact?.phone ?? "",
      });
    }
  }, [mode, existing]);

  const set = (k) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: value }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Name is required";
    if (!form.city.trim()) err.city = "City is required";
    if (form.website && !/^https?:\/\//i.test(form.website)) err.website = "Include http:// or https://";
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) err.contactEmail = "Invalid email";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    city: form.city.trim(),
    industry: form.industry,
    plan: form.plan,
    status: form.status,
    gstin: form.gstin.trim(),
    website: form.website.trim(),
    founded: form.founded.trim(),
    address: form.address.trim(),
    description: form.description.trim(),
    contact: {
      name: form.contactName.trim(),
      email: form.contactEmail.trim(),
      phone: form.contactPhone.trim(),
      avatar: form.contactName.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "??",
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields"); return; }
    const payload = buildPayload();
    if (mode === "create") {
      const created = organizationsStore.create(payload);
      toast.success(`Created ${created.name}`);
      navigate(`/app/organizations/${created.id}`);
    } else {
      organizationsStore.update(id, payload);
      toast.success(`Updated ${payload.name}`);
      navigate(`/app/organizations/${id}`);
    }
  };

  if (!canProceed) {
    return (
      <PageContainer>
        <SectionCard title="Not authorized">
          <p className="text-[13px] text-muted-foreground">Your role does not have permission to {mode} organizations.</p>
        </SectionCard>
      </PageContainer>
    );
  }

  if (mode === "edit" && !existing) {
    return (
      <PageContainer>
        <SectionCard title="Organization not found">
          <Link to="/app/organizations" className="text-primary text-[13px]">Back to organizations</Link>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={mode === "create" ? "New organization" : `Edit · ${existing?.name}`}
        description={mode === "create" ? "Onboard a new tenant to the ConstructOS platform." : "Update tenant details, contacts and status."}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </>
        }
      />

      <form onSubmit={submit} className="space-y-6">
        <SectionCard title="Profile" description="Public-facing organization identity.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Organization name" error={errors.name} required>
              <Input value={form.name} onChange={set("name")} placeholder="e.g. UASPL Mumbai" />
            </Field>
            <Field label="City / region" error={errors.city} required>
              <Input value={form.city} onChange={set("city")} placeholder="Mumbai, MH" />
            </Field>
            <Field label="Industry">
              <Select value={form.industry} onValueChange={set("industry")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Founded">
              <Input value={form.founded} onChange={set("founded")} placeholder="2016" />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <Textarea rows={3} value={form.description} onChange={set("description")} placeholder="Short summary shown across the platform." />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Plan & status" description="Subscription tier and lifecycle state.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Subscription plan">
              <Select value={form.plan} onValueChange={set("plan")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="GSTIN">
              <Input value={form.gstin} onChange={set("gstin")} placeholder="27AABCU1234N1Z5" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Address & web" description="Registered office and web presence.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Registered address" className="md:col-span-2">
              <Textarea rows={2} value={form.address} onChange={set("address")} placeholder="Building, area, city, PIN" />
            </Field>
            <Field label="Website" error={errors.website}>
              <Input value={form.website} onChange={set("website")} placeholder="https://example.com" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Primary contact" description="Main point of contact for the tenant.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Contact name">
              <Input value={form.contactName} onChange={set("contactName")} placeholder="Full name" />
            </Field>
            <Field label="Email" error={errors.contactEmail}>
              <Input type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="name@company.com" />
            </Field>
            <Field label="Phone">
              <Input value={form.contactPhone} onChange={set("contactPhone")} placeholder="+91 ..." />
            </Field>
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button type="submit" size="sm" className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> {mode === "create" ? "Create organization" : "Save changes"}
          </Button>
        </div>
      </form>
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
