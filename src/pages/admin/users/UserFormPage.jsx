import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, Save, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import SectionCard from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useUser, useCreateUser, useUpdateUser } from "@/hooks/useUsersApi";

const EMPTY = { name: "", email: "", employeeId: "", phone: "", title: "", password: "" };

export default function UserFormPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasAnyPermission } = useAuth();
  const canProceed = hasAnyPermission(mode === "create" ? ["user.create", "users.manage"] : ["user.edit", "users.manage"]);

  const { data: existing, isLoading } = useUser(mode === "edit" ? id : undefined);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === "edit" && existing) {
      setForm({
        name: existing.name ?? "",
        email: existing.email ?? "",
        employeeId: existing.employeeId ?? "",
        phone: existing.phone ?? "",
        title: existing.title ?? "",
        password: "",
      });
    }
  }, [mode, existing]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Name is required";
    if (mode === "create") {
      if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Enter a valid email";
      if (form.password.length < 8) err.password = "Password must be at least 8 characters";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields"); return; }
    try {
      if (mode === "create") {
        const created = await createUser.mutateAsync({
          name: form.name.trim(),
          email: form.email.trim(),
          employeeId: form.employeeId.trim() || undefined,
          phone: form.phone.trim() || undefined,
          title: form.title.trim() || undefined,
          password: form.password,
        });
        toast.success(`Created ${created.name}`);
        navigate(`/app/users/${created._id}`);
      } else {
        await updateUser.mutateAsync({
          id,
          name: form.name.trim(),
          employeeId: form.employeeId.trim() || undefined,
          phone: form.phone.trim() || undefined,
          title: form.title.trim() || undefined,
        });
        toast.success("User updated");
        navigate(`/app/users/${id}`);
      }
    } catch (err) {
      toast.error(err.message || "Couldn't save user");
    }
  };

  if (!canProceed) {
    return (
      <PageContainer>
        <SectionCard title="Not authorized">
          <p className="text-[13px] text-muted-foreground">Your role does not have permission to {mode} users.</p>
        </SectionCard>
      </PageContainer>
    );
  }

  if (mode === "edit" && !isLoading && !existing) {
    return (
      <PageContainer>
        <SectionCard title="User not found">
          <Link to="/app/users" className="text-primary text-[13px]">Back to users</Link>
        </SectionCard>
      </PageContainer>
    );
  }

  const saving = createUser.isPending || updateUser.isPending;

  return (
    <PageContainer>
      <PageHeader
        title={mode === "create" ? "New user" : `Edit · ${existing?.name ?? ""}`}
        description={mode === "create" ? "Create a user account and assign roles afterwards." : "Update the user's profile details."}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Button>
        }
      />

      <form onSubmit={submit} className="space-y-6">
        <SectionCard title="Profile" description="Identity and contact details.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name" error={errors.name} required>
              <Input value={form.name} onChange={set("name")} placeholder="e.g. Priya Nair" />
            </Field>
            <Field label="Designation">
              <Input value={form.title} onChange={set("title")} placeholder="e.g. Site Engineer" />
            </Field>
            <Field label="Email" error={errors.email} required={mode === "create"}>
              <Input type="email" value={form.email} onChange={set("email")} placeholder="name@uaspl.in" disabled={mode === "edit"} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set("phone")} placeholder="+91 ..." />
            </Field>
            <Field label="Employee ID">
              <Input value={form.employeeId} onChange={set("employeeId")} placeholder="EMP-1042" />
            </Field>
          </div>
        </SectionCard>

        {mode === "create" && (
          <SectionCard title="Temporary password" description="They'll be asked to change this on first sign-in.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Password" error={errors.password} required>
                <Input type="text" value={form.password} onChange={set("password")} placeholder="8+ characters" />
              </Field>
            </div>
          </SectionCard>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button type="submit" size="sm" className="gap-1.5" disabled={saving}>
            <Save className="h-3.5 w-3.5" /> {mode === "create" ? "Create user" : "Save changes"}
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
