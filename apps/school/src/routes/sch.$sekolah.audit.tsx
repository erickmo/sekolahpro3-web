import { createFileRoute } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import { ResourceListPage } from "../components/ResourceListPage";

// Wired to backend DocType: "Audit Log SekolahPro"
// /Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/pengaturan/doctype/audit_log_sekolahpro

type Row = {
  name: string;
  timestamp?: string;
  user?: string;
  action?: string;
  severity?: string;
  doctype_name?: string;
  docname?: string;
  ip_address?: string;
  is_override?: number;
};

const SEVERITY_TONE: Record<string, "success" | "brand" | "warning" | "danger" | "neutral"> = {
  info: "neutral",
  warning: "warning",
  error: "danger",
  critical: "danger",
};

const ACTION_OPTS = [
  "Semua","Create","Update","Submit","Cancel","Delete","Login","Logout","Override",
].map((v) => ({ value: v, label: v }));

const SEVERITY_OPTS = ["Semua","info","warning","error","critical"].map((v) => ({ value: v, label: v }));

const COLUMNS: Column<Row>[] = [
  { key: "timestamp", header: "Waktu", sortable: true, width: "180px",
    cell: (r) => <span className="tabular-nums text-xs">{r.timestamp ?? "—"}</span> },
  { key: "severity", header: "Severity",
    cell: (r) => <Badge tone={SEVERITY_TONE[r.severity ?? "info"] ?? "neutral"} dot>{r.severity ?? "—"}</Badge> },
  { key: "action", header: "Aksi",
    cell: (r) => <Badge tone="neutral">{r.action ?? "—"}</Badge> },
  { key: "user", header: "User", cell: (r) => <span className="text-fg">{r.user ?? "—"}</span> },
  { key: "doctype_name", header: "Doctype",
    cell: (r) => (
      <div>
        <div className="text-fg">{r.doctype_name ?? "—"}</div>
        <div className="text-xs text-muted-fg">{r.docname ?? ""}</div>
      </div>
    ) },
  { key: "ip_address", header: "IP",
    cell: (r) => <span className="tabular-nums text-xs text-muted-fg">{r.ip_address ?? "—"}</span> },
  { key: "name", header: "Event ID",
    cell: (r) => <span className="tabular-nums text-xs text-muted-fg">{r.name}</span> },
];

function AuditPage() {
  return (
    <ResourceListPage<Row>
      eyebrow="Lainnya"
      title="Audit Log"
      description="Lacak aktivitas pengguna, perubahan konfigurasi, dan kejadian sistem."
      doctype="Audit Log SekolahPro"
      fields={["name", "timestamp", "user", "action", "severity", "doctype_name", "docname", "ip_address", "is_override"]}
      rowKey={(r) => r.name}
      columns={COLUMNS}
      defaultSort={{ key: "timestamp", dir: "desc" }}
      searchFields={["name", "user", "doctype_name", "docname", "ip_address"]}
      selectFilters={[
        { key: "severity", label: "Severity", field: "severity", options: SEVERITY_OPTS },
        { key: "action", label: "Aksi", field: "action", options: ACTION_OPTS },
      ]}
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/audit")({ component: AuditPage });
