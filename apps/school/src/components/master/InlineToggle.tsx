import { useState } from "react";
import { Switch } from "@sekolahpro/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceUpdate } from "@sekolahpro/api-client";

interface Props {
  doctype: string;
  /** Doc name (primary key) of the row to patch. */
  name: string;
  /** Boolean (0/1) fieldname to flip. */
  field: string;
  value: number | undefined;
  onLabel?: string;
  offLabel?: string;
}

/**
 * Inline boolean toggle for a list row. Flips a 0/1 field in one click with
 * optimistic UI and reverts on failure — replaces the row→detail→modal→save
 * round-trip for simple flags. Stops click propagation so toggling never
 * triggers the row's navigate-to-detail handler.
 */
export function InlineToggle({ doctype, name, field, value, onLabel = "Aktif", offLabel = "Nonaktif" }: Props) {
  const qc = useQueryClient();
  const mut = useResourceUpdate(doctype);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const checked = optimistic ?? !!value;

  const toggle = async () => {
    if (mut.isPending) return;
    const next = !checked;
    setOptimistic(next);
    try {
      await mut.mutateAsync({ name, patch: { [field]: next ? 1 : 0 } });
      qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
    } catch (err) {
      setOptimistic(!next);
      window.alert(err instanceof Error ? err.message : "Gagal memperbarui.");
    }
  };

  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-flex">
      <Switch
        checked={checked}
        onChange={toggle}
        disabled={mut.isPending}
        label={checked ? onLabel : offLabel}
        aria-label={`${field}: ${checked ? onLabel : offLabel}`}
      />
    </span>
  );
}
