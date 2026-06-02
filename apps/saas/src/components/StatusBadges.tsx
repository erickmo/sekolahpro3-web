import { Badge } from "@sekolahpro/ui";
import { orgStatusTone, langgananStatusTone } from "../lib/tenants";

// Shared status pills for the tenant (Organisasi) console — replaces the three
// near-identical inline `StatusBadge` copies that used to live in the routes.

export function OrgStatusBadge({ status }: { status?: string | undefined }) {
  if (!status) return <span className="text-muted-fg">—</span>;
  return <Badge tone={orgStatusTone(status)}>{status}</Badge>;
}

export function LanggananStatusBadge({ status }: { status?: string | undefined }) {
  if (!status) return <span className="text-muted-fg">—</span>;
  return <Badge tone={langgananStatusTone(status)}>{status}</Badge>;
}
