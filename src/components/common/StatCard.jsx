import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({ label, value, delta, deltaLabel, icon: Icon, tone = "primary", className }) {
  const positive = delta != null && delta >= 0;
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    info: "bg-info/10 text-info",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-[26px] font-semibold text-foreground mt-1.5 tabular-nums">{value}</div>
        </div>
        {Icon && (
          <div className={cn("h-9 w-9 rounded-lg grid place-items-center shrink-0", toneClasses)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
      {delta != null && (
        <div className="mt-3 flex items-center gap-1.5 text-[12px]">
          <span className={cn("inline-flex items-center gap-0.5 font-semibold rounded-md px-1.5 py-0.5",
            positive ? "text-success bg-success/10" : "text-destructive bg-destructive/10")}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted-foreground">{deltaLabel ?? "vs last month"}</span>
        </div>
      )}
    </div>
  );
}
