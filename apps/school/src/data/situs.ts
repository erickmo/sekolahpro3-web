import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { frappeFetch } from "@sekolahpro/api-client";

// Client for the school-admin CMS endpoints (sekolahpro.api.situs_admin.*).
// Every call is implicitly tenant-scoped server-side via _assert_owns(sekolah).

const M = "sekolahpro.api.situs_admin";

/** Block tipe keys — mirror Situs Layout Block.tipe Select on the backend. */
export type BlockTipe =
  | "hero" | "keunggulan" | "statistik" | "testimoni" | "profil"
  | "berita" | "agenda" | "galeri" | "prestasi" | "ppdb"
  | "cta" | "kontak" | "richtext";

/** One row of Situs Sekolah.layout_blocks (Situs Layout Block, istable). */
export interface LayoutBlockRow {
  tipe: BlockTipe;
  variant: string;
  aktif: 0 | 1;
  judul?: string;
  subjudul?: string;
  cta_label?: string;
  cta_url?: string;
  konten?: string;
}

/** One row of Situs Sekolah.keunggulan (Situs Keunggulan, istable). */
export interface KeunggulanRow {
  ikon: string;
  judul: string;
  deskripsi: string;
}

/** One row of Situs Sekolah.statistik (Situs Statistik, istable). */
export interface StatistikRow {
  label: string;
  nilai: string;
  satuan?: string;
}

/** One row of Situs Sekolah.testimoni (Situs Testimoni, istable). */
export interface TestimoniRow {
  nama: string;
  peran?: string;
  foto?: string;
  kutipan: string;
}

/** The editable Situs Sekolah config (subset the CMS touches). */
export interface SitusDoc {
  sekolah: string;
  status: "Draft" | "Terbit";
  subdomain: string | null;
  custom_domain: string | null;
  domain_verified: 0 | 1;
  ssl_status: string;
  template: string | null;
  brand_color: string | null;
  brand_color_2: string | null;
  logo: string | null;
  favicon: string | null;
  hero_image: string | null;
  tagline: string | null;
  hero_judul: string | null;
  hero_subjudul: string | null;
  hero_cta_label: string | null;
  hero_cta_url: string | null;
  hero_eyebrow: string | null;
  hero_cta2_label: string | null;
  hero_cta2_url: string | null;
  visi: string | null;
  misi: string | null;
  sambutan_kepsek: string | null;
  nama_kepsek: string | null;
  alamat: string | null;
  peta_embed: string | null;
  tampilkan_berita: 0 | 1;
  tampilkan_agenda: 0 | 1;
  tampilkan_galeri: 0 | 1;
  tampilkan_prestasi: 0 | 1;
  tampilkan_fasilitas: 0 | 1;
  tampilkan_sambutan: 0 | 1;
  tampilkan_ppdb: 0 | 1;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  layout_blocks: LayoutBlockRow[];
  keunggulan: KeunggulanRow[];
  statistik: StatistikRow[];
  testimoni: TestimoniRow[];
}

export interface SitusTemplate {
  key: string;
  nama: string;
  deskripsi: string | null;
  preview_image: string | null;
  status: string;
  aksen_default: string | null;
}

export type KontenDoctype =
  | "Berita Sekolah"
  | "Halaman Situs"
  | "Agenda Sekolah"
  | "Galeri Sekolah"
  | "Prestasi Sekolah";

export type KontenRow = Record<string, unknown> & { name: string };

export function useSitus(sekolah: string): UseQueryResult<SitusDoc> {
  return useQuery<SitusDoc>({
    queryKey: [`${M}.get_situs`, sekolah],
    queryFn: () => frappeFetch<SitusDoc>(`${M}.get_situs`, { sekolah }),
    staleTime: 30 * 1000,
  });
}

export function useTemplates(): UseQueryResult<SitusTemplate[]> {
  return useQuery<SitusTemplate[]>({
    queryKey: [`${M}.list_template`],
    queryFn: () => frappeFetch<SitusTemplate[]>(`${M}.list_template`, {}),
    staleTime: 10 * 60 * 1000,
  });
}

/** Save partial Situs Sekolah values; invalidates the site query on success. */
export function useSaveSitus(sekolah: string) {
  const qc = useQueryClient();
  return useMutation<SitusDoc, Error, Partial<SitusDoc>>({
    mutationFn: (values) => frappeFetch<SitusDoc>(`${M}.save_situs`, { sekolah, values }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`${M}.get_situs`, sekolah] }),
  });
}

export function usePublish(sekolah: string) {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, { status: "Draft" | "Terbit" }>({
    mutationFn: ({ status }) => frappeFetch<{ ok: boolean }>(`${M}.publish`, { sekolah, status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`${M}.get_situs`, sekolah] }),
  });
}

export function useSetDomain(sekolah: string) {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, { subdomain?: string; custom_domain?: string }>({
    mutationFn: (args) => frappeFetch<{ ok: boolean }>(`${M}.set_domain`, { sekolah, ...args }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`${M}.get_situs`, sekolah] }),
  });
}

export function useKontenList(sekolah: string, doctype: KontenDoctype) {
  return useQuery<KontenRow[]>({
    queryKey: [`${M}.list_konten`, sekolah, doctype],
    queryFn: () => frappeFetch<KontenRow[]>(`${M}.list_konten`, { sekolah, doctype }),
    staleTime: 30 * 1000,
  });
}

export function useSaveKonten(sekolah: string, doctype: KontenDoctype) {
  const qc = useQueryClient();
  return useMutation<KontenRow, Error, Record<string, unknown>>({
    mutationFn: (values) => frappeFetch<KontenRow>(`${M}.save_konten`, { sekolah, doctype, values }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`${M}.list_konten`, sekolah, doctype] }),
  });
}

export function useDeleteKonten(sekolah: string, doctype: KontenDoctype) {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, { name: string }>({
    mutationFn: ({ name }) => frappeFetch<{ ok: boolean }>(`${M}.delete_konten`, { sekolah, doctype, name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`${M}.list_konten`, sekolah, doctype] }),
  });
}
