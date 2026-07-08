import { NavLink, useLocation } from "react-router-dom";
import { HardHat, ChevronsLeft } from "lucide-react";
import { NAV_SECTIONS } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Sidebar({ collapsed, onToggle }) {
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        collapsed ? "w-[68px]" : "w-[264px]",
      )}
    >
      <div className={cn("flex items-center h-14 border-b border-sidebar-border px-3 gap-2 shrink-0", collapsed && "justify-center px-0")}>
        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center shrink-0">
          <HardHat className="h-4.5 w-4.5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="text-[13px] font-semibold truncate">ConstructOS</div>
            <div className="text-[10.5px] text-muted-foreground truncate">by UASPL</div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="ml-auto h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-2 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {section.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                const link = (
                  <NavLink
                    to={item.to}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors relative",
                      collapsed ? "justify-center h-9 mx-1" : "h-8.5 px-2.5 py-2",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    {active && !collapsed && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
                return (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : link}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mb-3 h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Expand sidebar"
        >
          <ChevronsLeft className="h-4 w-4 rotate-180" />
        </button>
      )}
    </aside>
  );
}
