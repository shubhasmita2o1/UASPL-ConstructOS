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
import { DEMO_USERS, ROLES } from "@/data/mockData";

const schema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(6, "Minimum 6 characters"),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const { login, loginAs, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "neha@uaspl.in", password: "demo1234", remember: true },
  });

  const from = location.state?.from ?? "/auth/select-organization";

  const onSubmit = async (values) => {
    await login(values);
    toast.success("Signed in", { description: "Welcome back to ConstructOS" });
    navigate(from, { replace: true });
  };

  const quickLogin = async (u) => {
    await loginAs(u);
    toast.success(`Signed in as ${u.name}`);
    navigate("/auth/select-organization", { replace: true });
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
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@uaspl.in" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-[12px] text-destructive">{errors.email.message}</p>}
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

        <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-background px-2 text-[11px] uppercase tracking-wider text-muted-foreground">Demo personas</span></div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEMO_USERS.map((u) => (
          <button key={u.id} type="button" onClick={() => quickLogin(u)} className="text-left p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/60 transition-colors group">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 text-primary grid place-items-center text-[11px] font-semibold">{u.avatar}</div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold truncate">{u.name}</div>
                <div className="text-[10.5px] text-muted-foreground truncate">{ROLES.find(r => r.id === u.role)?.label}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-[12px] text-muted-foreground">
        By continuing you agree to UASPL's <a className="underline underline-offset-2 hover:text-foreground" href="#">Terms</a> and <a className="underline underline-offset-2 hover:text-foreground" href="#">Privacy Policy</a>.
      </p>
    </div>
  );
}
