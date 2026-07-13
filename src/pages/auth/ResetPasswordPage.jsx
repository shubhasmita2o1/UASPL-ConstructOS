import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      toast.error(err.message || "Couldn't reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </Link>

      {done ? (
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-success/10 grid place-items-center">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight">Password reset</h2>
            <p className="text-[13.5px] text-muted-foreground mt-1">
              Your password has been changed. Please sign in again with your new password.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate("/auth/login", { replace: true })}>Go to sign in</Button>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight">Set a new password</h2>
            <p className="text-[13.5px] text-muted-foreground mt-1">
              Choose a new password for your ConstructOS account.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rp-password">New password</Label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="rp-password"
                  type={showPw ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-confirm">Confirm new password</Label>
              <Input
                id="rp-confirm"
                type={showPw ? "text" : "password"}
                required
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-10" disabled={submitting || !token}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset password"}
            </Button>
            {!token && <p className="text-[12px] text-destructive text-center">This reset link is missing its token.</p>}
          </form>
        </>
      )}
    </div>
  );
}
