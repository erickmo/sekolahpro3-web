/**
 * Role selector chips for the Keuangan hub.
 *
 * Lets the user spotlight the perspective most relevant to them (Bendahara,
 * Kasir, Akuntan, Kepala Sekolah). Selection only changes EMPHASIS — it never
 * hides features. Mirrors the akademik role-chip pattern.
 */
import type { ReactNode } from "react";
import { cn } from "@sekolahpro/ui";
import { ALL_KEUANGAN_ROLES, ROLE_LABEL, type KeuanganRole } from "../../lib/keuanganRole";

export interface KeuanganRoleChipsProps {
  active: KeuanganRole;
  onSelect: (role: KeuanganRole) => void;
  className?: string;
}

/** A horizontal row of selectable role chips. */
export function KeuanganRoleChips({ active, onSelect, className }: KeuanganRoleChipsProps): ReactNode {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} role="group" aria-label="Pilih peran">
      <span className="text-xs font-medium text-muted-fg">Lihat sebagai:</span>
      {ALL_KEUANGAN_ROLES.map((role) => {
        const isActive = role === active;
        return (
          <button
            key={role}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(role)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              isActive
                ? "border-brand bg-brand text-white shadow-sm"
                : "border-border bg-bg text-muted-fg hover:bg-muted hover:text-fg",
            )}
          >
            {ROLE_LABEL[role]}
          </button>
        );
      })}
    </div>
  );
}
