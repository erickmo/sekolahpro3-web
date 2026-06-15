# KEU-ADR-0002: Struktur Biaya — Model Component-Centric, Resolver Company=Sekolah, Generate via Doc Method

- Status: Accepted
- Tanggal: 2026-06-15
- Domain: Keuangan (FE: `apps/school`) + Accounting (BE: `vernon_accounting`)

## Konteks

Hub Keuangan sudah bisa membuat, membayar, dan memantau tagihan siswa (`School Fee Invoice`),
tetapi setiap invoice dibuat **manual, satu siswa per kali**. Tidak ada cara mendefinisikan
komponen biaya sekolah (SPP, Uang Pangkal, Seragam) sekali, memberi harga **per tingkat**,
lalu menerbitkan tagihan untuk satu kohort dalam satu aksi. Langkah onboarding "Konfigurasi SPP"
sebelumnya hanya stub menuju `/keuangan`.

Keputusan yang perlu dibuat:
1. Bentuk model data untuk struktur biaya (ritme campur Bulanan/Per Semester/Sekali, harga per tingkat).
2. Cara generator me-resolve siswa per tingkat, mengingat ada **dua sumbu scoping** berbeda
   (Rombel/Siswa di-scope `Sekolah`, School Fee Invoice di-scope `Company`).
3. Mekanisme memanggil generator dari FE tanpa menambah permukaan API baru
   (constraint pengguna: "kalau bisa lewat resource API, jangan bikin API baru").

## Keputusan

1. **Model component-centric** (bukan flat plan grid):
   - Doctype baru `School Fee Component` (per `company` + `tahun_ajaran`): `nama_komponen`,
     `ritme` (Bulanan|Per Semester|Sekali), `receivable_account`, `income_account`, `due_day`,
     `auto_generate`, `is_active`, + child `School Fee Component Rate` (`tingkat` → `nominal`).
   - "Struktur biaya" = kumpulan komponen aktif untuk company+TA. Generator fan-out per tingkat
     ke `School Fee Invoice` yang sudah ada (tidak ada doctype invoice baru).
   - Alasan: ternormalisasi (komponen → harga per tingkat = model mental admin), scheduler bersih,
     `School Fee Invoice` tak berubah selain 2 field jejak (`fee_component`, `periode`).
   - Ditolak: **flat plan grid** (1 doctype denormalized; ritme/akun berulang tiap baris tingkat,
     generator perlu dedupe baris) dan **config JSON di Settings** (melanggar Frappe native-first:
     tanpa native list/permission/report).

2. **Resolver Company = Sekolah (identitas)**:
   - Konvensi `Company.name == Sekolah.name` (lihat KEU-ADR-0001 + `lib/akuntansi-scope.ts`
     `useActiveCompany()` = `activeSekolah.name`). Generator memperlakukan `company` sebagai
     nama Sekolah langsung + guard `frappe.db.exists("Sekolah", company)`.
   - `tahun_ajaran` komponen = Link Tahun Ajaran (doc name), sama persis dengan
     `Rombongan Belajar.tahun_ajaran` → join by doc name, tanpa translasi. Invoice menyimpan
     `tahun_ajaran` (Data) dari field `nama` Tahun Ajaran (mis. "2026/2027").
   - Siswa per tingkat diresolusi via `Rombongan Belajar` (tingkat Int, status Aktif) →
     child `Anggota Rombel` (status Aktif) → `Siswa` (name = NIS, display `nama_lengkap`).

3. **Generate via whitelisted DOC METHOD, bukan endpoint baru**:
   - Generasi dipanggil FE lewat transport standar Frappe `run_doc_method` ke method
     `School Fee Component.generate_invoices(periode, dry_run)` — **tidak ada** `api.py` baru.
   - Logika inti `generate_for_component(comp, periode, dry_run)` dipakai dua pemanggil: doc method
     (manual, via FE) dan scheduler harian (`auto_generate=1`, ritme Bulanan, `due_day` = hari ini).
   - FE me-loop komponen aktif (`generateForComponent` via `runDocMethod`) lalu `mergeSummaries`
     (tanpa endpoint batch). CRUD komponen memakai resource API (`useResourceList` + doc create).
   - Idempoten: dedupe `(student, fee_component, periode, company)` → re-run/retry tak double-bill.
   - Alasan: selaras vernon-dev (Priority 1 controller/doc method > Priority 5 api.py) DAN
     constraint pengguna (pakai resource/standard API, jangan tambah API baru).

## Konsekuensi

### Positif
- Admin definisikan biaya sekali (per tingkat) → terbitkan tagihan satu kohort sekali klik,
  dengan pratinjau dry-run (jumlah siswa + total) sebelum konfirmasi.
- `School Fee Invoice`/`School Fee Payment` tak berubah perilaku; hanya 2 field jejak ditambah.
- Idempoten + scheduler opsional (`auto_generate`) tanpa OS cron (hooks `scheduler_events`).
- Tanpa endpoint HTTP baru → permukaan API minimal, izin mengikuti School Fee Invoice.

### Negatif
- Dua doctype baru + child (vs satu di flat grid).
  — *Mitigasi:* model ternormalisasi mengurangi error duplikasi data per tingkat.
- Generasi memanggil satu `run_doc_method` per komponen aktif (bukan satu batch).
  — *Mitigasi:* jumlah komponen per sekolah sedikit; FE fan-out paralel + `mergeSummaries`.
- Resolver identitas Company=Sekolah rapuh jika konvensi penamaan dilanggar.
  — *Mitigasi:* guard `frappe.db.exists("Sekolah", company)`; sama dengan pola modul akuntansi lain.

### Trade-off ditunda (YAGNI)
- Diskon/beasiswa per siswa (potongan saat generate) → ditunda; rencana doctype `School Fee Adjustment`.
- Proration untuk pendaftaran tengah periode → ditunda.
- Tampilan & bayar biaya untuk wali/siswa (portal) → fitur terpisah ke depan.
- Form create/edit komponen kaya di FE → sekarang halaman list + generate; CRUD via desk/resource.

## Referensi
- Spec: `docs/superpowers/specs/2026-06-15-keuangan-struktur-biaya-design.md`
- Plan: `docs/superpowers/plans/2026-06-15-keuangan-struktur-biaya.md`
- FE: `apps/school/src/data/fee-structure.ts` (+`-live.ts`), `routes/sch.$sekolah.keuangan.biaya.tsx`,
  `components/keuangan/GenerateTagihanModal.tsx`, wiring `lib/keuanganHub.ts` + `data/onboarding.ts`
- BE: `vernon_accounting/accounting/doctype/school_fee_component` (+`_rate`),
  `accounting/api/fee_period.py` / `fee_generation.py` / `fee_scheduler.py`
- Konvensi scoping: [KEU-ADR-0001](KEU-ADR-0001-hub-terpadu.md), `lib/akuntansi-scope.ts`
