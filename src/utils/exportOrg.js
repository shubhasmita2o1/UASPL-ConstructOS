import { AUDIT_LABEL } from "@/data/organizations";
import { csvEscape, downloadBlob } from "@/utils/downloadCsv";

const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleString(); } catch { return iso ?? ""; }
};

export function exportAuditCsv(org, rows) {
  const header = ["Timestamp", "Action", "Actor", "Detail"];
  const lines = [header.join(",")];
  rows.forEach((r) => {
    lines.push([
      fmtDate(r.at),
      AUDIT_LABEL[r.action] ?? r.action,
      r.actor,
      r.detail,
    ].map(csvEscape).join(","));
  });
  const filename = `${org.name.replace(/[^\w-]+/g, "_").toLowerCase()}_audit_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(filename, new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
  return filename;
}

export function exportAuditPdf(org, rows) {
  const w = window.open("", "_blank", "noopener,width=900,height=1000");
  if (!w) return null;
  const rowsHtml = rows.map((r) => `
    <tr>
      <td class="ts">${fmtDate(r.at)}</td>
      <td><span class="tag">${AUDIT_LABEL[r.action] ?? r.action}</span></td>
      <td>${r.actor ?? ""}</td>
      <td>${(r.detail ?? "").replace(/</g, "&lt;")}</td>
    </tr>
  `).join("");
  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Audit log — ${org.name}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 12px/1.5 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color:#0f172a; margin: 32px; }
  header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; display:flex; justify-content: space-between; align-items:flex-end; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .muted { color:#64748b; font-size: 11px; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 20px; }
  .meta .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .meta .k { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color:#64748b; }
  .meta .v { font-size: 13px; font-weight: 600; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color:#64748b; background:#f8fafc; }
  td.ts { white-space: nowrap; color:#334155; font-variant-numeric: tabular-nums; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #4338ca; font-size: 11px; font-weight: 500; }
  footer { margin-top: 24px; font-size: 10px; color:#94a3b8; text-align:right; }
  @media print { body { margin: 20mm 15mm; } .noprint { display: none; } }
  .btn { background:#0f172a; color:#fff; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-size:12px; }
</style></head>
<body>
  <header>
    <div>
      <h1>Audit log — ${org.name}</h1>
      <div class="muted">Generated ${new Date().toLocaleString()} · ConstructOS</div>
    </div>
    <button class="btn noprint" onclick="window.print()">Print / Save as PDF</button>
  </header>
  <section class="meta">
    <div class="card"><div class="k">Organization</div><div class="v">${org.name}</div></div>
    <div class="card"><div class="k">Status</div><div class="v">${org.status ?? "—"}</div></div>
    <div class="card"><div class="k">Plan</div><div class="v">${org.plan ?? "—"}</div></div>
    <div class="card"><div class="k">Entries</div><div class="v">${rows.length}</div></div>
  </section>
  <table>
    <thead><tr><th>Timestamp</th><th>Action</th><th>Actor</th><th>Detail</th></tr></thead>
    <tbody>${rowsHtml || `<tr><td colspan="4" class="muted">No entries.</td></tr>`}</tbody>
  </table>
  <footer>ConstructOS · Audit report · ${org.id}</footer>
  <script>setTimeout(() => window.print(), 350);</script>
</body></html>`;
  w.document.write(html);
  w.document.close();
  return `${org.name} audit`;
}
