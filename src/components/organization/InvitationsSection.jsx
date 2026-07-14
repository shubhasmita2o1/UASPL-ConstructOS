import { useMemo, useState } from "react";
import { Copy, Mail, Plus, RefreshCw, Ban, Search, Send, X } from "lucide-react";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useOrgInvitations, organizationsStore } from "@/hooks/useOrganizationsStore";
import { INVITE_ROLES, INVITE_STATUSES, INVITE_STATUS_TONE } from "@/data/organizations";

const fmt = (iso) => { try { return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; } };
const inviteUrl = (token) => `${window.location.origin}/invite/${token}`;

export default function InvitationsSection({ org, caps }) {
  const invites = useOrgInvitations(org.id);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [linkFor, setLinkFor] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("project_manager");
  const [emailErr, setEmailErr] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return invites.filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (term && !`${i.email} ${i.role}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [invites, q, status]);

  const counts = useMemo(() => ({
    total: invites.length,
    pending: invites.filter((i) => i.status === "Pending").length,
    accepted: invites.filter((i) => i.status === "Accepted").length,
    expired: invites.filter((i) => i.status === "Expired").length + invites.filter((i) => i.status === "Revoked").length,
  }), [invites]);

  const copy = async (token) => {
    try { await navigator.clipboard.writeText(inviteUrl(token)); toast.success("Invite link copied"); }
    catch { toast.error("Copy failed"); }
  };

  const handleCreate = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setEmailErr("Enter a valid email"); return; }
    const inv = organizationsStore.createInvitation(org.id, { email: email.trim(), role });
    toast.success(`Invitation sent to ${inv.email}`);
    setLinkFor(inv);
    setEmail(""); setEmailErr("");
    setOpen(false);
  };

  return (
    <SectionCard
      title="Invitations"
      description={`${counts.total} total · ${counts.pending} pending · ${counts.accepted} accepted · ${counts.expired} expired / revoked`}
      action={caps.invite && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Invite member</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite a new member</DialogTitle>
              <DialogDescription>They'll receive a link that expires in 7 days.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[12.5px] font-medium">Email</Label>
                <Input className="mt-1.5" placeholder="name@company.com" value={email}
                       onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }} />
                {emailErr && <p className="text-[11.5px] text-destructive mt-1">{emailErr}</p>}
              </div>
              <div>
                <Label className="text-[12.5px] font-medium">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVITE_ROLES.map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} className="gap-1.5"><Send className="h-3.5 w-3.5" /> Send invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email or role" className="pl-9 h-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-[140px] text-[12.5px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {INVITE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={invites.length === 0 ? "No invitations yet" : "No invitations match your filters"}
          description={invites.length === 0
            ? "Invite teammates by email — they'll get a secure link that expires in 7 days."
            : "Try clearing filters to see all invitations."}
          action={caps.invite && invites.length === 0 && (
            <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Invite member</Button>
          )}
        />
      ) : (
        <ul className="divide-y divide-border -m-5">
          {filtered.map((i) => {
            const canAct = caps.invite && (i.status === "Pending" || i.status === "Expired");
            return (
              <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="h-9 w-9 rounded-md bg-info/10 text-info grid place-items-center shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-foreground truncate">{i.email}</div>
                  <div className="text-[11.5px] text-muted-foreground truncate">
                    {i.role.replace(/_/g, " ")} · invited by {i.invitedBy} · {i.status === "Pending" ? `expires ${fmt(i.expiresAt)}` : `sent ${fmt(i.createdAt)}`}
                  </div>
                </div>
                <StatusBadge tone={INVITE_STATUS_TONE[i.status]}>{i.status}</StatusBadge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={() => copy(i.token)}>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </Button>
                  {canAct && (
                    <>
                      <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={() => { organizationsStore.resendInvitation(org.id, i.id); toast.success(`Resent to ${i.email}`); }}>
                        <RefreshCw className="h-3.5 w-3.5" /> Resend
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-destructive hover:text-destructive" onClick={() => { organizationsStore.revokeInvitation(org.id, i.id); toast.success(`Revoked invite for ${i.email}`); }}>
                        <Ban className="h-3.5 w-3.5" /> Revoke
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Link surfaced right after create */}
      <Dialog open={!!linkFor} onOpenChange={(o) => !o && setLinkFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation ready</DialogTitle>
            <DialogDescription>Share this link with {linkFor?.email}. It expires in 7 days.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={linkFor ? inviteUrl(linkFor.token) : ""} className="text-[12px] font-mono" />
            <Button size="sm" className="gap-1.5" onClick={() => linkFor && copy(linkFor.token)}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLinkFor(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
