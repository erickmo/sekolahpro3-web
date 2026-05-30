import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@sekolahpro/ui";
import { frappeFetch } from "@sekolahpro/api-client";
import { useDocMethod } from "./docMethods";

const SK_MENGAJAR_DOCTYPE = "SK Mengajar";
const PENUGASAN_DOCTYPE = "Penugasan Guru";
const BERKAS_DOCTYPE = "Berkas Guru";
const BULK_SK_METHOD = "sekolahpro.akademik.api.sk.bulk_generate_sk_mengajar";

/** Per-row action: create the 1:1 SK Mengajar for an active Penugasan Guru. */
export function BuatSkMengajarButton({ penugasan, status }: { penugasan: string; status?: string | undefined }) {
  const m = useDocMethod<string>(PENUGASAN_DOCTYPE, "buat_sk_mengajar");
  const qc = useQueryClient();
  if (status !== "Aktif") return <span className="text-xs text-muted-fg">—</span>;
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={m.isPending}
      onClick={() => {
        m.mutate(
          { name: penugasan },
          { onSuccess: () => void qc.invalidateQueries({ queryKey: ["resource:list", SK_MENGAJAR_DOCTYPE] }) },
        );
      }}
    >
      {m.isPending ? "Memproses…" : "Buat SK"}
    </Button>
  );
}

/** Per-row action: extend a Berkas Guru validity date (renew). */
export function RenewBerkasButton({ berkas }: { berkas: string }) {
  const [open, setOpen] = useState(false);
  const [tanggal, setTanggal] = useState("");
  const m = useDocMethod(BERKAS_DOCTYPE, "renew");
  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Perpanjang
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="date"
        value={tanggal}
        onChange={(e) => setTanggal(e.target.value)}
        className="h-7 px-1 rounded border border-border text-xs bg-bg"
      />
      <Button
        size="sm"
        disabled={!tanggal || m.isPending}
        onClick={() =>
          m.mutate(
            { name: berkas, args: { tanggal_expire_baru: tanggal } },
            { onSuccess: () => setOpen(false) },
          )
        }
      >
        {m.isPending ? "…" : "OK"}
      </Button>
    </span>
  );
}

/** Header action: bulk-create Draft SK Mengajar for all active assignments in a tahun ajaran. */
export function BulkGenerateSkButton() {
  const [tahun, setTahun] = useState("");
  const qc = useQueryClient();
  const m = useMutation<{ created: number; skipped: number; tahun_ajaran: string }, Error, string>({
    mutationFn: (tahun_ajaran) =>
      frappeFetch(BULK_SK_METHOD, { tahun_ajaran }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["resource:list", SK_MENGAJAR_DOCTYPE] }),
  });
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="text"
        placeholder="Tahun Ajaran (mis. 2025/2026)"
        value={tahun}
        onChange={(e) => setTahun(e.target.value)}
        className="h-8 px-2 rounded-md border border-border text-sm bg-bg min-w-[180px]"
      />
      <Button variant="outline" disabled={!tahun || m.isPending} onClick={() => m.mutate(tahun)}>
        {m.isPending ? "Memproses…" : "Generate SK Massal"}
      </Button>
      {m.isSuccess ? (
        <span className="text-xs text-success">
          {m.data.created} dibuat · {m.data.skipped} dilewati
        </span>
      ) : null}
      {m.isError ? <span className="text-xs text-danger">{String(m.error.message)}</span> : null}
    </span>
  );
}
