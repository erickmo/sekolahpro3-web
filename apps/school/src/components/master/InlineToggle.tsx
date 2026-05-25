import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceUpdate } from "@sekolahpro/api-client";

interface Props {
  doctype: string;
  name: string;
  field: string;
  value: number | undefined;
  onLabel?: string;
  offLabel?: string;
}

export function InlineToggle({ doctype, name, field, value, onLabel = "Aktif", offLabel = "Nonaktif" }: Props) {
  const qc = useQueryClient();
  const mut = useResourceUpdate(doctype);
  const [local, setLocal] = useState<number>(value ? 1 : 0);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const next = e.target.checked ? 1 : 0;
    setLocal(next);
    try {
      await mut.mutateAsync({ name, patch: { [field]: next } });
      qc.invalidateQueries({ queryKey: ["resource:list", doctype] });
    } catch (err) {
      setLocal(value ? 1 : 0);
      window.alert(err instanceof Error ? err.message : "Gagal memperbarui.");
    }
  };

  return (
    <label
      className="inline-flex items-center gap-2 cursor-pointer select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={local === 1}
        onChange={handleToggle}
        disabled={mut.isPending}
        className="h-4 w-4 rounded border-border text-brand focus:ring-brand focus:ring-2"
      />
      <span className={local === 1 ? "text-xs text-emerald-700" : "text-xs text-muted-fg"}>
        {local === 1 ? onLabel : offLabel}
      </span>
    </label>
  );
}
