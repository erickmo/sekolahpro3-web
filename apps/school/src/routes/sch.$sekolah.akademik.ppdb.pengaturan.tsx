/**
 * Pengaturan PPDB — singleton settings page (redesain).
 *
 * Edits the singleton "Pengaturan PPDB" doctype. The form itself lives in the
 * colocated {@link PengaturanPanel} (Formulir / Biaya / Alur sections + a
 * first-run onboarding checklist); this route owns only data loading, the save
 * persistence, the page header, feedback, and the in-page tutorial guide.
 */

import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Button, PageHeader, SectionCard } from "@sekolahpro/ui";
import { useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide/PageGuide";
import {
  PengaturanPanel,
  type PengaturanDoc,
} from "../components/ppdb/pengaturanPanel";

/** Singleton doctype name (doc name equals doctype for singletons). */
const SINGLETON = "Pengaturan PPDB";
/** Parent route id used to read the `sekolah` route param. */
const SEKOLAH_ROUTE = "/sch/$sekolah";
/** localStorage namespace for this page's tutorial guide. */
const GUIDE_STORAGE_ID = "ppdb-pengaturan";
/** Feedback shown after a successful save. */
const SAVE_OK_MSG = "Pengaturan tersimpan.";
/** Fallback feedback when a save fails without a message. */
const SAVE_ERR_MSG = "Gagal menyimpan.";

/** Tutorial steps explaining how to configure PPDB. */
const GUIDE_STEPS = [
  {
    title: "Lengkapi langkah setup",
    detail: "Ikuti checklist di atas hingga seluruh langkah awal selesai.",
  },
  {
    title: "Atur formulir, biaya, dan alur",
    detail: "Sesuaikan penomoran, minimum bayar, gateway, dan workflow seleksi.",
  },
  {
    title: "Simpan perubahan",
    detail: "Klik Simpan; pengaturan berlaku global untuk seluruh pendaftaran.",
  },
] as const;

/** Tutorial tips for the pengaturan page. */
const GUIDE_TIPS = [
  "Item biaya per gelombang dikelola dari halaman Pembayaran.",
  "Aktifkan Mode Sandbox saat menguji integrasi gateway.",
] as const;

/** Inline save feedback banner (success or error tone). */
function FeedbackBanner({
  feedback,
}: {
  feedback: { tone: "ok" | "err"; msg: string } | null;
}): ReactNode {
  if (!feedback) return null;
  // WHY: emerald = success, rose = error — color-codes outcome at a glance.
  const tone =
    feedback.tone === "ok"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : "border-rose-300 bg-rose-50 text-rose-800";
  return <div className={`rounded-md border px-3 py-2 text-sm ${tone}`}>{feedback.msg}</div>;
}

/** Pengaturan PPDB page component. */
function PengaturanPpdbPage(): ReactNode {
  const { sekolah } = useParams({ from: SEKOLAH_ROUTE });
  const docQ = useResourceDoc<PengaturanDoc>(SINGLETON, SINGLETON);
  const update = useResourceUpdate<PengaturanDoc>(SINGLETON);

  const [draft, setDraft] = useState<Partial<PengaturanDoc>>({});
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  // Hydrate the editable draft once the singleton doc loads.
  useEffect(() => {
    if (docQ.data) setDraft(docQ.data);
  }, [docQ.data]);

  /** Update a single field in the draft without losing other edits. */
  const set = <K extends keyof PengaturanDoc>(key: K, value: PengaturanDoc[K]): void => {
    setDraft((cur) => ({ ...cur, [key]: value }));
  };

  /** Persist the draft to the singleton doc and surface feedback. */
  const save = async (): Promise<void> => {
    setFeedback(null);
    try {
      await update.mutateAsync({ name: SINGLETON, patch: draft as Record<string, unknown> });
      setFeedback({ tone: "ok", msg: SAVE_OK_MSG });
      docQ.refetch();
    } catch (e) {
      setFeedback({ tone: "err", msg: (e as Error)?.message ?? SAVE_ERR_MSG });
    }
  };

  if (docQ.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="PPDB" title="Pengaturan PPDB" />
        <SectionCard>
          <p className="text-sm text-muted-fg">Memuat...</p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Pengaturan PPDB"
        description="Konfigurasi global modul PPDB: formulir, biaya, dan alur seleksi."
        actions={
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        }
      />

      <PageGuide
        storageId={GUIDE_STORAGE_ID}
        intro="Atur kebijakan PPDB sekali di sini; berlaku untuk seluruh pendaftaran."
        steps={[...GUIDE_STEPS]}
        tips={[...GUIDE_TIPS]}
      />

      <FeedbackBanner feedback={feedback} />

      <PengaturanPanel
        draft={draft}
        set={set}
        renderLink={(href, children) => (
          <Link to={href} params={{ sekolah }} className="text-brand hover:underline">
            {children}
          </Link>
        )}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/ppdb/pengaturan")({
  component: PengaturanPpdbPage,
});
