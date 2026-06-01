/**
 * Pengadaan Buku — detail / create.
 *
 * Inline child-table editor untuk Item Pengadaan Buku. Submit (docstatus=1)
 * irreversibel: auto-generate N Eksemplar Buku per item; cancel TIDAK revert.
 * Preview panel menampilkan total eksemplar + estimasi nomor inventaris
 * sebelum confirm dialog. Lihat PERP-ADR-0005.
 *
 * Layer: route shell. State + I/O live in usePengadaanSubmit; this file only
 * fetches via that hook and composes the presentational sub-components.
 */
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, Textarea } from "@sekolahpro/ui";
import { usePengadaanSubmit } from "../components/perpustakaan/usePengadaanSubmit";
import { PengadaanFormHeader } from "../components/perpustakaan/PengadaanFormHeader";
import { PengadaanItemTable } from "../components/perpustakaan/PengadaanItemTable";
import { PengadaanPreview } from "../components/perpustakaan/PengadaanPreview";
import {
  PengadaanActionBar,
  PengadaanSubmitConfirm,
} from "../components/perpustakaan/PengadaanActions";

function PengadaanDetailPage() {
  // Use the URL param (not doc.name) for the header so the title stays correct
  // even on the load-error path, where doc falls back to an empty draft header.
  const { name } = Route.useParams();
  const form = usePengadaanSubmit();
  const {
    doc,
    setDoc,
    isNew,
    isReadonly,
    loading,
    saving,
    err,
    confirmSubmit,
    setConfirmSubmit,
    totals,
    previewInventaris,
    setItem,
    addItem,
    removeItem,
    save,
    goBack,
  } = form;

  if (loading) return <div className="p-6 text-sm text-muted-fg">Memuat...</div>;

  // Preview only makes sense for editable drafts that have at least one valid line.
  const showPreview = previewInventaris.length > 0 && !isReadonly;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perpustakaan / Pengadaan"
        title={isNew ? "Pengadaan Baru" : name}
        description={
          isReadonly
            ? "Pengadaan telah di-submit — eksemplar sudah ter-generate, tidak dapat diedit."
            : "Isi header dan item pengadaan. Submit akan auto-generate eksemplar buku."
        }
      />

      {err ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <PengadaanFormHeader doc={doc} isReadonly={isReadonly} setDoc={setDoc} />

      <PengadaanItemTable
        items={doc.items}
        isReadonly={isReadonly}
        totals={totals}
        setItem={setItem}
        addItem={addItem}
        removeItem={removeItem}
      />

      <SectionCard title="Catatan">
        <Textarea
          value={doc.catatan}
          disabled={isReadonly}
          onChange={(e) => setDoc((p) => ({ ...p, catatan: e.target.value }))}
          rows={3}
          placeholder="Keterangan tambahan pengadaan..."
        />
      </SectionCard>

      {showPreview ? (
        <PengadaanPreview previewInventaris={previewInventaris} totalEksemplar={totals.totalEksemplar} />
      ) : null}

      <PengadaanActionBar
        saving={saving}
        isReadonly={isReadonly}
        totalEksemplar={totals.totalEksemplar}
        onBack={goBack}
        onSaveDraft={() => save(false)}
        onRequestSubmit={() => setConfirmSubmit(true)}
      />

      {confirmSubmit ? (
        <PengadaanSubmitConfirm
          saving={saving}
          totalEksemplar={totals.totalEksemplar}
          onCancel={() => setConfirmSubmit(false)}
          onConfirm={() => save(true)}
        />
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/pengadaan/$name")({ component: PengadaanDetailPage });
