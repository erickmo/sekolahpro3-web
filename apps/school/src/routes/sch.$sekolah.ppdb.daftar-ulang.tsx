/**
 * Daftar Ulang PPDB — finalisasi pelamar diterima menjadi Siswa resmi.
 *
 * Redesain berbasis tahapan + live wiring. Sumber antrian = baris DocType
 * "Pendaftaran PPDB" (status Diterima/Lulus/Daftar Ulang) di-join dengan
 * "Daftar Ulang PPDB" untuk menentukan siapa yang sudah selesai re-registrasi.
 * Bila backend kosong, halaman jatuh ke fixture mock {@link listPpdbForSekolah}
 * sehingga tidak pernah blank. Untuk tiap pelamar ditampilkan WorkflowStepper
 * progresnya + aksi "Finalisasi" yang memanggil `finalisasi_pendaftaran`
 * (membuat record Siswa, idempoten). Sebuah bilah penyelesaian merangkum berapa
 * pelamar yang sudah selesai vs masih menunggu, juga dari data live/fallback.
 */

import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Button, EmptyState, Modal, PageHeader, SectionCard } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { DistributionBar } from "../components/viz";
import { useFinalisasiPendaftaran } from "../lib/ppdbApi";
import { listPpdbForSekolah, type Pendaftar } from "../data/ppdb";
import { PageGuide, type PageGuideStep } from "../components/guide/PageGuide";
import {
  DaftarUlangApplicantCard,
  buildLiveQueue,
  buildMockQueue,
  completionSegments,
  splitCompletion,
  type DaftarUlangItem,
  type PendaftaranLiveRow,
  type DaftarUlangLiveRow,
} from "../components/ppdb/daftarUlangPanel";

// Status pendaftaran (mock) yang dianggap "diterima" → masuk alur daftar ulang.
const ACCEPTED_STATUSES = new Set<Pendaftar["statusPendaftaran"]>([
  "Diterima",
  "Daftar Ulang",
]);

// DocType + field whitelist untuk hook live (harus cocok wiring terverifikasi).
const DOCTYPE_PENDAFTARAN = "Pendaftaran PPDB";
const DOCTYPE_DAFTAR_ULANG = "Daftar Ulang PPDB";
const PENDAFTARAN_FIELDS = ["name", "status", "calon_siswa", "gelombang_ppdb"];
const DAFTAR_ULANG_FIELDS = ["name", "pendaftaran_ppdb", "status"];
// Status diterima yang difilter di sisi server agar antrian ringkas.
const ACCEPTED_STATUS_FILTER = ["Diterima", "Lulus", "Daftar Ulang"];

// Identitas guide untuk persistensi open/collapse di localStorage.
const GUIDE_STORAGE_ID = "ppdb-daftar-ulang";
const GUIDE_INTRO =
  "Halaman ini menuntun pelamar yang sudah diterima menyelesaikan daftar ulang lalu difinalisasi menjadi Siswa resmi.";

// Langkah panduan — string UI terpusat (no magic strings).
const GUIDE_STEPS: PageGuideStep[] = [
  { title: "Tinjau progres tahapan", detail: "Setiap kartu menampilkan stepper tahapan PPDB pelamar diterima." },
  { title: "Pastikan pelunasan", detail: "Konfirmasi biaya daftar ulang sudah lunas sebelum finalisasi." },
  { title: "Finalisasi", detail: "Klik Finalisasi untuk membuat record Siswa (aksi idempoten)." },
];

// Tips ringkas.
const GUIDE_TIPS: string[] = [
  "Bilah penyelesaian di atas merangkum berapa pelamar yang sudah selesai daftar ulang.",
  "Finalisasi aman diulang — record Siswa tidak akan terduplikasi.",
];

interface Feedback {
  tone: "ok" | "err";
  msg: string;
}

/** Banner umpan-balik hasil finalisasi (sukses / gagal). */
function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  // Warna mengikuti tone; teks selalu kontras agar mudah dibaca.
  const className =
    "rounded-lg border px-4 py-2 text-xs " +
    (feedback.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800");
  return <div className={className}>{feedback.msg}</div>;
}

/** Susunan kartu daftar ulang per pelamar (view-model seragam live/mock). */
function ApplicantGrid({
  items,
  onConfirm,
  busy,
}: {
  items: DaftarUlangItem[];
  onConfirm: (item: DaftarUlangItem) => void;
  busy: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <DaftarUlangApplicantCard key={item.id} item={item} onConfirm={onConfirm} busy={busy} />
      ))}
    </div>
  );
}

/** Isi detail modal konfirmasi finalisasi untuk satu pelamar. */
function ConfirmDetail({ item }: { item: DaftarUlangItem }) {
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="text-muted-fg">Pelamar:</span>{" "}
        <span className="font-medium">{item.title}</span>
      </div>
      <div>
        <span className="text-muted-fg">No. Pendaftaran:</span>{" "}
        <span className="font-mono">{item.id}</span>
      </div>
      {item.pendaftar ? (
        <div>
          <span className="text-muted-fg">Tahun ajaran:</span>{" "}
          <span>{item.pendaftar.tahunAjaran}</span>
        </div>
      ) : null}
      <p className="text-xs text-muted-fg">
        Pastikan pelunasan biaya daftar ulang sudah dikonfirmasi sebelum
        melanjutkan. Aksi ini membuat record Siswa resmi.
      </p>
    </div>
  );
}

