import { useLocation, useNavigate, Link } from "react-router-dom";
import { Search, Bell, Sun, Moon, PanelLeft, Command, LogOut, User, Settings, ChevronDown, Building2, Landmark, HardHat, Check, HelpCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTheme } from "@/contexts/ThemeContext";
import { FLAT_NAV } from "@/constants/navigation";
import { initials } from "@/utils/format";
import { ROLES } from "@/data/mockData";

function Breadcrumbs() {
  const { pathname } = useLocation();
  const current = FLAT_NAV.find((n) => n.to === pathname);
  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground" aria-label="Breadcrumb">
      <Link to="/app/dashboard" className="hover:text-foreground transition-colors">Home</Link>
      <span className="text-muted-foreground/60">/</span>
      <span className="text-foreground font-medium">{current?.label ?? "Overview"}</span>
    </nav>
  );
}

export default function Header({ onToggleSidebar, onOpenCommand }) {
  const { user, logout } = useAuth();
  const { org, society, currentProject, availableProjects, reset, workspaceActions } = useWorkspace();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const roleLabel = ROLES.find((r) => r.id === user?.role)?.label ?? user?.role;

  const switchWorkspace = () => {
    reset();
    navigate("/auth/select-organization");
  };

  const switchProject = async (projectId) => {
    try {
      await workspaceActions.setProject(projectId);
    } catch (err) {
      toast.error(err.message || "Couldn't switch project");
    }
  };

  const doLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <header className="h-14 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="h-full px-3 sm:px-5 flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden h-9 w-9 grid place-items-center rounded-md hover:bg-accent"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="hidden md:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex items-center gap-2 h-9 px-2.5 rounded-md hover:bg-accent transition-colors">
                <div className="h-6 w-6 rounded-md grid place-items-center text-[11px] font-semibold text-white" style={{ backgroundColor: org?.logoColor ?? "var(--primary)" }}>
                  {initials(org?.name ?? "OR")}
                </div>
                <div className="text-left leading-tight max-w-[160px]">
                  <div className="text-[12.5px] font-semibold truncate">{org?.name}</div>
                  <div className="text-[10.5px] text-muted-foreground truncate">{society?.name}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Current workspace</DropdownMenuLabel>
              <div className="px-2 py-1.5 space-y-1.5">
                <div className="flex items-center gap-2 text-sm"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {org?.name}</div>
                <div className="flex items-center gap-2 text-sm"><Landmark className="h-3.5 w-3.5 text-muted-foreground" /> {society?.name}</div>
                {currentProject && (
                  <div className="flex items-center gap-2 text-sm"><HardHat className="h-3.5 w-3.5 text-muted-foreground" /> {currentProject.name}</div>
                )}
              </div>
              {availableProjects.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Switch project</DropdownMenuLabel>
                  {availableProjects.map((p) => (
                    <DropdownMenuItem key={p.id} onClick={() => switchProject(p.id)} className="justify-between">
                      {p.name}
                      {currentProject?.id === p.id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={switchWorkspace}>Switch organization / society</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="h-5 w-px bg-border" />
          <Breadcrumbs />
        </div>

        <div className="flex-1" />

        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/40 hover:bg-muted text-muted-foreground text-[13px] w-[280px]"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search projects, drawings, people…</span>
          <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <Button variant="outline" size="sm" className="hidden md:inline-flex gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New
        </Button>

        <button onClick={toggle} className="h-9 w-9 grid place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-semibold">Notifications</div>
              <Badge variant="secondary" className="text-[10px]">4 new</Badge>
            </div>
            <div className="max-h-80 overflow-auto">
              {[
                { t: "Drawing STR-B4-Rev-07 approved", s: "Rohan Iyer · 2m ago" },
                { t: "NCR raised — Zone 3 rebar cover", s: "Priya Nair · 20m ago" },
                { t: "PO-8842 awaiting your approval", s: "Finance · 1h ago" },
                { t: "Vendor onboarded: Konkan Steels", s: "Compliance · 3h ago" },
              ].map((n, i) => (
                <div key={i} className="p-3 hover:bg-accent border-b border-border last:border-0 cursor-pointer">
                  <div className="text-sm font-medium">{n.t}</div>
                  <div className="text-[11.5px] text-muted-foreground mt-0.5">{n.s}</div>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-md hover:bg-accent">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px] font-semibold bg-primary text-primary-foreground">{user?.avatar ?? initials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden xl:block text-left leading-tight max-w-[130px]">
                <div className="text-[12.5px] font-semibold truncate">{user?.name}</div>
                <div className="text-[10.5px] text-muted-foreground truncate">{roleLabel}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-[11px] text-muted-foreground font-normal">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem><User className="h-4 w-4 mr-2" /> Profile</DropdownMenuItem>
              <DropdownMenuItem><Settings className="h-4 w-4 mr-2" /> Preferences</DropdownMenuItem>
              <DropdownMenuItem><HelpCircle className="h-4 w-4 mr-2" /> Help & docs</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={doLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
