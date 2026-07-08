import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-6">
      <div className="max-w-md text-center">
        <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive grid place-items-center mx-auto">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-[26px] font-semibold tracking-tight">Access restricted</h1>
        <p className="text-muted-foreground text-[13.5px] mt-2">
          Your role does not have permission to view this page. Contact your organization admin to request access.
        </p>
        <Button asChild className="mt-6"><Link to="/app/dashboard"><ArrowLeft className="h-4 w-4 mr-1.5" /> Back to dashboard</Link></Button>
      </div>
    </div>
  );
}
