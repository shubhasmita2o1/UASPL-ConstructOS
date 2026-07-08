import { Outlet, Link } from "react-router-dom";
import { HardHat } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[color:var(--primary-hover)] text-primary-foreground">
        <div className="absolute inset-0 opacity-[0.14]" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, white 0, transparent 40%)",
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur-sm grid place-items-center border border-white/20">
              <HardHat className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">UASPL ConstructOS</div>
              <div className="text-[11px] text-white/70">by Urban Analysis & Solution</div>
            </div>
          </Link>

          <div className="max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> Enterprise Redevelopment Suite
            </div>
            <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.1]">
              Deliver society redevelopment projects with clarity, control and compliance.
            </h1>
            <p className="text-white/80 text-[15px] leading-relaxed">
              One operating system for developers, consultants and site teams — from feasibility
              through handover. Drawings, approvals, inspections, materials, vendors and finance
              in a single command centre.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { k: "Projects live", v: "180+" },
                { k: "Enterprise tenants", v: "42" },
                { k: "Uptime SLA", v: "99.95%" },
              ].map((s) => (
                <div key={s.k} className="rounded-lg border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-semibold">{s.v}</div>
                  <div className="text-[11px] uppercase tracking-wider text-white/70 mt-1">{s.k}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-white/60">
            © {new Date().getFullYear()} Urban Analysis & Solution Pvt. Ltd. — All rights reserved.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
