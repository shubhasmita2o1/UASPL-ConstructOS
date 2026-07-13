import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.message || "Couldn't send reset link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </Link>

      {sent ? (
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-success/10 grid place-items-center">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight">Check your inbox</h2>
            <p className="text-[13.5px] text-muted-foreground mt-1">
              We've sent password reset instructions to <span className="text-foreground font-medium">{email}</span>. The link expires in 30 minutes.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setSent(false)}>Send to a different email</Button>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight">Reset your password</h2>
            <p className="text-[13.5px] text-muted-foreground mt-1">
              Enter the work email associated with your ConstructOS account.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fp-email">Work email</Label>
              <div className="relative">
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input id="fp-email" type="email" required placeholder="you@uaspl.in" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full h-10" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
