import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("rounded-xl border border-dashed border-border bg-muted/20 p-10 flex flex-col items-center text-center", className)}>
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-background border border-border grid place-items-center text-muted-foreground mb-4">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="text-[15px] font-semibold text-foreground">{title}</div>
      {description && <p className="text-[13px] text-muted-foreground mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