/**
 * Pilih antrian: utamakan baris LIVE Pendaftaran PPDB; bila kosong jatuh ke
 * fixture mock ter-scope sekolah. Selalu mengembalikan view-model seragam.
 */
function useDaftarUlangQueue(sekolah: string): DaftarUlangItem[] {
  const pendaftaranQ = useResourceList<PendaftaranLiveRow>(DOCTYPE_PENDAFTARAN, {
    fields: PENDAFTARAN_FIELDS,
    filters: [["status", "in", ACCEPTED_STATUS_FILTER]],
  });
  const daftarUlangQ = useResourceList<DaftarUlangLiveRow>(DOCTYPE_DAFTAR_ULANG, {
    fields: DAFTAR_ULANG_FIELDS,
  });
  // Memoize the empty-array fallbacks so their identity is stable across renders
  // (otherwise the queue useMemo below re-runs every render).
  const liveRows = useMemo(() => pendaftaranQ.data ?? [], [pendaftaranQ.data]);
  const reregRows = useMemo(() => daftarUlangQ.data ?? [], [daftarUlangQ.data]);

  return useMemo(() => {
    // Jalur live: ada baris Pendaftaran PPDB → bangun antrian dari join.
    if (liveRows.length) return buildLiveQueue(liveRows, reregRows);
    // Fallback: backend kosong → fixture mock pelamar diterima ter-scope sekolah.
    const accepted = listPpdbForSekolah(sekolah).filter((p) =>
      ACCEPTED_STATUSES.has(p.statusPendaftaran),
    );
    return buildMockQueue(accepted);
  }, [liveRows, reregRows, sekolah]);
}

/**
 * Halaman Daftar Ulang PPDB. Memuat antrian pelamar diterima dari backend live
 * (fallback fixture mock), menampilkan bilah penyelesaian + kartu per-pelamar,
 * dan menjalankan finalisasi lewat modal konfirmasi.
 */
export function DaftarUlangPpdbPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const finalisasi = useFinalisasiPendaftaran();

  const [confirmItem, setConfirmItem] = useState<DaftarUlangItem | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const queue = useDaftarUlangQueue(sekolah);
  const segments = useMemo(() => completionSegments(queue), [queue]);
  const { done, waiting } = useMemo(() => splitCompletion(queue), [queue]);

  /** Jalankan finalisasi pendaftaran terpilih lalu tampilkan umpan-balik. */
  const onFinalisasi = async (item: DaftarUlangItem) => {
    setFeedback(null);
    try {
      const res = (await finalisasi.mutateAsync({
        pendaftaran_ppdb: item.id,
      })) as { siswa?: string } | undefined;
      setConfirmItem(null);
      setFeedback({
        tone: "ok",
        msg: res?.siswa ? `Siswa dibuat: ${res.siswa}.` : "Pendaftaran difinalisasi.",
      });
    } catch (e) {
      setFeedback({ tone: "err", msg: (e as Error)?.message ?? "Gagal finalisasi." });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Daftar Ulang PPDB"
        description="Selesaikan daftar ulang pelamar diterima → buat record Siswa resmi."
        actions={
          <Link
            to="/sch/$sekolah/ppdb"
            params={{ sekolah }}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium text-fg hover:bg-muted"
          >
            Kembali
          </Link>
        }
      />

      <PageGuide
        storageId={GUIDE_STORAGE_ID}
        intro={GUIDE_INTRO}
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      {queue.length > 0 ? (
        <SectionCard title="Penyelesaian Daftar Ulang" description={`${done} selesai • ${waiting} menunggu`}>
          <DistributionBar segments={segments} />
        </SectionCard>
      ) : null}

      {feedback ? <FeedbackBanner feedback={feedback} /> : null}

      {queue.length === 0 ? (
        <SectionCard>
          <EmptyAccepted sekolah={sekolah} />
        </SectionCard>
      ) : (
        <ApplicantGrid items={queue} onConfirm={setConfirmItem} busy={finalisasi.isPending} />
      )}

      <Modal
        open={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        title="Finalisasi → Buat Siswa"
        description="Aksi idempoten: membuat record Siswa + Pendaftaran Siswa, lalu menutup pendaftaran PPDB."
        tone="emerald"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmItem(null)}>
              Batal
            </Button>
            <Button
              disabled={finalisasi.isPending}
              onClick={() => confirmItem && onFinalisasi(confirmItem)}
            >
              {finalisasi.isPending ? "Memproses..." : "Finalisasi"}
            </Button>
          </div>
        }
      >
        {confirmItem ? <ConfirmDetail item={confirmItem} /> : null}
      </Modal>
    </div>
  );
}

/** Tampilan kosong saat belum ada pelamar diterima di sekolah aktif. */
function EmptyAccepted({ sekolah }: { sekolah: string }) {
  return (
    <EmptyState
      title="Belum ada pelamar diterima"
      description="Pelamar akan muncul di sini setelah hasil seleksi diumumkan dan statusnya menjadi Diterima."
      action={
        <Link
          to="/sch/$sekolah/ppdb/seleksi"
          params={{ sekolah }}
          className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90"
        >
          Ke halaman Seleksi
        </Link>
      }
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/ppdb/daftar-ulang")({
  component: DaftarUlangPpdbPage,
});
