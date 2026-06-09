/**
 * TindakLanjutSaya — the Guru's own "Pesan Wali" follow-up list (real data, BE Fase 2).
 *
 * Lists the teacher's outbound messages to wali with their reply status. The backend
 * permission_query (sekolahpro.api.pesan.pesan_wali_query) already scopes the list to the
 * signed-in teacher's own threads, so no client-side guru filter is needed.
 */
import { useResourceList } from "@sekolahpro/api-client";
import { Avatar, Badge, EmptyState, SectionCard } from "@sekolahpro/ui";

const PESAN_WALI_DOCTYPE = "Pesan Wali";
const FIELDS = ["name", "siswa", "kategori", "isi", "arah", "status", "creation"];
const LIMIT = 50;

const STATUS_TONE: Record<string, "warning" | "brand" | "success" | "neutral"> = {
  "Menunggu Balasan": "warning",
  Dibalas: "brand",
  Selesai: "success",
  Terkirim: "neutral",
};

interface PesanWaliRow {
  name: string;
  siswa?: string;
  kategori?: string;
  isi?: string;
  arah?: string;
  status?: string;
  creation?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function TindakLanjutSaya() {
  const query = useResourceList<PesanWaliRow>(PESAN_WALI_DOCTYPE, {
    fields: FIELDS,
    filters: [["arah", "=", "keluar"]],
    order_by: "creation desc",
    limit_page_length: LIMIT,
  });
  const rows = query.data ?? [];

  return (
    <SectionCard
      title="Tindak Lanjut Saya"
      description="Pesan yang Anda kirim ke wali — pantau status balasannya."
    >
      {query.isLoading ? (
        <p className="p-4 text-sm text-muted-fg">Memuat...</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Belum ada pesan"
          description="Pesan yang Anda kirim ke wali murid akan muncul di sini."
        />
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.name} className="flex items-start gap-3 py-3">
              <Avatar name={row.siswa ?? "?"} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-fg text-sm truncate">{row.siswa ?? "—"}</span>
                  {row.kategori ? <Badge tone="neutral">{row.kategori}</Badge> : null}
                  <Badge tone={STATUS_TONE[row.status ?? "Terkirim"] ?? "neutral"} dot>
                    {row.status ?? "Terkirim"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-fg truncate">{stripHtml(row.isi ?? "")}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
