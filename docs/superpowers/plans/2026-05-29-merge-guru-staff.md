# Merge Guru & Staff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `Guru` and `Staff` modules under a single `/staff` route backed by a unified `Pegawai` entity with `roles[]`, supporting dual-role personnel via conditional tabs.

**Architecture:** Build `data/pegawai.ts` as the canonical mock source by porting and merging the existing `data/guru.ts` + `data/staff.ts` fixtures (dedupe by NIP, mark dual-role exemplars). Replace `$sekolah.guru.*` and `$sekolah.staff.*` route files with a new `$sekolah.staff.*` set whose detail page renders tabs conditional on `roles`. Update sidebar, role access map, and external importers (`global-search`).

**Tech Stack:** TanStack Router file-routes, React 18, TypeScript, Tailwind, mock data (no backend changes), `@sekolahpro/ui` primitives.

**Spec:** `docs/superpowers/specs/2026-05-29-merge-guru-staff-design.md`

---

## File Structure

**New files:**
- `apps/school/src/data/pegawai.ts` — unified Pegawai entity, fixtures, helpers.
- `apps/school/src/features/pegawai/RoleBadges.tsx`
- `apps/school/src/features/pegawai/PegawaiHeader.tsx`
- `apps/school/src/features/pegawai/ProfilTab.tsx`
- `apps/school/src/features/pegawai/MengajarTab.tsx`
- `apps/school/src/features/pegawai/StaffTab.tsx`
- `apps/school/src/features/pegawai/BerkasTab.tsx`
- `apps/school/src/features/pegawai/KehadiranTab.tsx`
- `apps/school/src/features/pegawai/AktivitasTab.tsx`
- `apps/school/src/features/pegawai/daftarColumns.tsx`
- `apps/school/src/data/__tests__/pegawai.test.ts`

**Replaced (overwrite):**
- `apps/school/src/routes/$sekolah.staff.tsx`
- `apps/school/src/routes/$sekolah.staff.index.tsx`
- `apps/school/src/routes/$sekolah.staff.daftar.tsx`
- `apps/school/src/routes/$sekolah.staff.berkas.tsx`
- `apps/school/src/routes/$sekolah.staff.jabatan.tsx`
- `apps/school/src/routes/$sekolah.staff.sk-jabatan.tsx`
- `apps/school/src/routes/$sekolah.staff.$nip.tsx`

**New routes (moved from /guru):**
- `apps/school/src/routes/$sekolah.staff.mapel-pengampu.tsx`
- `apps/school/src/routes/$sekolah.staff.penugasan.tsx`
- `apps/school/src/routes/$sekolah.staff.sk-mengajar.tsx`

**Deleted:**
- `apps/school/src/data/guru.ts`
- `apps/school/src/data/staff.ts`
- `apps/school/src/routes/$sekolah.guru.tsx`
- `apps/school/src/routes/$sekolah.guru.index.tsx`
- `apps/school/src/routes/$sekolah.guru.daftar.tsx`
- `apps/school/src/routes/$sekolah.guru.berkas.tsx`
- `apps/school/src/routes/$sekolah.guru.jabatan.tsx`
- `apps/school/src/routes/$sekolah.guru.sk-jabatan.tsx`
- `apps/school/src/routes/$sekolah.guru.mapel-pengampu.tsx`
- `apps/school/src/routes/$sekolah.guru.penugasan.tsx`
- `apps/school/src/routes/$sekolah.guru.sk-mengajar.tsx`
- `apps/school/src/routes/$sekolah.guru.$nip.tsx`

**Modified:**
- `apps/school/src/routes/__root.tsx` — sidebar + role access map.
- `apps/school/src/lib/global-search.ts` — repoint from `data/guru` to `data/pegawai`.
- `apps/school/src/routes/$sekolah.absensi.guru.tsx` — repoint imports (if it imports guru list).

---

## Task 1: Add Pegawai types and dual-role helpers (TDD)

**Files:**
- Create: `apps/school/src/data/pegawai.ts`
- Test: `apps/school/src/data/__tests__/pegawai.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/school/src/data/__tests__/pegawai.test.ts
import { describe, it, expect } from "vitest";
import {
  PEGAWAI_LIST,
  findPegawai,
  listPegawaiForSekolah,
  isGuru,
  isStaff,
  isDualRole,
  type Pegawai,
} from "../pegawai";

describe("pegawai entity", () => {
  it("every pegawai has at least one role", () => {
    for (const p of PEGAWAI_LIST) {
      expect(p.roles.length).toBeGreaterThan(0);
    }
  });

  it("role profile presence matches roles array", () => {
    for (const p of PEGAWAI_LIST) {
      expect(p.roles.includes("guru")).toBe(p.guru !== undefined);
      expect(p.roles.includes("staff")).toBe(p.staff !== undefined);
    }
  });

  it("contains at least two dual-role exemplars", () => {
    const dual = PEGAWAI_LIST.filter(isDualRole);
    expect(dual.length).toBeGreaterThanOrEqual(2);
  });

  it("findPegawai returns undefined for unknown NIP", () => {
    expect(findPegawai("DOES-NOT-EXIST")).toBeUndefined();
  });

  it("listPegawaiForSekolah filters by school slug", () => {
    const slug = PEGAWAI_LIST[0]!.sekolah;
    const subset = listPegawaiForSekolah(slug);
    expect(subset.every((p) => p.sekolah === slug)).toBe(true);
  });

  it("role predicates are consistent", () => {
    const guruOnly: Pegawai = { ...PEGAWAI_LIST.find((p) => isGuru(p) && !isStaff(p))! };
    expect(isGuru(guruOnly)).toBe(true);
    expect(isStaff(guruOnly)).toBe(false);
    expect(isDualRole(guruOnly)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sekolahpro/school test data/__tests__/pegawai.test.ts`
Expected: FAIL — module `../pegawai` not found.

- [ ] **Step 3: Create `data/pegawai.ts` with types, fixtures, helpers**

