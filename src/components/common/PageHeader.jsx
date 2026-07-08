import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center gap-3 md:gap-4 justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight text-foreground truncate">{title}</h1>
        {description && <p className="text-[13.5px] text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function PageContainer({ children, className }) {
  return <div className={cn("p-5 md:p-7 space-y-6 max-w-[1600px] mx-auto", className)}>{children}</div>;
}
