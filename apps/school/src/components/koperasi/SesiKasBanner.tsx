import { useState } from "react";
import { useSession } from "@sekolahpro/auth";
import { useResourceList } from "@sekolahpro/api-client";
import { Alert, Button } from "@sekolahpro/ui";
import { SesiKasForm } from "./SesiKasForm";

/**
 * Banner persisten — tampil saat teller punya Sesi Kas status=Aktif.
 * Mendorong tutup kas akhir hari + memberi context "kas terbuka" untuk
 * setiap transaksi tunai. Hidden saat tidak ada sesi aktif (silent).
 *
 * Source: docs/domains/koperasi/entities/sesi-kas-teller.html
 */

type SesiRow = {
  name: string;
  teller: string;
  shift?: string;
  status: string;
  modal_kas?: number;
  tanggal?: string;
};

export function SesiKasBanner() {
  const session = useSession();
  const user = session.user;
  const [tutupOpen, setTutupOpen] = useState(false);

  const q = useResourceList<SesiRow>(
    "Sesi Kas Teller",
    {
      fields: ["name", "teller", "shift", "status", "modal_kas", "tanggal"],
      filters: [
        ["teller", "=", user ?? ""],
        ["status", "=", "Aktif"],
      ],
      limit_page_length: 1,
      order_by: "creation desc",
    },
    { enabled: !!user },
  );

  const sesi = q.data?.[0];
  if (!sesi) return null;

  const fmt = (n?: number) =>
    n !== undefined ? `Rp ${n.toLocaleString("id-ID")}` : "—";

  return (
    <>
      <Alert
        tone="info"
        title={`Sesi kas aktif — ${sesi.name}`}
        className="items-center"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-fg">
          <span>
            <span className="text-fg font-medium">{sesi.shift ?? "—"}</span> · {sesi.tanggal ?? "—"}
          </span>
          <span>
            Modal kas: <span className="tabular-nums text-fg">{fmt(sesi.modal_kas)}</span>
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => setTutupOpen(true)}
          >
            Tutup Kas
          </Button>
        </div>
      </Alert>

      {tutupOpen ? (
        <SesiKasForm
          mode="tutup"
          sesi={{
            name: sesi.name,
            modalKas: sesi.modal_kas ?? 0,
            shift: (sesi.shift as "Pagi" | "Siang" | "Sore") ?? "Pagi",
          }}
          onClose={() => setTutupOpen(false)}
          onSuccess={() => {
            setTutupOpen(false);
            void q.refetch();
          }}
        />
      ) : null}
    </>
  );
}
