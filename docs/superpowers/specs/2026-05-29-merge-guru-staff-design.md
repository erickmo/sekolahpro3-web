# Merge Guru & Staff Menu — Design

**Date:** 2026-05-29
**Status:** Approved (pending spec review)
**Scope:** `apps/school`

## Problem

`Guru` and `Staff` are two top-level menus with heavily overlapping sub-routes (`daftar`, `berkas`, `jabatan`, `sk-jabatan`, detail `$nip`). Some personnel hold dual roles (a guru who also serves as TU coordinator). Maintaining two parallel modules duplicates fixtures, route files, and UI components, and makes dual-role records awkward to represent.

## Goals

- Single menu "Guru & Staff" with a unified list.
- Detail page adapts tabs based on the person's active roles.
- One canonical data entity `Pegawai` with `roles: ("guru" | "staff")[]`.
- Remove duplicate route files and fixtures.

## Non-goals

- No backend integration in this pass — still mock fixtures.
- No change to absensi/jadwal modules beyond updating their references to `Pegawai`.
- No UI redesign of profile cards beyond the tab restructure.

## Decisions

| Topic | Decision |
| --- | --- |
| Menu label | `Guru & Staff` |
| Base route | `/staff` (replaces `/guru` and existing `/staff`) |
| Data model | Single `Pegawai` entity with `roles[]` |
| Detail layout | Tabs per role, conditional on `roles` |
| Sub-routes | Flat, no role namespace |
| Status enum | Union: `Aktif | Cuti | Non-aktif | Pensiun | Kontrak Berakhir` |
| Old `/guru/*` routes | Hard delete, no redirect |

## Data Model

`apps/school/src/data/pegawai.ts` replaces `guru.ts` and `staff.ts`.

```ts
export type RolePegawai = "guru" | "staff";

export type StatusPegawai =
  | "Aktif"
  | "Cuti"
  | "Non-aktif"
  | "Pensiun"
  | "Kontrak Berakhir";

export type StatusKepegawaian =
  | "PNS" | "PPPK" | "GTY" | "GTT" | "Tetap Yayasan" | "Kontrak" | "Honorer";

export interface PegawaiProfilGuru {
  jenisPtk: JenisPtk;
  mapelPengampu: string[];
  jadwalMengajar: JadwalMengajarRow[];
  kelasAmpu: KelasAmpuRow[];
  riwayatMengajar: RiwayatMengajarRow[];
  sertifikasi: SertifikasiRow[];
  skMengajar: SkMengajarRow[];
}

export interface PegawaiProfilStaff {
  departemen: Departemen;
  jabatan: string;
  tugas: TugasRow[];
  riwayatJabatan: RiwayatJabatanRow[];
  pelatihan: PelatihanRow[];
}

export interface Pegawai {
  nip: string;
  nama: string;
  roles: RolePegawai[];          // length 1 or 2
  status: StatusPegawai;
  jenisKelamin: JenisKelamin;
  agama: Agama;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  telepon: string;
  email: string;
  statusKepegawaian: StatusKepegawaian;
  tanggalMulai: string;
  foto?: string;
  guru?: PegawaiProfilGuru;       // present iff roles.includes("guru")
  staff?: PegawaiProfilStaff;     // present iff roles.includes("staff")
  berkas: DokumenRow[];
  kehadiran: KehadiranRow[];
  aktivitas: AktivitasRow[];
  schoolSlug: MockSchoolSlug;
}
```

Invariant (enforced at fixture build + accessor helpers): `roles.includes("guru") === (guru !== undefined)`, same for staff.

Helpers:
- `getPegawaiList(slug, filter?)` — filter by role / status / search.
- `getPegawaiByNip(slug, nip)`.
- `isGuru(p) / isStaff(p) / isDualRole(p)`.

Fixtures: merge existing guru.ts + staff.ts records, dedupe by NIP. Pick at least 2 dual-role exemplars to exercise tabs.

## Routes

Replace `$sekolah.guru.*` and `$sekolah.staff.*` with:

```
$sekolah.staff.tsx              (layout)
$sekolah.staff.index.tsx        (dashboard summary)
$sekolah.staff.daftar.tsx       (filterable list)
$sekolah.staff.berkas.tsx
$sekolah.staff.jabatan.tsx
$sekolah.staff.sk-jabatan.tsx
$sekolah.staff.mapel-pengampu.tsx     (guru-scoped data, page itself filters)
$sekolah.staff.penugasan.tsx          (guru-scoped data)
$sekolah.staff.sk-mengajar.tsx        (guru-scoped data)
$sekolah.staff.$nip.tsx               (detail with conditional tabs)
```

