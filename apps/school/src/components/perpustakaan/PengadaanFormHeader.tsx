/**
 * Header fields for the Pengadaan Buku detail page (god-file split).
 *
 * Layer: presentational. Renders the "Informasi Pengadaan" card (date, source,
 * document number, vendor). All state lives in usePengadaanSubmit; this component
 * only reads `doc`/`isReadonly` and calls `setDoc`. Markup moved verbatim.
 */
import {
  DatePicker,
  FormField,
  FormGrid,
  Input,
  SearchableSelect,
  SectionCard,
} from "@sekolahpro/ui";
import type { Header } from "./usePengadaanSubmit";

/** Selectable acquisition sources (Frappe select field options). */
const SUMBER_OPTIONS = [
  { value: "Pembelian", label: "Pembelian" },
  { value: "Hibah", label: "Hibah" },
  { value: "Sumbangan", label: "Sumbangan" },
];

/** Source value that makes the vendor field mandatory. */
const PEMBELIAN: Header["sumber"] = "Pembelian";

/** Number of columns in the header field grid. */
const HEADER_GRID_COLS = 3;

interface Props {
  doc: Header;
  isReadonly: boolean;
  setDoc: React.Dispatch<React.SetStateAction<Header>>;
}

/**
 * Renders the editable acquisition header (tanggal / sumber / no. dokumen /
 * vendor). Disabled once the document is submitted.
 */
export function PengadaanFormHeader({ doc, isReadonly, setDoc }: Props) {
  return (
    <SectionCard title="Informasi Pengadaan">
      <FormGrid cols={HEADER_GRID_COLS}>
        <FormField label="Tanggal Pengadaan" htmlFor="tgl" required>
          <DatePicker
            id="tgl"
            value={doc.tanggal_pengadaan}
            disabled={isReadonly}
            onChange={(v) => setDoc((p) => ({ ...p, tanggal_pengadaan: v }))}
          />
        </FormField>
        <FormField label="Sumber" htmlFor="sumber" required>
          <SearchableSelect
            id="sumber"
            value={doc.sumber}
            disabled={isReadonly}
            onChange={(v) => setDoc((p) => ({ ...p, sumber: v as Header["sumber"] }))}
            options={SUMBER_OPTIONS}
          />
        </FormField>
        <FormField label="No. Dokumen" htmlFor="nodok">
          <Input
            id="nodok"
            value={doc.nomor_dokumen}
            disabled={isReadonly}
            placeholder="PO-2026-001 / Surat Hibah ..."
            onChange={(e) => setDoc((p) => ({ ...p, nomor_dokumen: e.target.value }))}
          />
        </FormField>
        <FormField label="Vendor / Penyumbang" htmlFor="vendor" required={doc.sumber === PEMBELIAN}>
          <Input
            id="vendor"
            value={doc.vendor}
            disabled={isReadonly}
            placeholder="PT Penerbit Sejahtera / Bpk. Andi ..."
            onChange={(e) => setDoc((p) => ({ ...p, vendor: e.target.value }))}
          />
        </FormField>
      </FormGrid>
    </SectionCard>
  );
}
