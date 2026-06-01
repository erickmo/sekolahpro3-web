/**
 * Stock Opname — scan mode (route shell).
 *
 * Long-running session: pustakawan scan eksemplar via barcode/RFID berjam-jam.
 * Risk: tab close / refresh hilangkan progress. Mitigasi (autosave draft,
 * localStorage backup, beforeunload guard) hidup di {@link useOpnameSession}.
 *
 * This file stays a thin "fetch + hook + compose" shell: it owns no scan state,
 * only wires the session hook to the presentational sub-components.
 *
 * Lihat PERP-ADR-0004.
 */
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  IconCheck,
  Input,
  PageHeader,
  SearchableSelect,
  SectionCard,
  StatCard,
  Textarea,
} from "@sekolahpro/ui";
import { useOpnameSession } from "../components/perpustakaan/useOpnameSession";
import { OpnameScanInputBar } from "../components/perpustakaan/OpnameScanInputBar";
import { OpnameResultTable } from "../components/perpustakaan/OpnameResultTable";
import { OpnameSubmitConfirmModal } from "../components/perpustakaan/OpnameSubmitConfirmModal";

/** Route to the Inventaris / Stock Opname index, used by the close/back buttons. */
const OPNAME_INDEX_ROUTE = "/sch/$sekolah/perpustakaan/inventaris/opname" as const;

function OpnameScanPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const { name } = useParams({ from: "/sch/$sekolah/perpustakaan/inventaris/opname/$name" });
  const navigate = useNavigate();

  const session = useOpnameSession(sekolah, name);
  const {
    doc,
    setDoc,
    loading,
    saving,
    lastSaved,
    scanInput,
    setScanInput,
    scanStatus,
    setScanStatus,
    confirmSubmit,
    setConfirmSubmit,
    err,
    setDirty,
    scanRef,
    isNew,
    isReadonly,
    currentName,
    stats,
    auditorOptions,
    handleScan,
    updateRow,
    removeRow,
    saveDraft,
    submitOpname,
  } = session;

  if (loading) return <div className="p-6 text-sm text-muted-fg">Memuat...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Perpustakaan / Inventaris / Stock Opname"
        title={isNew ? "Sesi Opname Baru" : currentName}
        description={
          isReadonly
            ? "Sesi opname sudah disubmit. Side-effect (Hilang → Eksemplar non-aktif, Rusak → kondisi) sudah diterapkan."
            : "Scan eksemplar via barcode/RFID. Draft auto-save otomatis."
        }
      />

      {err ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <SectionCard title="Setup Sesi">
        <FormGrid cols={3}>
          <FormField label="Tanggal" htmlFor="tgl">
            <DatePicker
              id="tgl"
              value={doc.tanggal}
              disabled={isReadonly}
              onChange={(v) => {
                setDoc((p) => ({ ...p, tanggal: v }));
                setDirty(true);
              }}
            />
          </FormField>
          <FormField label="Filter Lokasi Rak" htmlFor="rak" hint="Kosongkan = audit semua rak">
            <Input
              id="rak"
              value={doc.lokasi_rak_filter}
              disabled={isReadonly}
              placeholder="Rak A, Lt 2..."
              onChange={(e) => {
                setDoc((p) => ({ ...p, lokasi_rak_filter: e.target.value }));
                setDirty(true);
              }}
            />
          </FormField>
          <FormField label="Auditor" htmlFor="auditor">
            <SearchableSelect
              id="auditor"
              value={doc.auditor}
              disabled={isReadonly}
              onChange={(v) => {
                setDoc((p) => ({ ...p, auditor: v }));
                setDirty(true);
              }}
              options={auditorOptions}
              placeholder="— Pilih —"
            />
          </FormField>
        </FormGrid>
      </SectionCard>

      {!isReadonly ? (
        <OpnameScanInputBar
          scanRef={scanRef}
          scanInput={scanInput}
          onScanInputChange={setScanInput}
          onScan={(raw) => void handleScan(raw)}
          scanStatus={scanStatus}
          onScanStatusChange={setScanStatus}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Scan" value={stats.total.toLocaleString("id-ID")} accent="brand" />
        <StatCard label="Hadir" value={stats.hadir.toLocaleString("id-ID")} accent="emerald" />
        <StatCard label="Hilang" value={stats.hilang.toLocaleString("id-ID")} accent="rose" />
        <StatCard label="Rusak" value={stats.rusak.toLocaleString("id-ID")} accent="amber" />
      </div>

      <OpnameResultTable
        items={doc.items}
        isReadonly={isReadonly}
        saving={saving}
        lastSaved={lastSaved}
        onUpdateRow={updateRow}
        onRemoveRow={removeRow}
      />

      <SectionCard title="Catatan Sesi">
        <Textarea
          value={doc.catatan}
          disabled={isReadonly}
          rows={3}
          onChange={(e) => {
            setDoc((p) => ({ ...p, catatan: e.target.value }));
            setDirty(true);
          }}
        />
      </SectionCard>

      {!isReadonly ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => navigate({ to: OPNAME_INDEX_ROUTE, params: { sekolah } })}>
            Tutup (Draft Tersimpan)
          </Button>
          <Button variant="outline" onClick={() => void saveDraft()} disabled={saving}>
            Simpan Sekarang
          </Button>
          <Button onClick={() => setConfirmSubmit(true)} disabled={saving || doc.items.length === 0}>
            <IconCheck className="mr-1 h-4 w-4 shrink-0" />
            Submit Opname
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <Button variant="outline" onClick={() => navigate({ to: OPNAME_INDEX_ROUTE, params: { sekolah } })}>
            Kembali
          </Button>
        </div>
      )}

      <OpnameSubmitConfirmModal
        open={confirmSubmit}
        stats={stats}
        saving={saving}
        onCancel={() => setConfirmSubmit(false)}
        onConfirm={() => void submitOpname()}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/inventaris/opname/$name")({ component: OpnameScanPage });
