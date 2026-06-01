/**
 * KolektifMemberPanel — "Header Pinjam" form section for a class collective loan.
 *
 * Layer: presentational. Owns the guru-PJ / rombel pickers, the loan date range,
 * the destination/topic field, and the status select. All edits flow back up via
 * the {@link Props.onPatch} callback; this component holds no transaction state.
 *
 * The guru and rombel searchers live here because they are only consumed by this
 * panel (route does not need them after extraction).
 */
import {
  FormField,
  FormGrid,
  Input,
  DatePicker,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource } from "@sekolahpro/api-client";

/** Status options for a collective loan header. */
const STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "Aktif", label: "Aktif" },
  { value: "Selesai", label: "Selesai" },
  { value: "Terlambat", label: "Terlambat" },
  { value: "Batal", label: "Batal" },
];

/** Default status applied when a header has none set. */
const STATUS_DEFAULT = "Aktif";

/** Page size for the picker lookups. */
const PICKER_LIMIT = 20;

/** The header fields this panel reads/edits (subset of the route's Header). */
export interface KolektifHeaderFields {
  guru_penanggung_jawab: string;
  rombongan: string;
  tujuan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  status?: string;
}

/** Search Guru by name or full name for the PJ picker. */
async function searchGuru(q: string): Promise<SearchableOption[]> {
  const f = q ? { or_filters: [["name", "like", `%${q}%`], ["nama_lengkap", "like", `%${q}%`]] as [string, string, unknown][] } : {};
  const rows = await listResource<{ name: string; nama_lengkap?: string }>("Guru", {
    fields: ["name", "nama_lengkap"], ...f, limit_page_length: PICKER_LIMIT,
  });
  return rows.map((r) => ({ value: r.name, label: r.nama_lengkap ?? r.name }));
}

/** Search Rombongan Belajar by name or class name for the rombel picker. */
async function searchRombel(q: string): Promise<SearchableOption[]> {
  const f = q ? { or_filters: [["name", "like", `%${q}%`], ["nama_rombel", "like", `%${q}%`]] as [string, string, unknown][] } : {};
  const rows = await listResource<{ name: string; nama_rombel?: string }>("Rombongan Belajar", {
    fields: ["name", "nama_rombel"], ...f, limit_page_length: PICKER_LIMIT,
  });
  return rows.map((r) => ({ value: r.name, label: r.nama_rombel ?? r.name }));
}

interface Props {
  doc: KolektifHeaderFields;
  isReadonly: boolean;
  /** Patch one or more header fields on the parent's doc state. */
  onPatch: (patch: Partial<KolektifHeaderFields>) => void;
}

/**
 * Render the header form (member pick + summary) for a collective loan. The
 * SectionCard wrapper is supplied by the caller's layout, so this returns just
 * the field grid.
 */
export function KolektifMemberPanel({ doc, isReadonly, onPatch }: Props) {
  return (
    <FormGrid cols={3}>
      <FormField label="Guru PJ" htmlFor="guru" required>
        <SearchableSelect
          value={doc.guru_penanggung_jawab}
          disabled={isReadonly}
          onChange={(v) => onPatch({ guru_penanggung_jawab: v })}
          loadOptions={searchGuru}
          resolveLabel={async (v) => v}
          placeholder="Cari guru…"
        />
      </FormField>
      <FormField label="Rombel" htmlFor="rombel" required>
        <SearchableSelect
          value={doc.rombongan}
          disabled={isReadonly}
          onChange={(v) => onPatch({ rombongan: v })}
          loadOptions={searchRombel}
          resolveLabel={async (v) => v}
          placeholder="Cari rombel…"
        />
      </FormField>
      <FormField label="Tujuan / Topik" htmlFor="tujuan">
        <Input id="tujuan" value={doc.tujuan} disabled={isReadonly}
          placeholder="Paket bacaan literasi Sept..."
          onChange={(e) => onPatch({ tujuan: e.target.value })} />
      </FormField>
      <FormField label="Tanggal Pinjam" htmlFor="tp" required>
        <DatePicker id="tp" value={doc.tanggal_pinjam} disabled={isReadonly}
          onChange={(v) => onPatch({ tanggal_pinjam: v })} />
      </FormField>
      <FormField label="Rencana Kembali" htmlFor="tkr" required>
        <DatePicker id="tkr" value={doc.tanggal_kembali_rencana} disabled={isReadonly}
          onChange={(v) => onPatch({ tanggal_kembali_rencana: v })} />
      </FormField>
      <FormField label="Status" htmlFor="st">
        <SearchableSelect
          id="st"
          value={doc.status ?? STATUS_DEFAULT}
          disabled={isReadonly}
          onChange={(v) => onPatch({ status: v })}
          options={[...STATUS_OPTIONS]}
        />
      </FormField>
    </FormGrid>
  );
}
