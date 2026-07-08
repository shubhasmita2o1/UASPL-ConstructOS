import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, Search, Check } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ORGANIZATIONS } from "@/data/mockData";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { initials } from "@/utils/format";

export default function OrganizationSelectPage() {
  const { setOrg, orgId } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(orgId);

  const filtered = ORGANIZATIONS.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));

  const proceed = () => {
    if (!selected) return;
    setOrg(selected);
    navigate("/auth/select-society");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11.5px] uppercase tracking-wider text-muted-foreground font-semibold">Step 1 of 2</div>
        <h2 className="text-[24px] font-semibold tracking-tight mt-1">Choose your organization</h2>
        <p className="text-[13.5px] text-muted-foreground mt-1">Signed in as <span className="text-foreground font-medium">{user?.name}</span>. Select the tenant you want to work in.</p>
      </div>

      <div className="relative">
        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input placeholder="Search organizations" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="space-y-2 max-h-[420px] overflow-auto scrollbar-thin pr-1">
        {filtered.map((org) => {
          const active = selected === org.id;
          return (
            <button
              key={org.id}
              onClick={() => setSelected(org.id)}
              className={cn(
                "w-full text-left rounded-xl border p-4 flex items-center gap-4 transition-all",
                active ? "border-primary bg-primary/5 shadow-card" : "border-border hover:border-primary/40 hover:bg-accent/40",
              )}
            >
              <div className="h-11 w-11 rounded-lg grid place-items-center text-white font-semibold text-sm shrink-0" style={{ backgroundColor: org.logoColor }}>
                {initials(org.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-[14px] truncate">{org.name}</div>
                  <span className="text-[10.5px] font-medium rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{org.plan}</span>
                </div>
                <div className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {org.city}</span>
                  <span>·</span>
                  <span>{org.projects} projects</span>
                  <span>·</span>
                  <span>{org.members} members</span>
                </div>
              </div>
              <div className={cn("h-5 w-5 rounded-full border grid place-items-center shrink-0", active ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {active && <Check className="h-3 w-3" />}
              </div>
            </button>
          );
        })}
      </div>

      <Button className="w-full h-10 gap-2" disabled={!selected} onClick={proceed}>
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
