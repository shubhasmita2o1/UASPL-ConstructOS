import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-muted text-foreground border-border",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  info: "bg-info/10 text-info border-info/20",
  primary: "bg-primary/10 text-primary border-primary/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function StatusBadge({ tone = "neutral", children, dot = true, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium", TONES[tone], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", {
        neutral: "bg-muted-foreground", success: "bg-success", warning: "bg-warning",
        info: "bg-info", primary: "bg-primary", destructive: "bg-destructive",
      }[tone])} />}
      {children}
    </span>
  );
}