Routes that consume guru-only data (`mapel-pengampu`, `penugasan`, `sk-mengajar`) filter list to `roles.includes("guru")` internally — kept under `/staff/*` for menu simplicity.

Delete old `$sekolah.guru.*.tsx` and `$sekolah.staff.*.tsx` siblings except the new files above. No redirect.

Sidebar (`__root.tsx`): drop separate `Guru` and `Staff` items, insert single `Guru & Staff` → `/staff`, reuse `IconGrad`.

Role-based access list in `__root.tsx`:
- `operator.guru` → replaced by `staff` everywhere.
- `guru: ["/", "/siswa", "/kelas", "/akademik", "/jadwal", "/absensi", "/pesan"]` unchanged (guru role doesn't browse personnel module).
- `operator: [..., "/staff", ...]` (drop `/guru`).

## Daftar Page

Filter bar:
- Role chips: `Semua | Guru | Staff | Dual-role`
- Status dropdown: all `StatusPegawai` values.
- Search: NIP or nama.

Columns: `NIP | Nama | Role badges | Status | Departemen / Mapel utama | Status Kepegawaian | Aksi`.
- Role badges: render `Guru` chip, `Staff` chip, both for dual.
- "Departemen / Mapel utama": for staff-only show departemen; for guru-only show first mapel or `jenisPtk`; for dual, show `{mapel utama} · {departemen}`.

## Detail Page (`$nip`)

Header card: foto, nama, NIP, status, role badges.

Tabs (in order, render only if condition true):
1. `Profil` — always.
2. `Mengajar` — `roles.includes("guru")`.
   - Sections: Mapel Pengampu, Jadwal, Kelas Ampu, Riwayat Mengajar, Sertifikasi, SK Mengajar.
3. `Kepegawaian Staff` — `roles.includes("staff")`.
   - Sections: Departemen & Jabatan, Tugas, Riwayat Jabatan, Pelatihan.
4. `Berkas` — always.
5. `Kehadiran` — always.
6. `Aktivitas` — always.

Default active tab: `Mengajar` if guru, else `Kepegawaian Staff`, else `Profil`.

## Component Reuse

Existing components from `$sekolah.guru.$nip.tsx` and `$sekolah.staff.$nip.tsx` (cards, tables) extracted into:

```
apps/school/src/features/pegawai/
  PegawaiHeader.tsx
  ProfilTab.tsx
  MengajarTab.tsx       (was guru detail sections)
  StaffTab.tsx          (was staff detail sections)
  BerkasTab.tsx
  KehadiranTab.tsx
  AktivitasTab.tsx
  RoleBadges.tsx
  daftarColumns.tsx
```

Keep individual section components small (< 200 lines each) to honor file-size rule from CLAUDE.md.

## Error Handling / Edge Cases

- `getPegawaiByNip` returns `undefined` → route renders 404 panel (reuse existing pattern).
- `roles` empty → treat as data bug; daftar excludes; detail page shows banner "Tidak ada role aktif".
- Cross-references in other modules (`absensi.guru`, `jadwal`, `akademik`) currently import from `data/guru.ts` — re-point to `data/pegawai.ts` with `roles.includes("guru")` filter via helper `getGuruList(slug)`.

## Testing

- Update existing route tests that target `/guru/*` paths.
- Add fixture invariant test: every `Pegawai` has `roles.length >= 1` and role-profile presence matches roles array.
- Snapshot daftar with each filter chip.
- Detail page renders correct tab set for guru-only, staff-only, dual-role exemplars.

## Migration Steps

1. Create `data/pegawai.ts` with merged types + fixtures, dedupe by NIP.
2. Add helpers `getPegawaiList`, `getPegawaiByNip`, `getGuruList`, `getStaffList`.
3. Extract shared section components into `features/pegawai/`.
4. Build new `$sekolah.staff.*` route set (overwriting current staff files).
5. Delete `$sekolah.guru.*` route files.
6. Update `__root.tsx` sidebar + role access map.
7. Repoint external importers (`absensi`, `jadwal`, `akademik`) from `data/guru.ts` / `data/staff.ts` to `data/pegawai.ts` helpers.
8. Delete `data/guru.ts` and `data/staff.ts`.
9. Run typecheck + tests + lint, fix fallout.

## Out of Scope / Follow-ups

- Backend `Pegawai` doctype consolidation (separate ticket).
- Bulk import format for dual-role records.
- Permission matrix beyond current operator/guru roles.
