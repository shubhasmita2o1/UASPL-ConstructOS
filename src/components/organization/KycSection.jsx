import { useEffect, useState } from "react";
import { FileText, Upload, CheckCircle2, XCircle, Trash2, Loader2, ShieldCheck } from "lucide-react";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useOrgKyc, organizationsStore } from "@/hooks/useOrganizationsStore";
import { KYC_DOC_TYPES, KYC_STATUSES, KYC_STATUS_TONE } from "@/data/organizations";

const fmt = (iso) => { try { return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; } };
const sizeLabel = (kb) => kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;

export default function KycSection({ org, caps }) {
  const [loading, setLoading] = useState(true);
  const docs = useOrgKyc(org.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: KYC_DOC_TYPES[0], fileName: "", sizeKb: 200, notes: "" });

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [org.id]);

  const counts = {
    total: docs.length,
    verified: docs.filter((d) => d.status === "Verified").length,
    pending: docs.filter((d) => d.status === "Pending").length,
    rejected: docs.filter((d) => d.status === "Rejected").length,
  };

  const submit = () => {
    if (!form.fileName.trim()) { toast.error("Attach a file name"); return; }
    organizationsStore.addKyc(org.id, {
      type: form.type,
      fileName: form.fileName.trim(),
      sizeKb: Number(form.sizeKb) || 100,
      mime: form.fileName.toLowerCase().endsWith(".jpg") || form.fileName.toLowerCase().endsWith(".png") ? "image/jpeg" : "application/pdf",
      notes: form.notes.trim(),
    });
    toast.success(`${form.type} uploaded`);
    setForm({ type: KYC_DOC_TYPES[0], fileName: "", sizeKb: 200, notes: "" });
    setOpen(false);
  };

  const setStatus = (docId, status) => {
    organizationsStore.setKycStatus(org.id, docId, status);
    toast.success(`Marked ${status}`);
  };

  return (
    <SectionCard
      title="KYC & compliance"
      description={`${counts.total} document${counts.total === 1 ? "" : "s"} · ${counts.verified} verified · ${counts.pending} pending · ${counts.rejected} rejected`}
      action={caps.kyc && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload document</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload KYC document</DialogTitle>
              <DialogDescription>Attach metadata for the compliance team to review.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[12.5px] font-medium">Document type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KYC_DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[12.5px] font-medium">File name</Label>
                <Input className="mt-1.5" placeholder="e.g. company-pan.pdf" value={form.fileName}
                       onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))} />
              </div>
              <div>
                <Label className="text-[12.5px] font-medium">Size (KB)</Label>
                <Input className="mt-1.5" type="number" min={1} value={form.sizeKb}
                       onChange={(e) => setForm((f) => ({ ...f, sizeKb: e.target.value }))} />
              </div>
              <div>
                <Label className="text-[12.5px] font-medium">Notes</Label>
                <Textarea className="mt-1.5" rows={2} value={form.notes}
                          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" className="gap-1.5" onClick={submit}><Upload className="h-3.5 w-3.5" /> Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mb-2" />
          <span className="text-[12.5px]">Loading KYC documents…</span>
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No KYC documents yet"
          description="Upload PAN, GST, incorporation and bank documents to get this organization verified."
          action={caps.kyc && <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload document</Button>}
        />
      ) : (
        <ul className="divide-y divide-border -m-5">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-foreground truncate">{d.type}</span>
                  <StatusBadge tone={KYC_STATUS_TONE[d.status]} className="!text-[10.5px]">{d.status}</StatusBadge>
                </div>
                <div className="text-[11.5px] text-muted-foreground truncate">
                  {d.fileName} · {sizeLabel(d.sizeKb)} · uploaded {fmt(d.uploadedAt)} by {d.uploadedBy}
                  {d.verifiedAt ? ` · verified ${fmt(d.verifiedAt)}` : ""}
                </div>
                {d.notes && <div className="text-[11.5px] text-muted-foreground mt-1 italic">"{d.notes}"</div>}
              </div>
              <Button variant="ghost" size="sm" className="h-8" onClick={() => toast.info(`${d.fileName} — preview not available in mock mode`)}>Preview</Button>
              {caps.kyc && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">Set status</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">Update</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {KYC_STATUSES.map((s) => (
                      <DropdownMenuItem key={s} disabled={d.status === s} onClick={() => setStatus(d.id, s)}>
                        {s === "Verified" ? <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-success" /> :
                         s === "Rejected" ? <XCircle className="h-3.5 w-3.5 mr-2 text-destructive" /> :
                         <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mr-2 ml-1" />}
                        {s}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { organizationsStore.removeKyc(org.id, d.id); toast.success("Removed"); }} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
