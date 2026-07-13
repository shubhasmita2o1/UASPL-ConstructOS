import {
  CheckCircle2, FileText, Truck, IndianRupee, UserCog, ListChecks,
  AlertTriangle, ShieldCheck, Landmark, Bell,
} from "lucide-react";

export const ACTIVITY_TYPES = {
  approval: { label: "Approval", icon: CheckCircle2, tone: "success" },
  document: { label: "Document", icon: FileText, tone: "info" },
  vendor:   { label: "Vendor",   icon: Truck, tone: "primary" },
  finance:  { label: "Finance",  icon: IndianRupee, tone: "warning" },
  user:     { label: "User",     icon: UserCog, tone: "primary" },
  task:     { label: "Task",     icon: ListChecks, tone: "info" },
  quality:  { label: "Quality",  icon: AlertTriangle, tone: "destructive" },
  compliance: { label: "Compliance", icon: ShieldCheck, tone: "success" },
  society:  { label: "Society",  icon: Landmark, tone: "primary" },
  system:   { label: "System",   icon: Bell, tone: "neutral" },
};

export const ACTIVITY_FEED = [
  { id: "a-01", user: "Rohan Iyer", action: "approved drawing", target: "STR-B4-Rev-07", project: "Sea Pearl Towers", type: "approval", ts: "2026-07-10T09:58:00", day: "Today" },
  { id: "a-02", user: "Priya Nair", action: "uploaded inspection report", target: "TMI-2410", project: "Sea Pearl Towers", type: "document", ts: "2026-07-10T09:42:00", day: "Today" },
  { id: "a-03", user: "Neha Kulkarni", action: "added vendor", target: "Konkan Steels Pvt Ltd", project: "Green Oaks Redevelopment", type: "vendor", ts: "2026-07-10T08:30:00", day: "Today" },
  { id: "a-04", user: "System", action: "purchase order raised", target: "PO-8842 · ₹18.4L", project: "Sea Pearl Towers", type: "finance", ts: "2026-07-10T07:55:00", day: "Today" },
  { id: "a-05", user: "Aarav Deshmukh", action: "granted role", target: "Site Engineer to K. Rao", project: "Sunrise Heights", type: "user", ts: "2026-07-10T07:10:00", day: "Today" },
  { id: "a-06", user: "Rohan Iyer", action: "closed task", target: "Slab casting — Tower B, L-14", project: "Sea Pearl Towers", type: "task", ts: "2026-07-09T18:20:00", day: "Yesterday" },
  { id: "a-07", user: "Priya Nair", action: "raised NCR", target: "Rebar cover deviation — Zone 3", project: "Sea Pearl Towers", type: "quality", ts: "2026-07-09T15:05:00", day: "Yesterday" },
  { id: "a-08", user: "S. Menon", action: "closed RFI", target: "MEP shaft coordination — L-9", project: "Green Oaks Redevelopment", type: "task", ts: "2026-07-09T12:40:00", day: "Yesterday" },
  { id: "a-09", user: "N. Kulkarni", action: "verified compliance", target: "GST & MSME — Ashoka Interiors", project: "Lotus Residency", type: "compliance", ts: "2026-07-09T10:15:00", day: "Yesterday" },
  { id: "a-10", user: "System", action: "onboarded society", target: "Sahyadri CHS", project: "Sahyadri CHS", type: "society", ts: "2026-07-08T16:00:00", day: "Earlier" },
  { id: "a-11", user: "Aditya Joshi", action: "generated report", target: "Q2 progress summary", project: "Riverdale CHS", type: "document", ts: "2026-07-08T11:30:00", day: "Earlier" },
  { id: "a-12", user: "Finance Bot", action: "released payment", target: "INV-5521 · ₹42.0L", project: "Sea Pearl Towers", type: "finance", ts: "2026-07-08T09:00:00", day: "Earlier" },
  { id: "a-13", user: "K. Rao", action: "submitted drawing", target: "Tower B — Slab L-16 Rebar", project: "Green Oaks Redevelopment", type: "approval", ts: "2026-07-07T14:20:00", day: "Earlier" },
  { id: "a-14", user: "Rhea Kapoor", action: "submitted KYC documents", target: "MMR DevCorp", project: "Hillview CHS", type: "compliance", ts: "2026-07-07T09:45:00", day: "Earlier" },
];

export function activityTypeMeta(type) {
  return ACTIVITY_TYPES[type] ?? ACTIVITY_TYPES.system;
}

export function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  } catch {
    return ts;
  }
}
