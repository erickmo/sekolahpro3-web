import type { MasterField } from "../../components/koperasi-master/GenericFormModal";

export interface MasterColumn {
  key: string;
  header: string;
  align?: "left" | "right";
  format?: "currency" | "date" | "check" | "text";
}

export interface MasterConfig {
  /** Doctype Frappe. */
  doctype: string;
  /** Label tab. */
  label: string;
  /** Singular noun untuk modal title ("Fatwa", "Denominasi", …). */
  singular: string;
  fields: MasterField[];
  listFields: string[];
  columns: MasterColumn[];
  searchFields?: string[];
  defaultSort?: { key: string; dir: "asc" | "desc" };
}

const KATEGORI_FATWA = ["Akad Pembiayaan", "Akad Simpanan", "Multiguna", "Lainnya"];
// Exact backend Select values (jenis_dana_zis.json) — incl. "Infaq Sedekah".
const KATEGORI_DANA_ZIS = ["Zakat", "Infaq Sedekah", "Wakaf"];
const JENIS_DENOMINASI = ["Kertas", "Koin"];
const TIPE_SANCTIONS = ["DTTOT", "PEP", "OFAC", "UN", "EU", "Lainnya"];
const KATEGORI_MERCHANT = ["kantin", "toko", "lainnya"];
const STATUS_MERCHANT = ["aktif", "nonaktif"];

export const MASTER_CONFIGS: MasterConfig[] = [
  {
    doctype: "Fatwa DSN MUI",
    label: "Fatwa DSN-MUI",
    singular: "Fatwa",
    fields: [
      { name: "nomor", label: "Nomor Fatwa", type: "data", required: true, placeholder: "DSN-MUI/IV/2000/01" },
      { name: "judul", label: "Judul", type: "data", required: true },
      { name: "kategori", label: "Kategori", type: "select", required: true, options: KATEGORI_FATWA },
      { name: "tahun", label: "Tahun", type: "int" },
      { name: "tanggal_terbit", label: "Tanggal Terbit", type: "date" },
      { name: "aktif", label: "Aktif", type: "check" },
      { name: "deskripsi", label: "Deskripsi", type: "text" },
    ],
    listFields: ["name", "nomor", "judul", "kategori", "tahun", "aktif"],
    searchFields: ["name", "nomor", "judul"],
    defaultSort: { key: "tahun", dir: "desc" },
    columns: [
      { key: "nomor", header: "Nomor" },
      { key: "judul", header: "Judul" },
      { key: "kategori", header: "Kategori" },
      { key: "tahun", header: "Tahun", align: "right" },
      { key: "aktif", header: "Aktif", format: "check" },
    ],
  },
  {
    doctype: "Denominasi Uang",
    label: "Denominasi",
    singular: "Denominasi",
    fields: [
      { name: "nama", label: "Nama", type: "data", required: true, placeholder: "100rb" },
      { name: "nilai", label: "Nilai (Rp)", type: "currency", required: true },
      { name: "jenis", label: "Jenis", type: "select", required: true, options: JENIS_DENOMINASI },
      { name: "urutan", label: "Urutan", type: "int", required: true },
      { name: "aktif", label: "Aktif", type: "check" },
    ],
    listFields: ["name", "nama", "nilai", "jenis", "urutan", "aktif"],
    searchFields: ["name", "nama"],
    defaultSort: { key: "urutan", dir: "asc" },
    columns: [
      { key: "urutan", header: "#", align: "right" },
      { key: "nama", header: "Nama" },
      { key: "nilai", header: "Nilai", align: "right", format: "currency" },
      { key: "jenis", header: "Jenis" },
      { key: "aktif", header: "Aktif", format: "check" },
    ],
  },
  {
    doctype: "Sanctions List Entry",
    label: "Sanctions List",
    singular: "Sanksi",
    fields: [
      { name: "nama", label: "Nama", type: "data", required: true },
      { name: "tipe", label: "Tipe", type: "select", required: true, options: TIPE_SANCTIONS },
      { name: "nomor_identitas", label: "Nomor Identitas", type: "data" },
      { name: "tanggal_lahir", label: "Tanggal Lahir", type: "date" },
      { name: "sumber", label: "Sumber", type: "data" },
      { name: "tanggal_input", label: "Tanggal Input", type: "date" },
      { name: "aktif", label: "Aktif", type: "check" },
      { name: "alamat", label: "Alamat", type: "text" },
    ],
    listFields: ["name", "nama", "tipe", "sumber", "tanggal_input", "aktif"],
    searchFields: ["name", "nama", "nomor_identitas"],
    defaultSort: { key: "tanggal_input", dir: "desc" },
    columns: [
      { key: "nama", header: "Nama" },
      { key: "tipe", header: "Tipe" },
      { key: "sumber", header: "Sumber" },
      { key: "tanggal_input", header: "Tgl Input", format: "date" },
      { key: "aktif", header: "Aktif", format: "check" },
    ],
  },
  {
    doctype: "Merchant",
    label: "Merchant",
    singular: "Merchant",
    fields: [
      { name: "nama_merchant", label: "Nama Merchant", type: "data", required: true },
      { name: "nasabah", label: "Nasabah", type: "link", required: true, linkDoctype: "Nasabah" },
      { name: "user", label: "User", type: "link", required: true, linkDoctype: "User", linkLabelField: "full_name" },
      { name: "rekening_settlement", label: "Rekening Settlement", type: "link", required: true, linkDoctype: "Rekening Simpanan" },
      { name: "kategori", label: "Kategori", type: "select", required: true, options: KATEGORI_MERCHANT },
      { name: "status", label: "Status", type: "select", required: true, options: STATUS_MERCHANT },
    ],
    listFields: ["name", "nama_merchant", "nasabah", "kategori", "status"],
    searchFields: ["name", "nama_merchant", "nasabah"],
    columns: [
      { key: "nama_merchant", header: "Nama" },
      { key: "nasabah", header: "Nasabah" },
      { key: "kategori", header: "Kategori" },
      { key: "status", header: "Status" },
    ],
  },
  {
    doctype: "Jenis Dana ZIS",
    label: "Jenis Dana ZIS",
    singular: "Jenis Dana",
    fields: [
      { name: "nama", label: "Nama", type: "data", required: true, placeholder: "Zakat Maal" },
      { name: "kategori", label: "Kategori", type: "select", required: true, options: KATEGORI_DANA_ZIS },
      { name: "mustahiq_wajib", label: "Wajib 8 Asnaf (Zakat)", type: "check" },
    ],
    listFields: ["name", "nama", "kategori", "mustahiq_wajib"],
    searchFields: ["name", "nama"],
    columns: [
      { key: "nama", header: "Nama" },
      { key: "kategori", header: "Kategori" },
      { key: "mustahiq_wajib", header: "Wajib Asnaf", format: "check" },
    ],
  },
];
