import { cn } from "@/lib/utils";

export default function SectionCard({ title, description, action, children, className, bodyClassName }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      {(title || action) && (
        <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>}
            {description && <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
