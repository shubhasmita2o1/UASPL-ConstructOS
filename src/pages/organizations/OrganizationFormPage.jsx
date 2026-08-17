import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, Save, X, Loader2 } from "lucide-react";
// ... same UI imports ...
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOrganization,
  useCreateOrganization,
  useUpdateOrganization,
} from "@/hooks/useOrganizationsApi";
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
    status: hasPermission("organization.status"),
  };

  const { data: existing, isLoading } = useOrganization(mode === "edit" ? id : null);
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();

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
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (form.website && !/^https?:\/\//i.test(form.website) && form.website.trim()) {
      next.website = "Website should start with http:// or https://";
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      next.contactEmail = "Invalid email";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canProceed || !validate()) return;

    const payload = {
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
      },
    };

    try {
      if (mode === "create") {
        const created = await createOrg.mutateAsync(payload);
        toast.success("Organization created");
        navigate(`/app/organizations/${created.id || created._id}`);
      } else {
        await updateOrg.mutateAsync({ id, ...payload });
        toast.success("Organization updated");
        navigate(`/app/organizations/${id}`);
      }
    } catch (err) {
      toast.error(err?.message || "Save failed");
    }
  };

  if (mode === "edit" && isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      </PageContainer>
    );
  }

  if (!canProceed) {
    return (
      <PageContainer>
        <EmptyState title="Not allowed" description="You do not have permission to manage organizations." />
      </PageContainer>
    );
  }

  // ... keep the rest of your existing form JSX unchanged ...
  // only change submit button disabled state:

  // <Button type="submit" size="sm" disabled={createOrg.isPending || updateOrg.isPending}>