```ts
// apps/school/src/data/pegawai.ts
import { belongsToSchool, pickSchoolSlug, type MockSchoolSlug } from "./school-scope";

export type RolePegawai = "guru" | "staff";

export type StatusPegawai =
  | "Aktif"
  | "Cuti"
  | "Non-aktif"
  | "Pensiun"
  | "Kontrak Berakhir";

export type JenisKelamin = "Laki-laki" | "Perempuan";
export type Agama = "Islam" | "Kristen" | "Katolik" | "Hindu" | "Budha" | "Konghucu";

export type JenisPtk =
  | "Guru Kelas" | "Guru Mapel" | "Guru BK" | "Kepala Sekolah" | "Wakil Kepsek";

export type StatusKepegawaian =
  | "PNS" | "PPPK" | "GTY" | "GTT" | "Tetap Yayasan" | "Kontrak" | "Honorer";

export type Departemen =
  | "Tata Usaha" | "Keuangan" | "Perpustakaan" | "Laboratorium" | "Keamanan"
  | "Kebersihan" | "Kantin" | "Teknologi Informasi" | "Sarana Prasarana" | "Kesehatan";

export interface JadwalMengajarRow {
  hari: "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
  jam: string;
  mapel: string;
  kelas: string;
  ruang: string;
}

export interface KelasAmpuRow {
  kelas: string;
  mapel: string;
  jumlahSiswa: number;
  rataNilai: number;
}

export interface RiwayatMengajarRow {
  tahun: string;
  semester: "Ganjil" | "Genap";
  mapel: string;
  kelas: string;
  jumlahSiswa: number;
}

export interface SertifikasiRow {
  nama: string;
  lembaga: string;
  tanggal: string;
  noSertifikat: string;
  masaBerlaku?: string | undefined;
}

export interface SkMengajarRow {
  nomorSk: string;
  tanggalSk: string;
  mapel: string;
  tahunAjaran: string;
}

export interface TugasRow {
  id: string;
  judul: string;
  deskripsi: string;
  prioritas: "Rendah" | "Sedang" | "Tinggi" | "Mendesak";
  status: "Backlog" | "Berjalan" | "Selesai" | "Tertunda";
  jatuhTempo: string;
  pemberi: string;
}

export interface RiwayatJabatanRow {
  tahun: string;
  jabatan: string;
  departemen: string;
  keterangan?: string | undefined;
}

export interface PelatihanRow {
  nama: string;
  penyelenggara: string;
  tanggal: string;
  durasi: string;
  sertifikatUrl?: string | undefined;
}

export interface KehadiranRow {
  tanggal: string;
  status: "Hadir" | "Sakit" | "Izin" | "Dinas Luar" | "Alpa";
  jamMasuk?: string | undefined;
  jamPulang?: string | undefined;
  keterangan?: string | undefined;
}

export interface DokumenRow {
  nama: string;
  tipe: "Ijazah" | "Akta" | "Sertifikat" | "SK" | "KTP" | "KK" | "Foto" | "NPWP" | "Kontrak" | "Lainnya";
  ukuran: string;
  diunggah: string;
  url?: string | undefined;
}

export interface AktivitasRow {
  waktu: string;
  aktor: string;
  aksi: string;
  tone: "neutral" | "brand" | "success" | "warning" | "danger";
}

export interface PegawaiProfilGuru {
  jenisPtk: JenisPtk;
  mapelPengampu: string[];
  jadwalMengajar: JadwalMengajarRow[];
  kelasAmpu: KelasAmpuRow[];
  riwayatMengajar: RiwayatMengajarRow[];
  sertifikasi: SertifikasiRow[];
  skMengajar: SkMengajarRow[];
  totalJamMengajar: number;
  jumlahKelas: number;
  jumlahSiswaBinaan: number;
  rataNilaiKelas: number;
}

export interface PegawaiProfilStaff {
  departemen: Departemen;
  jabatanStaff: string;
  atasan?: string | undefined;
  tugas: TugasRow[];
  riwayatJabatan: RiwayatJabatanRow[];
  pelatihan: PelatihanRow[];
  jumlahTugasAktif: number;
  jumlahTugasSelesai: number;
  jamKerjaMingguIni: number;
}

export interface Pegawai {
  sekolah: MockSchoolSlug;
  nip: string;
  nuptk?: string | undefined;
  nik?: string | undefined;
  namaLengkap: string;
  gelar?: { depan?: string | undefined; belakang?: string | undefined } | undefined;
  roles: RolePegawai[];
  status: StatusPegawai;
  jenisKelamin: JenisKelamin;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Agama;
  kewarganegaraan: "WNI" | "WNA";
  jabatanUtama: string;
  statusKepegawaian: StatusKepegawaian;
  pangkat?: string | undefined;
  golongan?: string | undefined;
  tmtKerja: string;
  tahunPensiun?: string | undefined;
  masaKontrakBerakhir?: string | undefined;
  pendidikanTerakhir: string;
  jurusan?: string | undefined;
  asalKampus?: string | undefined;
  gajiPokok?: number | undefined;
  tunjangan?: number | undefined;
  alamat?: string | undefined;
  rt?: string | undefined;
  rw?: string | undefined;
  desa?: string | undefined;
  kecamatan?: string | undefined;
  kabupaten?: string | undefined;
  provinsi?: string | undefined;
  kodePos?: string | undefined;
  telepon?: string | undefined;
  email?: string | undefined;
  fotoUrl?: string | undefined;
  guru?: PegawaiProfilGuru | undefined;
  staff?: PegawaiProfilStaff | undefined;
  kehadiran: KehadiranRow[];
  dokumen: DokumenRow[];
  aktivitas: AktivitasRow[];
  persenKehadiran: number;
}

export function isGuru(p: Pegawai): boolean {
  return p.roles.includes("guru");
}

export function isStaff(p: Pegawai): boolean {
  return p.roles.includes("staff");
}

export function isDualRole(p: Pegawai): boolean {
  return isGuru(p) && isStaff(p);
}

// Placeholder list; fixture builders added in Task 2.
export const PEGAWAI_LIST: Pegawai[] = [];

export function findPegawai(nip: string, sekolah?: string): Pegawai | undefined {
  const p = PEGAWAI_LIST.find((row) => row.nip === nip);
  if (!p) return undefined;
  if (sekolah && !belongsToSchool(p.sekolah, sekolah)) return undefined;
  return p;
}

export function listPegawaiForSekolah(sekolah?: string): Pegawai[] {
  if (!sekolah) return PEGAWAI_LIST;
  return PEGAWAI_LIST.filter((p) => belongsToSchool(p.sekolah, sekolah));
}

// Re-exports used by sidebar/global-search; replaced by richer fixtures in Task 2.
export { pickSchoolSlug };
```

- [ ] **Step 4: Run test — confirm only "at least one role" and "dual-role exemplars" fail**

