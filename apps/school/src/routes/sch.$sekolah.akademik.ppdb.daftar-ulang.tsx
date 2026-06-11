/**
 * Daftar Ulang PPDB — finalisasi pelamar diterima menjadi Siswa resmi.
 *
 * Redesain berbasis tahapan: untuk tiap pelamar yang DITERIMA, halaman
 * menampilkan WorkflowStepper progres daftar ulang-nya dan satu aksi
 * konfirmasi "Finalisasi" yang memanggil `finalisasi_pendaftaran` (membuat
 * record Siswa, idempoten). Sebuah bilah penyelesaian di atas merangkum berapa
 * pelamar yang sudah selesai daftar ulang vs masih menunggu.
 *
 * Sumber data saat ini = fixture mock {@link listPpdbForSekolah}; ganti ke
 * hook @sekolahpro/api-client ketika backend daftar ulang siap.
 */

import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Button, EmptyState, Modal, PageHeader, SectionCard } from "@sekolahpro/ui";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { useFinalisasiPendaftaran } from "../lib/ppdbApi";
import { listPpdbForSekolah, type Pendaftar } from "../data/ppdb";
import { PageGuide, type PageGuideStep } from "../components/guide/PageGuide";
import { DaftarUlangApplicantCard } from "../components/ppdb/daftarUlangPanel";

// Status pendaftaran yang dianggap "diterima" → masuk alur daftar ulang.
const ACCEPTED_STATUSES = new Set<Pendaftar["statusPendaftaran"]>([
  "Diterima",
  "Daftar Ulang",
]);

// Status final yang menandakan daftar ulang sudah tuntas.
const STATUS_DONE: Pendaftar["statusPendaftaran"] = "Daftar Ulang";

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

// Segmen bilah penyelesaian — warna konsisten via Tone viz.
const SEG_DONE_LABEL = "Selesai";
const SEG_WAIT_LABEL = "Menunggu";

/** Pisahkan pelamar diterima menjadi hitungan selesai vs menunggu. */
function splitCompletion(list: Pendaftar[]): { done: number; waiting: number } {
  const done = list.filter((p) => p.statusPendaftaran === STATUS_DONE).length;
  return { done, waiting: list.length - done };
}

/** Bangun segmen DistributionBar penyelesaian daftar ulang. */
function completionSegments(list: Pendaftar[]): DistributionSegment[] {
  const { done, waiting } = splitCompletion(list);
  return [
    { label: SEG_DONE_LABEL, value: done, tone: "emerald" },
    { label: SEG_WAIT_LABEL, value: waiting, tone: "amber" },
  ];
}

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

/** Susunan kartu daftar ulang per pelamar diterima. */
function ApplicantGrid({
  list,
  onConfirm,
  busy,
}: {
  list: Pendaftar[];
  onConfirm: (p: Pendaftar) => void;
  busy: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {list.map((p) => (
        <DaftarUlangApplicantCard
          key={p.noPendaftaran}
          pendaftar={p}
          onConfirm={onConfirm}
          busy={busy}
        />
      ))}
    </div>
  );
}

/** Isi detail modal konfirmasi finalisasi untuk satu pelamar. */
function ConfirmDetail({ pendaftar }: { pendaftar: Pendaftar }) {
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="text-muted-fg">Pelamar:</span>{" "}
        <span className="font-medium">{pendaftar.namaLengkap}</span>
      </div>
      <div>
        <span className="text-muted-fg">No. Pendaftaran:</span>{" "}
        <span className="font-mono">{pendaftar.noPendaftaran}</span>
      </div>
      <div>
        <span className="text-muted-fg">Tahun ajaran:</span>{" "}
        <span>{pendaftar.tahunAjaran}</span>
      </div>
      <p className="text-xs text-muted-fg">
        Pastikan pelunasan biaya daftar ulang sudah dikonfirmasi sebelum
        melanjutkan. Aksi ini membuat record Siswa resmi.
      </p>
    </div>
  );
}

/**
 * Halaman Daftar Ulang PPDB. Memuat pelamar diterima dari fixture mock,
 * menampilkan bilah penyelesaian + kartu per-pelamar, dan menjalankan
 * finalisasi lewat modal konfirmasi.
 */
export function DaftarUlangPpdbPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const finalisasi = useFinalisasiPendaftaran();

  const [confirmRow, setConfirmRow] = useState<Pendaftar | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Pelamar diterima ter-scope ke sekolah aktif (memoized agar stabil).
  const accepted = useMemo(
    () =>
      listPpdbForSekolah(sekolah).filter((p) =>
        ACCEPTED_STATUSES.has(p.statusPendaftaran),
      ),
    [sekolah],
  );
  const segments = useMemo(() => completionSegments(accepted), [accepted]);
  const { done, waiting } = useMemo(() => splitCompletion(accepted), [accepted]);

  /** Jalankan finalisasi pendaftaran terpilih lalu tampilkan umpan-balik. */
  const onFinalisasi = async (p: Pendaftar) => {
    setFeedback(null);
    try {
      const res = (await finalisasi.mutateAsync({
        pendaftaran_ppdb: p.noPendaftaran,
      })) as { siswa?: string } | undefined;
      setConfirmRow(null);
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
            to="/sch/$sekolah/akademik/ppdb"
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

      {accepted.length > 0 ? (
        <SectionCard title="Penyelesaian Daftar Ulang" description={`${done} selesai • ${waiting} menunggu`}>
          <DistributionBar segments={segments} />
        </SectionCard>
      ) : null}

      {feedback ? <FeedbackBanner feedback={feedback} /> : null}

      {accepted.length === 0 ? (
        <SectionCard>
          <EmptyAccepted sekolah={sekolah} />
        </SectionCard>
      ) : (
        <ApplicantGrid
          list={accepted}
          onConfirm={setConfirmRow}
          busy={finalisasi.isPending}
        />
      )}

      <Modal
        open={!!confirmRow}
        onClose={() => setConfirmRow(null)}
        title="Finalisasi → Buat Siswa"
        description="Aksi idempoten: membuat record Siswa + Pendaftaran Siswa, lalu menutup pendaftaran PPDB."
        tone="emerald"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmRow(null)}>
              Batal
            </Button>
            <Button
              disabled={finalisasi.isPending}
              onClick={() => confirmRow && onFinalisasi(confirmRow)}
            >
              {finalisasi.isPending ? "Memproses..." : "Finalisasi"}
            </Button>
          </div>
        }
      >
        {confirmRow ? <ConfirmDetail pendaftar={confirmRow} /> : null}
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
          to="/sch/$sekolah/akademik/ppdb/seleksi"
          params={{ sekolah }}
          className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90"
        >
          Ke halaman Seleksi
        </Link>
      }
    />
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/ppdb/daftar-ulang")({
  component: DaftarUlangPpdbPage,
});
