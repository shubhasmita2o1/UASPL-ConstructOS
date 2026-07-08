import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 p-6">
      <div className="max-w-md text-center">
        <div className="text-[72px] font-bold text-primary leading-none tabular-nums">404</div>
        <h1 className="mt-2 text-[22px] font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground text-[13.5px] mt-2">
          The page you're looking for doesn't exist or has been moved. Check the URL or return to your dashboard.
        </p>
        <Button asChild className="mt-6"><Link to="/app/dashboard">Go to dashboard</Link></Button>
      </div>
    </div>
  );
}