Run: `pnpm --filter @sekolahpro/school test data/__tests__/pegawai.test.ts`
Expected: FAIL on `PEGAWAI_LIST.length === 0` cases. (Task 2 fills fixtures.)

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/data/pegawai.ts apps/school/src/data/__tests__/pegawai.test.ts
git commit -m "feat(school): add Pegawai entity types and role helpers"
```

---

## Task 2: Port + merge guru/staff fixtures into PEGAWAI_LIST

**Files:**
- Modify: `apps/school/src/data/pegawai.ts`

- [ ] **Step 1: Port `buildGuru` and `buildStaff` body into private builders inside `pegawai.ts`**

Open `apps/school/src/data/guru.ts` (lines 117–290) and `apps/school/src/data/staff.ts` (lines 115–290). Inline the constant tables (`namaList`, `mapelList`, `jabatanList`, `jenisPtkList`, `statusList`, `statusKepList`, `agamaList`, `kelasList`, `hariList`, `ruangList`, `gelarDepanList`, `gelarBelakangList`, `pangkatList`, `golonganList`, `pendidikanList`, `jurusanList`, `kampusList`, `departemenList`, `jabatanByDept`, `statusKepegawaianList`) and the helpers (`rand`, `pick`, `pad`) into `pegawai.ts`. Rename collisions:
- guru side `namaList` → `guruNamaList`
- staff side `namaList` → `staffNamaList`
- guru side `statusList` → `statusGuruList`
- staff side `statusList` → `statusStaffList`
- guru side `statusKepList` → `statusKepGuruList`
- staff side `statusKepegawaianList` → `statusKepStaffList`

- [ ] **Step 2: Implement `buildGuruProfile(idx, mataPelajaran)` returning `PegawaiProfilGuru` plus shared fields**

Reuse the existing guru fixture body verbatim but split: shared fields (NIP, NUPTK, alamat, kehadiran, dokumen, aktivitas, persenKehadiran) returned alongside a `PegawaiProfilGuru`. The function signature:

```ts
interface GuruFixture {
  shared: Omit<Pegawai, "roles" | "guru" | "staff">;
  profil: PegawaiProfilGuru;
}
function buildGuruFixture(idx: number): GuruFixture { /* port guru.ts buildGuru body */ }
```

Map `mataPelajaran` → `profil.mapelPengampu`. Map ringkasan fields (`totalJamMengajar`, `jumlahKelas`, `jumlahSiswaBinaan`, `rataNilaiKelas`) into `profil`. `persenKehadiran` lives on `shared`. Add three `SkMengajarRow` entries per fixture using `tahunMasuk` + `mapelUtama`:

```ts
const skMengajar: SkMengajarRow[] = [
  { nomorSk: `SK/MGJ/${pad(idx + 100, 4)}/2024`, tanggalSk: "2024-07-15", mapel: mapelUtama, tahunAjaran: "2024/2025" },
  { nomorSk: `SK/MGJ/${pad(idx + 100, 4)}/2025`, tanggalSk: "2025-07-15", mapel: mapelUtama, tahunAjaran: "2025/2026" },
];
```

Map `jabatan` (existing guru.ts) → `shared.jabatanUtama`.

- [ ] **Step 3: Implement `buildStaffFixture(idx)` returning shared + `PegawaiProfilStaff`**

```ts
interface StaffFixture {
  shared: Omit<Pegawai, "roles" | "guru" | "staff">;
  profil: PegawaiProfilStaff;
}
function buildStaffFixture(idx: number): StaffFixture { /* port staff.ts buildStaff body */ }
```

`profil.jabatanStaff` ← existing `jabatan`. `shared.jabatanUtama` ← existing `jabatan`. `shared.statusKepegawaian` maps directly. The staff `nik`, `tmtKerja`, `gajiPokok`, `tunjangan`, `masaKontrakBerakhir`, `atasan` (`profil.atasan`) follow original fields. Re-use the existing dokumen/aktivitas/kehadiran/tugas/riwayatJabatan/pelatihan generation.

- [ ] **Step 4: Build PEGAWAI_LIST: 30 guru-only + 30 staff-only + 4 dual-role**

```ts
export const PEGAWAI_LIST: Pegawai[] = (() => {
  const list: Pegawai[] = [];

  for (let i = 0; i < 30; i++) {
    const g = buildGuruFixture(i);
    list.push({ ...g.shared, roles: ["guru"], guru: g.profil });
  }

  for (let i = 0; i < 30; i++) {
    const s = buildStaffFixture(i);
    list.push({ ...s.shared, roles: ["staff"], staff: s.profil });
  }

  // Dual-role exemplars: take guru indices 0,5,10,15, attach a staff profile.
  for (const guruIdx of [0, 5, 10, 15]) {
    const target = list[guruIdx]!;
    const s = buildStaffFixture(guruIdx + 50);
    const merged: Pegawai = {
      ...target,
      roles: ["guru", "staff"],
      staff: { ...s.profil, departemen: "Tata Usaha" },
    };
    list[guruIdx] = merged;
  }

  return list;
})();
```

- [ ] **Step 5: Run pegawai test**

Run: `pnpm --filter @sekolahpro/school test data/__tests__/pegawai.test.ts`
Expected: PASS — all 6 cases.

- [ ] **Step 6: Commit**

```bash
git add apps/school/src/data/pegawai.ts
git commit -m "feat(school): port guru+staff fixtures into PEGAWAI_LIST with dual-role exemplars"
```

---

## Task 3: Build feature components (RoleBadges + Header)

**Files:**
- Create: `apps/school/src/features/pegawai/RoleBadges.tsx`
- Create: `apps/school/src/features/pegawai/PegawaiHeader.tsx`

- [ ] **Step 1: Create `RoleBadges.tsx`**

```tsx
// apps/school/src/features/pegawai/RoleBadges.tsx
import { Badge } from "@sekolahpro/ui";
import type { RolePegawai } from "../../data/pegawai";

