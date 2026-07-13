import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  identifier: z.string().min(1, "Enter your work email or employee ID"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "", remember: true },
  });

  const from = location.state?.from ?? "/auth/select-organization";

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await login(values);
      toast.success("Signed in", { description: "Welcome back to ConstructOS" });
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-[26px] font-semibold tracking-tight text-foreground">Sign in to ConstructOS</h2>
        <p className="text-[13.5px] text-muted-foreground">
          Enterprise redevelopment operations for developers, consultants and site teams.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Email or employee ID</Label>
          <Input id="identifier" type="text" placeholder="you@uaspl.in" autoComplete="username" {...register("identifier")} />
          {errors.identifier && <p className="text-[12px] text-destructive">{errors.identifier.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/auth/forgot-password" className="text-[12px] font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" {...register("password")} />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[12px] text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" defaultChecked {...register("remember")} />
          <Label htmlFor="remember" className="text-[13px] text-muted-foreground font-normal">Keep me signed in for 30 days</Label>
        </div>

        <Button type="submit" className="w-full h-10 gap-2" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <p className="text-center text-[12px] text-muted-foreground">
        By continuing you agree to UASPL's <a className="underline underline-offset-2 hover:text-foreground" href="#">Terms</a> and <a className="underline underline-offset-2 hover:text-foreground" href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}
