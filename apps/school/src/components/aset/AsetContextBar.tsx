/**
 * AsetContextBar — thin role-framing banner shown atop the Manajemen Aset
 * module. Tells the current user which audience the UI is framed for (their
 * primary asset role) without hiding anything. Mirrors the perpustakaan
 * context bar so framing is consistent across modules.
 */
import { Badge, IconLayers } from "@sekolahpro/ui";
import { useAsetRole } from "../../lib/aset/role";

export function AsetContextBar() {
  const { label, framing } = useAsetRole();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand">
        <span className="h-4 w-4"><IconLayers /></span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-fg">{framing}</div>
      </div>
      <Badge tone="brand" dot>{label}</Badge>
    </div>
  );
}