export function RoleBadges({ roles }: { roles: RolePegawai[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {roles.includes("guru") ? (
        <Badge tone="brand">Guru</Badge>
      ) : null}
      {roles.includes("staff") ? (
        <Badge tone="success">Staff</Badge>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Create `PegawaiHeader.tsx`**

```tsx
// apps/school/src/features/pegawai/PegawaiHeader.tsx
import { Avatar, Badge } from "@sekolahpro/ui";
import type { Pegawai } from "../../data/pegawai";
import { RoleBadges } from "./RoleBadges";

const STATUS_TONE: Record<Pegawai["status"], "success" | "warning" | "neutral" | "danger"> = {
  "Aktif": "success",
  "Cuti": "warning",
  "Non-aktif": "neutral",
  "Pensiun": "neutral",
  "Kontrak Berakhir": "danger",
};

export function PegawaiHeader({ pegawai }: { pegawai: Pegawai }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-bg p-4">
      <Avatar name={pegawai.namaLengkap} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-fg truncate">{pegawai.namaLengkap}</h1>
          <Badge tone={STATUS_TONE[pegawai.status]}>{pegawai.status}</Badge>
        </div>
        <div className="text-sm text-muted-fg">
          NIP {pegawai.nip} · {pegawai.jabatanUtama} · {pegawai.statusKepegawaian}
        </div>
        <div className="mt-2">
          <RoleBadges roles={pegawai.roles} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/school/src/features/pegawai/RoleBadges.tsx apps/school/src/features/pegawai/PegawaiHeader.tsx
git commit -m "feat(school): pegawai header + role badges components"
```

---

## Task 4: Build tab components (Profil, Mengajar, Staff, Berkas, Kehadiran, Aktivitas)

**Files:**
- Create: `apps/school/src/features/pegawai/ProfilTab.tsx`
- Create: `apps/school/src/features/pegawai/MengajarTab.tsx`
- Create: `apps/school/src/features/pegawai/StaffTab.tsx`
- Create: `apps/school/src/features/pegawai/BerkasTab.tsx`
- Create: `apps/school/src/features/pegawai/KehadiranTab.tsx`
- Create: `apps/school/src/features/pegawai/AktivitasTab.tsx`

- [ ] **Step 1: Port profil section from `$sekolah.guru.$nip.tsx`/`$sekolah.staff.$nip.tsx` into `ProfilTab.tsx`**

Open `apps/school/src/routes/$sekolah.guru.$nip.tsx`. Locate the "Profil" / "Data pribadi" cards (search for `Tempat lahir`, `Agama`, `Kewarganegaraan`, `Alamat`). Copy markup into:

```tsx
// apps/school/src/features/pegawai/ProfilTab.tsx
import type { Pegawai } from "../../data/pegawai";

export function ProfilTab({ pegawai }: { pegawai: Pegawai }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-fg">Data Pribadi</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Tempat lahir</dt><dd>{pegawai.tempatLahir}</dd>
          <dt className="text-muted-fg">Tanggal lahir</dt><dd>{pegawai.tanggalLahir}</dd>
          <dt className="text-muted-fg">Jenis kelamin</dt><dd>{pegawai.jenisKelamin}</dd>
          <dt className="text-muted-fg">Agama</dt><dd>{pegawai.agama}</dd>
          <dt className="text-muted-fg">Kewarganegaraan</dt><dd>{pegawai.kewarganegaraan}</dd>
          <dt className="text-muted-fg">NIK</dt><dd>{pegawai.nik ?? "—"}</dd>
          <dt className="text-muted-fg">NUPTK</dt><dd>{pegawai.nuptk ?? "—"}</dd>
        </dl>
      </section>
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2">
        <h2 className="text-sm font-semibold text-fg">Kontak & Alamat</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Telepon</dt><dd>{pegawai.telepon ?? "—"}</dd>
          <dt className="text-muted-fg">Email</dt><dd>{pegawai.email ?? "—"}</dd>
          <dt className="text-muted-fg">Alamat</dt><dd>{pegawai.alamat ?? "—"}</dd>
          <dt className="text-muted-fg">Kabupaten</dt><dd>{pegawai.kabupaten ?? "—"}</dd>
          <dt className="text-muted-fg">Provinsi</dt><dd>{pegawai.provinsi ?? "—"}</dd>
        </dl>
      </section>
      <section className="rounded-lg border border-border bg-bg p-4 space-y-2 md:col-span-2">
        <h2 className="text-sm font-semibold text-fg">Kepegawaian</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Status pegawai</dt><dd>{pegawai.statusKepegawaian}</dd>
          <dt className="text-muted-fg">TMT kerja</dt><dd>{pegawai.tmtKerja}</dd>
          <dt className="text-muted-fg">Pendidikan</dt><dd>{pegawai.pendidikanTerakhir}{pegawai.jurusan ? ` · ${pegawai.jurusan}` : ""}</dd>
          {pegawai.pangkat ? (<><dt className="text-muted-fg">Pangkat/Golongan</dt><dd>{pegawai.pangkat} / {pegawai.golongan}</dd></>) : null}
          {pegawai.masaKontrakBerakhir ? (<><dt className="text-muted-fg">Kontrak berakhir</dt><dd>{pegawai.masaKontrakBerakhir}</dd></>) : null}
        </dl>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Implement `MengajarTab.tsx`**

```tsx
// apps/school/src/features/pegawai/MengajarTab.tsx
import type { Pegawai, PegawaiProfilGuru } from "../../data/pegawai";

export function MengajarTab({ profil }: { profil: PegawaiProfilGuru }) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Mata Pelajaran Pengampu</h2>
        <div className="flex flex-wrap gap-2">
          {profil.mapelPengampu.map((m) => (
            <span key={m} className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs">{m}</span>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-fg">
          {profil.jenisPtk} · {profil.jumlahKelas} kelas · {profil.totalJamMengajar} jam/minggu · rata-rata nilai {profil.rataNilaiKelas}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Jadwal Mengajar</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-fg">
            <tr><th className="text-left p-1">Hari</th><th className="text-left p-1">Jam</th><th className="text-left p-1">Mapel</th><th className="text-left p-1">Kelas</th><th className="text-left p-1">Ruang</th></tr>
          </thead>
          <tbody>
            {profil.jadwalMengajar.map((j, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-1">{j.hari}</td><td className="p-1">{j.jam}</td><td className="p-1">{j.mapel}</td><td className="p-1">{j.kelas}</td><td className="p-1">{j.ruang}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Riwayat Mengajar</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-fg">
            <tr><th className="text-left p-1">Tahun</th><th className="text-left p-1">Semester</th><th className="text-left p-1">Mapel</th><th className="text-left p-1">Kelas</th><th className="text-left p-1">Siswa</th></tr>
          </thead>
          <tbody>
            {profil.riwayatMengajar.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-1">{r.tahun}</td><td className="p-1">{r.semester}</td><td className="p-1">{r.mapel}</td><td className="p-1">{r.kelas}</td><td className="p-1">{r.jumlahSiswa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">SK Mengajar</h2>
        <ul className="text-sm space-y-1">
          {profil.skMengajar.map((sk) => (
            <li key={sk.nomorSk} className="flex justify-between">
              <span>{sk.nomorSk} — {sk.mapel} ({sk.tahunAjaran})</span>
              <span className="text-muted-fg">{sk.tanggalSk}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Sertifikasi</h2>
        <ul className="text-sm space-y-1">
          {profil.sertifikasi.map((s) => (
            <li key={s.noSertifikat} className="flex justify-between">
              <span>{s.nama} — {s.lembaga}</span>
              <span className="text-muted-fg">{s.tanggal}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Suppress unused warning for Pegawai typing convenience.
export type _PegawaiRef = Pegawai;
```

- [ ] **Step 3: Implement `StaffTab.tsx`**

```tsx
// apps/school/src/features/pegawai/StaffTab.tsx
import type { Pegawai, PegawaiProfilStaff } from "../../data/pegawai";

const PRIO_TONE = { "Rendah": "neutral", "Sedang": "brand", "Tinggi": "warning", "Mendesak": "danger" } as const;

export function StaffTab({ profil }: { profil: PegawaiProfilStaff }) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Departemen & Jabatan</h2>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-fg">Departemen</dt><dd>{profil.departemen}</dd>
          <dt className="text-muted-fg">Jabatan</dt><dd>{profil.jabatanStaff}</dd>
          <dt className="text-muted-fg">Atasan</dt><dd>{profil.atasan ?? "—"}</dd>
          <dt className="text-muted-fg">Jam kerja/minggu</dt><dd>{profil.jamKerjaMingguIni}</dd>
          <dt className="text-muted-fg">Tugas aktif</dt><dd>{profil.jumlahTugasAktif} ({profil.jumlahTugasSelesai} selesai)</dd>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Tugas</h2>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-fg">
            <tr><th className="text-left p-1">ID</th><th className="text-left p-1">Judul</th><th className="text-left p-1">Prioritas</th><th className="text-left p-1">Status</th><th className="text-left p-1">Jatuh tempo</th></tr>
          </thead>
          <tbody>
            {profil.tugas.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-1">{t.id}</td><td className="p-1">{t.judul}</td>
                <td className={`p-1 text-${PRIO_TONE[t.prioritas]}`}>{t.prioritas}</td>
                <td className="p-1">{t.status}</td><td className="p-1">{t.jatuhTempo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Riwayat Jabatan</h2>
        <ul className="text-sm space-y-1">
          {profil.riwayatJabatan.map((r, i) => (
            <li key={i} className="flex justify-between">
              <span>{r.jabatan} — {r.departemen}</span>
              <span className="text-muted-fg">{r.tahun}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-bg p-4">
        <h2 className="text-sm font-semibold text-fg mb-2">Pelatihan</h2>
        <ul className="text-sm space-y-1">
          {profil.pelatihan.map((p, i) => (
            <li key={i} className="flex justify-between">
              <span>{p.nama} — {p.penyelenggara}</span>
              <span className="text-muted-fg">{p.tanggal} · {p.durasi}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export type _PegawaiRef = Pegawai;
```

- [ ] **Step 4: Implement `BerkasTab.tsx`, `KehadiranTab.tsx`, `AktivitasTab.tsx`**

```tsx
// apps/school/src/features/pegawai/BerkasTab.tsx
import type { Pegawai } from "../../data/pegawai";

export function BerkasTab({ pegawai }: { pegawai: Pegawai }) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Berkas</h2>
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr><th className="text-left p-1">Nama</th><th className="text-left p-1">Tipe</th><th className="text-left p-1">Ukuran</th><th className="text-left p-1">Diunggah</th></tr>
        </thead>
        <tbody>
          {pegawai.dokumen.map((d, i) => (
            <tr key={i} className="border-t border-border">
              <td className="p-1">{d.nama}</td><td className="p-1">{d.tipe}</td><td className="p-1">{d.ukuran}</td><td className="p-1">{d.diunggah}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

```tsx
// apps/school/src/features/pegawai/KehadiranTab.tsx
import type { Pegawai } from "../../data/pegawai";

export function KehadiranTab({ pegawai }: { pegawai: Pegawai }) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Kehadiran — {pegawai.persenKehadiran}%</h2>
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-fg">
          <tr><th className="text-left p-1">Tanggal</th><th className="text-left p-1">Status</th><th className="text-left p-1">Masuk</th><th className="text-left p-1">Pulang</th><th className="text-left p-1">Keterangan</th></tr>
        </thead>
        <tbody>
          {pegawai.kehadiran.map((k, i) => (
            <tr key={i} className="border-t border-border">
              <td className="p-1">{k.tanggal}</td><td className="p-1">{k.status}</td><td className="p-1">{k.jamMasuk ?? "—"}</td><td className="p-1">{k.jamPulang ?? "—"}</td><td className="p-1">{k.keterangan ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

```tsx
// apps/school/src/features/pegawai/AktivitasTab.tsx
import type { Pegawai } from "../../data/pegawai";

export function AktivitasTab({ pegawai }: { pegawai: Pegawai }) {
  return (
    <section className="rounded-lg border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-fg mb-2">Aktivitas Terbaru</h2>
      <ul className="space-y-2 text-sm">
        {pegawai.aktivitas.map((a, i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-1 inline-block h-2 w-2 rounded-full bg-${a.tone}`} />
            <div className="flex-1">
              <div className="text-fg">{a.aktor} <span className="text-muted-fg">{a.aksi}</span></div>
              <div className="text-xs text-muted-fg">{a.waktu}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @sekolahpro/school typecheck`
Expected: PASS (no errors related to features/pegawai).

- [ ] **Step 6: Commit**

```bash
git add apps/school/src/features/pegawai/
git commit -m "feat(school): pegawai tab components (profil, mengajar, staff, berkas, kehadiran, aktivitas)"
```

---

## Task 5: Build daftar columns + filter helpers

**Files:**
- Create: `apps/school/src/features/pegawai/daftarColumns.tsx`

- [ ] **Step 1: Implement column renderer + filter predicate**

```tsx
// apps/school/src/features/pegawai/daftarColumns.tsx
import type { Pegawai, RolePegawai, StatusPegawai } from "../../data/pegawai";
import { isGuru, isStaff, isDualRole } from "../../data/pegawai";
import { RoleBadges } from "./RoleBadges";

export type RoleFilter = "semua" | "guru" | "staff" | "dual";

export function matchesRoleFilter(p: Pegawai, filter: RoleFilter): boolean {
  if (filter === "semua") return true;
  if (filter === "guru") return isGuru(p) && !isDualRole(p);
  if (filter === "staff") return isStaff(p) && !isDualRole(p);
  return isDualRole(p);
}

export function matchesSearch(p: Pegawai, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return p.nip.toLowerCase().includes(q) || p.namaLengkap.toLowerCase().includes(q);
}

export function matchesStatus(p: Pegawai, status: StatusPegawai | "semua"): boolean {
  return status === "semua" || p.status === status;
}

export function summaryUtama(p: Pegawai): string {
  const dept = p.staff?.departemen;
  const mapel = p.guru?.mapelPengampu[0] ?? p.guru?.jenisPtk;
  if (dept && mapel) return `${mapel} · ${dept}`;
  return mapel ?? dept ?? "—";
}

export const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "guru", label: "Guru" },
  { value: "staff", label: "Staff" },
  { value: "dual", label: "Dual-role" },
];

// Re-export for daftar consumers.
export { RoleBadges };
export type { Pegawai, RolePegawai };
```

- [ ] **Step 2: Commit**

```bash
git add apps/school/src/features/pegawai/daftarColumns.tsx
git commit -m "feat(school): pegawai daftar filter helpers"
```

---

## Task 6: Replace `$sekolah.staff.tsx` layout + index

**Files:**
- Modify: `apps/school/src/routes/$sekolah.staff.tsx`
- Modify: `apps/school/src/routes/$sekolah.staff.index.tsx`

- [ ] **Step 1: Read existing `$sekolah.staff.tsx`** to confirm structure (it is a layout shell registering sub-routes).

Run: `cat apps/school/src/routes/\$sekolah.staff.tsx`

- [ ] **Step 2: Update layout — rename heading**

Open `apps/school/src/routes/$sekolah.staff.tsx`. Replace any heading text "Staff" with "Guru & Staff". Keep route shape and `<Outlet />` usage. If the layout file currently imports `data/staff`, replace with `data/pegawai`.

- [ ] **Step 3: Rewrite `$sekolah.staff.index.tsx` to a unified dashboard**

```tsx
// apps/school/src/routes/$sekolah.staff.index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { listPegawaiForSekolah, isGuru, isStaff, isDualRole } from "../data/pegawai";
import { scopedTo, scopedParams } from "../lib/scoped";

export const Route = createFileRoute("/$sekolah/staff/")({
  component: StaffIndex,
});

function StaffIndex() {
  const { sekolah } = Route.useParams();
  const list = listPegawaiForSekolah(sekolah);
  const totalGuru = list.filter(isGuru).length;
  const totalStaff = list.filter(isStaff).length;
  const dual = list.filter(isDualRole).length;
  const aktif = list.filter((p) => p.status === "Aktif").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Guru & Staff</h1>
          <p className="text-sm text-muted-fg">Ringkasan tenaga pendidik dan kependidikan sekolah.</p>
        </div>
        <Link
          to={scopedTo(sekolah, "/staff/daftar")}
          params={scopedParams(sekolah)}
          className="inline-flex items-center h-9 px-3 rounded-md bg-brand text-white text-sm hover:opacity-90"
        >
          Lihat Daftar
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Total" value={list.length} />
        <Card label="Guru" value={totalGuru} />
        <Card label="Staff" value={totalStaff} />
        <Card label="Dual-role" value={dual} />
        <Card label="Aktif" value={aktif} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <div className="text-xs text-muted-fg">{label}</div>
      <div className="text-2xl font-semibold text-fg">{value}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run dev server and visit `/<slug>/staff`**

Run: `pnpm --filter @sekolahpro/school dev`
Expected: route renders with 5 metric cards, no console errors.

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/routes/\$sekolah.staff.tsx apps/school/src/routes/\$sekolah.staff.index.tsx
git commit -m "feat(school): unified /staff index using pegawai entity"
```

---

## Task 7: Rewrite `$sekolah.staff.daftar.tsx`

**Files:**
- Modify: `apps/school/src/routes/$sekolah.staff.daftar.tsx`

- [ ] **Step 1: Write daftar page with filters**

```tsx
// apps/school/src/routes/$sekolah.staff.daftar.tsx
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@sekolahpro/ui";
import { listPegawaiForSekolah, type StatusPegawai } from "../data/pegawai";
import {
  ROLE_FILTERS, matchesRoleFilter, matchesSearch, matchesStatus, summaryUtama,
  type RoleFilter,
} from "../features/pegawai/daftarColumns";
import { RoleBadges } from "../features/pegawai/RoleBadges";
import { scopedTo, scopedParams } from "../lib/scoped";

const STATUS_OPTIONS: (StatusPegawai | "semua")[] = [
  "semua", "Aktif", "Cuti", "Non-aktif", "Pensiun", "Kontrak Berakhir",
];

export const Route = createFileRoute("/$sekolah/staff/daftar")({
  component: DaftarPegawai,
});

function DaftarPegawai() {
  const { sekolah } = Route.useParams();
  const [role, setRole] = useState<RoleFilter>("semua");
  const [status, setStatus] = useState<StatusPegawai | "semua">("semua");
  const [query, setQuery] = useState("");

  const all = useMemo(() => listPegawaiForSekolah(sekolah), [sekolah]);
  const filtered = useMemo(
    () => all.filter((p) =>
      matchesRoleFilter(p, role) && matchesStatus(p, status) && matchesSearch(p, query)
    ),
    [all, role, status, query],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setRole(f.value)}
            className={`h-8 px-3 rounded-md text-sm border ${role === f.value ? "border-brand bg-brand/10 text-brand" : "border-border text-fg hover:bg-muted"}`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusPegawai | "semua")}
          className="h-8 px-2 rounded-md border border-border text-sm bg-bg"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "semua" ? "Semua status" : s}</option>)}
        </select>
        <input
          type="search"
          placeholder="Cari nama atau NIP"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 px-2 rounded-md border border-border text-sm bg-bg flex-1 min-w-[180px]"
        />
        <span className="text-xs text-muted-fg ml-auto">{filtered.length} pegawai</span>
      </div>

      <div className="rounded-lg border border-border bg-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-fg bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2">NIP</th>
              <th className="text-left px-3 py-2">Nama</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Posisi / Mapel</th>
              <th className="text-left px-3 py-2">Kepegawaian</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.nip} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{p.nip}</td>
                <td className="px-3 py-2">
                  <Link
                    to={scopedTo(sekolah, `/staff/${p.nip}`)}
                    params={scopedParams(sekolah)}
                    className="text-brand hover:underline"
                  >
                    {p.namaLengkap}
                  </Link>
                </td>
                <td className="px-3 py-2"><RoleBadges roles={p.roles} /></td>
                <td className="px-3 py-2"><Badge tone={p.status === "Aktif" ? "success" : p.status === "Kontrak Berakhir" ? "danger" : "neutral"}>{p.status}</Badge></td>
                <td className="px-3 py-2">{summaryUtama(p)}</td>
                <td className="px-3 py-2">{p.statusKepegawaian}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-fg">Tidak ada pegawai sesuai filter.</div>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Open `/<slug>/staff/daftar`, exercise each filter chip + search**

Expected: counts update; guru/staff/dual filters mutually exclusive (sum equals total when status=semua, query empty).

- [ ] **Step 3: Commit**

```bash
git add apps/school/src/routes/\$sekolah.staff.daftar.tsx
git commit -m "feat(school): daftar pegawai with role + status + search filters"
```

---

## Task 8: Rewrite detail page `$sekolah.staff.$nip.tsx` with conditional tabs

**Files:**
- Modify: `apps/school/src/routes/$sekolah.staff.$nip.tsx`

- [ ] **Step 1: Implement tab-driven detail**

```tsx
// apps/school/src/routes/$sekolah.staff.$nip.tsx
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { findPegawai, isGuru, isStaff } from "../data/pegawai";
import { PegawaiHeader } from "../features/pegawai/PegawaiHeader";
import { ProfilTab } from "../features/pegawai/ProfilTab";
import { MengajarTab } from "../features/pegawai/MengajarTab";
import { StaffTab } from "../features/pegawai/StaffTab";
import { BerkasTab } from "../features/pegawai/BerkasTab";
import { KehadiranTab } from "../features/pegawai/KehadiranTab";
import { AktivitasTab } from "../features/pegawai/AktivitasTab";

type TabKey = "profil" | "mengajar" | "staff" | "berkas" | "kehadiran" | "aktivitas";

export const Route = createFileRoute("/$sekolah/staff/$nip")({
  component: PegawaiDetail,
});

function PegawaiDetail() {
  const { sekolah, nip } = Route.useParams();
  const pegawai = findPegawai(nip, sekolah);

  if (!pegawai) {
    return (
      <div className="rounded-lg border border-border bg-bg p-6 text-center">
        <h1 className="text-lg font-semibold text-fg">Pegawai tidak ditemukan</h1>
        <p className="text-sm text-muted-fg">NIP {nip} tidak terdaftar di sekolah ini.</p>
      </div>
    );
  }

  const guruActive = isGuru(pegawai);
  const staffActive = isStaff(pegawai);
  const tabs: { key: TabKey; label: string }[] = [
    { key: "profil", label: "Profil" },
    ...(guruActive ? [{ key: "mengajar" as const, label: "Mengajar" }] : []),
    ...(staffActive ? [{ key: "staff" as const, label: "Kepegawaian Staff" }] : []),
    { key: "berkas", label: "Berkas" },
    { key: "kehadiran", label: "Kehadiran" },
    { key: "aktivitas", label: "Aktivitas" },
  ];

  const initialTab: TabKey = guruActive ? "mengajar" : staffActive ? "staff" : "profil";
  const [active, setActive] = useState<TabKey>(initialTab);

  return (
    <div className="space-y-4">
      <PegawaiHeader pegawai={pegawai} />

      <div className="border-b border-border flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`px-3 py-2 text-sm border-b-2 ${active === t.key ? "border-brand text-brand" : "border-transparent text-muted-fg hover:text-fg"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "profil" ? <ProfilTab pegawai={pegawai} /> : null}
      {active === "mengajar" && pegawai.guru ? <MengajarTab profil={pegawai.guru} /> : null}
      {active === "staff" && pegawai.staff ? <StaffTab profil={pegawai.staff} /> : null}
      {active === "berkas" ? <BerkasTab pegawai={pegawai} /> : null}
      {active === "kehadiran" ? <KehadiranTab pegawai={pegawai} /> : null}
      {active === "aktivitas" ? <AktivitasTab pegawai={pegawai} /> : null}
    </div>
  );
}
```

- [ ] **Step 2: Manual smoke test — visit a guru-only, staff-only, and dual-role NIP**

Pick from `PEGAWAI_LIST`:
- guru-only: NIP from index 1, 2, 3 (skip dual indices 0,5,10,15).
- staff-only: any NIP from staff section.
- dual-role: NIP from index 0,5,10,15.

Expected: tab strip shows correct subset; default tab matches; switching renders without errors.

- [ ] **Step 3: Commit**

```bash
git add apps/school/src/routes/\$sekolah.staff.\$nip.tsx
git commit -m "feat(school): pegawai detail with role-conditional tabs"
```

---

## Task 9: Move guru-only sub-routes to /staff namespace

**Files:**
- Create: `apps/school/src/routes/$sekolah.staff.mapel-pengampu.tsx`
- Create: `apps/school/src/routes/$sekolah.staff.penugasan.tsx`
- Create: `apps/school/src/routes/$sekolah.staff.sk-mengajar.tsx`
- Modify: `apps/school/src/routes/$sekolah.staff.berkas.tsx`
- Modify: `apps/school/src/routes/$sekolah.staff.jabatan.tsx`
- Modify: `apps/school/src/routes/$sekolah.staff.sk-jabatan.tsx`

- [ ] **Step 1: For each new file, copy the corresponding `$sekolah.guru.<name>.tsx` body**

Sequence:
1. `cp apps/school/src/routes/\$sekolah.guru.mapel-pengampu.tsx apps/school/src/routes/\$sekolah.staff.mapel-pengampu.tsx`
2. `cp apps/school/src/routes/\$sekolah.guru.penugasan.tsx apps/school/src/routes/\$sekolah.staff.penugasan.tsx`
3. `cp apps/school/src/routes/\$sekolah.guru.sk-mengajar.tsx apps/school/src/routes/\$sekolah.staff.sk-mengajar.tsx`

- [ ] **Step 2: In each copy, replace route path string and import source**

Edits in each new file:
- `createFileRoute("/$sekolah/guru/<name>")` → `createFileRoute("/$sekolah/staff/<name>")`
- `import { GURU_LIST, ... } from "../data/guru"` → use `listPegawaiForSekolah` from `../data/pegawai`, then filter via `isGuru`. Example replacement:

```ts
import { listPegawaiForSekolah, isGuru } from "../data/pegawai";
// inside component:
const { sekolah } = Route.useParams();
const guruList = listPegawaiForSekolah(sekolah).filter(isGuru);
// adapt field access: row.mataPelajaran → row.guru!.mapelPengampu, etc.
```

Field mapping cheat-sheet (Guru → Pegawai):
- `g.namaLengkap` → `p.namaLengkap`
- `g.mataPelajaran` → `p.guru!.mapelPengampu`
- `g.jabatan` → `p.jabatanUtama`
- `g.jenisPtk` → `p.guru!.jenisPtk`

- [ ] **Step 3: Update `$sekolah.staff.berkas.tsx`, `.jabatan.tsx`, `.sk-jabatan.tsx` to consume `data/pegawai`**

Open each. Replace `STAFF_LIST` (or `GURU_LIST`) imports with `listPegawaiForSekolah(sekolah)`. The pages aggregate dokumen / jabatan / sk-jabatan across all pegawai — no role filter needed (berkas + jabatan apply to everyone).

- [ ] **Step 4: Manual smoke test — visit each `/staff/<name>` page**

Expected: tables render; no console errors; counts non-zero.

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/routes/\$sekolah.staff.*.tsx
git commit -m "feat(school): move mapel/penugasan/sk-mengajar under /staff, repoint berkas/jabatan to pegawai"
```

---

## Task 10: Update sidebar + role access map in `__root.tsx`

**Files:**
- Modify: `apps/school/src/routes/__root.tsx`

- [ ] **Step 1: Sidebar — drop separate Guru and Staff, replace with single "Guru & Staff"**

Locate `rawSections` (line ~431). In section "Utama" replace:

```tsx
mk("/guru", "Guru", <IconGrad />),
mk("/staff", "Staff", <IconId />),
```

With:

```tsx
mk("/staff", "Guru & Staff", <IconGrad />),
```

- [ ] **Step 2: Role access map — remove `/guru` entries, ensure `/staff` listed for everyone who previously had `/guru`**

In `ROLE_MENU_MAP` (line ~294):
- `kepala_sekolah`: remove `/guru` from array (keep `/staff`).
- `operator`: change `"/guru"` to `"/staff"` (no duplicate).

Final operator list:

```ts
operator: ["/", "/siswa", "/staff", "/kelas", "/jadwal", "/absensi", "/ppdb", "/pesan"],
```

- [ ] **Step 3: Update `GlobalSearch` placeholder**

Change `placeholder="Cari siswa, guru, kelas..."` → `placeholder="Cari siswa, pegawai, kelas..."` (line ~95). Also update fallback text at line ~107.

- [ ] **Step 4: Run app, confirm sidebar shows single "Guru & Staff" entry pointing to `/staff`**

Run: `pnpm --filter @sekolahpro/school dev`
Expected: clicking entry navigates to `/<slug>/staff` index; no separate Guru link.

- [ ] **Step 5: Commit**

```bash
git add apps/school/src/routes/__root.tsx
git commit -m "feat(school): merge Guru and Staff sidebar entries into single /staff link"
```

---

## Task 11: Repoint `global-search.ts` to `data/pegawai`

**Files:**
- Modify: `apps/school/src/lib/global-search.ts`

- [ ] **Step 1: Replace guru import + iteration**

Open `apps/school/src/lib/global-search.ts`.
- Replace `import { GURU_LIST } from "../data/guru";` with `import { PEGAWAI_LIST, isGuru, isStaff } from "../data/pegawai";`.
- Where `GURU_LIST` is iterated, iterate `PEGAWAI_LIST` instead. For each hit:
  - `id`: keep `"guru:" + p.nip` if `isGuru(p)`, additionally emit `"staff:" + p.nip` if `isStaff(p)` (so dual-role pegawai appear in both categories).
  - `href`: `/staff/${p.nip}` for both.
  - `category`: `"Guru"` if `isGuru(p)`, plus `"Staff"` entry if `isStaff(p)`.
- If `global-search.ts` also pulls from `data/staff`, remove that import + loop (now superseded by the unified PEGAWAI iteration).

- [ ] **Step 2: Type/test**

Run: `pnpm --filter @sekolahpro/school typecheck`
Expected: PASS.

Smoke: open app, ⌘K, search a known guru name and dual-role name.
Expected: both appear; dual-role yields two hits (Guru + Staff).

- [ ] **Step 3: Commit**

```bash
git add apps/school/src/lib/global-search.ts
git commit -m "feat(school): repoint global-search to PEGAWAI_LIST"
```

---

## Task 12: Repoint absensi.guru + delete old route/data files

**Files:**
- Modify: `apps/school/src/routes/$sekolah.absensi.guru.tsx` (and any other `data/guru` / `data/staff` importer surfaced by Step 1)
- Delete: all `$sekolah.guru.*.tsx`, `data/guru.ts`, `data/staff.ts`, `$sekolah.staff.$nip` legacy if any leftover

- [ ] **Step 1: Find remaining importers**

Run: `grep -rln "data/guru\|data/staff" apps/school/src/`
Expected: only `$sekolah.absensi.guru.tsx` (and any test file). If anything else surfaces, repoint it before deleting source files.

- [ ] **Step 2: Update `$sekolah.absensi.guru.tsx`**

Replace `import { ... } from "../data/guru";` with `listPegawaiForSekolah` + `isGuru` from `data/pegawai`. Map field accesses to Pegawai shape (see cheat-sheet in Task 9).

- [ ] **Step 3: Delete old guru routes + old data files**

```bash
rm apps/school/src/data/guru.ts
rm apps/school/src/data/staff.ts
rm apps/school/src/routes/\$sekolah.guru.tsx
rm apps/school/src/routes/\$sekolah.guru.index.tsx
rm apps/school/src/routes/\$sekolah.guru.daftar.tsx
rm apps/school/src/routes/\$sekolah.guru.berkas.tsx
rm apps/school/src/routes/\$sekolah.guru.jabatan.tsx
rm apps/school/src/routes/\$sekolah.guru.sk-jabatan.tsx
rm apps/school/src/routes/\$sekolah.guru.mapel-pengampu.tsx
rm apps/school/src/routes/\$sekolah.guru.penugasan.tsx
rm apps/school/src/routes/\$sekolah.guru.sk-mengajar.tsx
rm apps/school/src/routes/\$sekolah.guru.\$nip.tsx
```

- [ ] **Step 4: Typecheck + test + lint**

Run:
```bash
pnpm --filter @sekolahpro/school typecheck
pnpm --filter @sekolahpro/school test
pnpm --filter @sekolahpro/school lint
```
Expected: all PASS. Fix any straggler imports surfaced.

- [ ] **Step 5: Manual smoke — full happy path**

Start dev server and verify:
- Sidebar shows single "Guru & Staff" → `/staff` index.
- `/staff/daftar` filters and search work.
- `/staff/<NIP>` shows guru-only tabs, staff-only tabs, dual-role tabs.
- `/staff/mapel-pengampu`, `/staff/penugasan`, `/staff/sk-mengajar` render.
- `/staff/berkas`, `/staff/jabatan`, `/staff/sk-jabatan` render.
- `/absensi/guru` still works (now consumes pegawai filtered by isGuru).
- Global search returns guru + staff hits.
- Old `/guru/*` paths return 404 (router has no matching file route).

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "feat(school): remove legacy guru/staff modules, finalize pegawai merge"
```

---

## Task 13: Final cleanup pass

**Files:**
- Modify: any leftover

- [ ] **Step 1: Verify no dead imports**

Run: `grep -rn "GURU_LIST\|STAFF_LIST\|listGuruForSekolah\|listStaffForSekolah\|findGuru\|findStaff" apps/school/src/`
Expected: empty.

- [ ] **Step 2: Verify no `/guru` strings**

Run: `grep -rn "\"/guru\"\|'/guru'" apps/school/src/`
Expected: empty.

- [ ] **Step 3: Final test + lint pass**

Run:
```bash
pnpm --filter @sekolahpro/school typecheck
pnpm --filter @sekolahpro/school test
pnpm --filter @sekolahpro/school lint
```
Expected: PASS.

- [ ] **Step 4: Commit (only if changes)**

```bash
git add -u
git commit -m "chore(school): final cleanup post guru/staff merge"
```

---

## Spec Coverage Check

| Spec section | Task(s) |
| --- | --- |
| Data model `Pegawai` | 1, 2 |
| `roles[]` invariant + helpers | 1 |
| Status enum union | 1 |
| Routes flat under `/staff` | 6, 7, 8, 9 |
| Daftar role chips + filter | 5, 7 |
| Detail conditional tabs | 8 |
| Shared component extraction | 3, 4, 5 |
| Sidebar single entry | 10 |
| Role access map | 10 |
| External importers repointed | 11, 12 |
| Legacy deletion | 12 |
| Tests (fixture invariants) | 1, 2 |
