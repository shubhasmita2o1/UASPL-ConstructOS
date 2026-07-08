import { PageContainer, PageHeader } from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Download, LayoutGrid, List, KanbanSquare, Construction } from "lucide-react";

export default function ModulePlaceholderPage({ title, icon: Icon }) {
  return (
    <PageContainer>
      <PageHeader
        title={title}
        description={`Manage ${title.toLowerCase()} across your active society. Overview, list, kanban and analytics views ship in this module.`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-3.5 w-3.5" /> Filter</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New</Button>
          </>
        }
      />

      <div className="flex items-center gap-1 border-b border-border">
        {[
          { k: "list", label: "List", icon: List, active: true },
          { k: "grid", label: "Grid", icon: LayoutGrid },
          { k: "kanban", label: "Kanban", icon: KanbanSquare },
        ].map((t) => (
          <button key={t.k} className={`h-9 px-3 text-[13px] font-medium inline-flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${t.active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <EmptyState
        icon={Icon ?? Construction}
        title={`${title} module scaffolded`}
        description="This module ships with the consistent enterprise shell — page header, view switcher, filters, bulk actions and export. Domain-specific screens are wired up in the next build pass."
        action={<Button variant="outline" size="sm">View documentation</Button>}
      />
    </PageContainer>
  );
}
