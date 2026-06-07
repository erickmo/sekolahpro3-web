# Plan — Beranda Dashboard Role-Adaptive (Design Tournament)

> Hasil design tournament 2026-06-07. **Winner: C4 "Reimagine" — Antrean Saya (role-as-mode work-inbox).**
> Lingkup terkunci: panel DI DALAM rute Beranda tunggal (`sch.$sekolah.index.tsx`) — tanpa sub-rute baru, tanpa migrasi URL.
> POV: 5 role panel juri (Kepala Sekolah, TU/Operator, Guru, Wali Kelas, Bendahara).
> Status: **proposal** — belum di-implement. Jalankan `"implement plan"` / `"full cycle"` setelah pertanyaan terbuka dijawab.

## Bracket result

```
C1 Simplest   C2 Power      C3 Native     C4 Reimagine
   \            /              \            /
   SF-A: C1 199 > C2 172      SF-B: C4 203 > C3 194
        \                          /
         \                        /
          FINAL: C4 204 > C1 193  →  WINNER C4
```

| Match | A | B | Skor A | Skor B | Lolos |
|---|---|---|---|---|---|
| SF-A | C1 Simplest-path | C2 Power-user | **199** | 172 | C1 |
| SF-B | C3 Native-first | C4 Reimagine | 194 | **203** | C4 |
| FINAL | C1 Simplest-path | C4 Reimagine | 193 | **204** | **C4** |

### Heatmap juri per-role (weighted_total, max 45/desain)

| Role | SF-A C1 / C2 | SF-B C3 / C4 | FINAL C1 / C4 | Pilihan final |
|---|---|---|---|---|
| kepala_sekolah | **43** / 30 | **41** / 36 | 40 / **42** | C4 |
| tu_operator | 38 / 38* | 36 / **43** | 36 / **41** | C4 |
| guru | **41** / 33 | 39 / **42** | 39 / **42** | C4 |
| wali_kelas | **43** / 31 | 36 / **43** | 38 / 37 | C4 (nyaris seri — skor mentah condong C1) |
| bendahara | 34 / **40** | **42** / 39 | 40 / **42** | C4 |

\*tie-break ke C2 oleh juri tu_operator di SF-A. **Catatan:** C4 menang final 4-dari-5 by score; wali_kelas marginal favor C1 (38 vs 37) → kekhawatiran double-surface dialamatkan di Pertanyaan terbuka #2.

---

## POV brief

- **kepala_sekolah** — memutuskan: tunjuk wali kelas, tinjau SK habis, eskalasi disiplin, sikapi tunggakan besar. JTBD: "apa yang harus SAYA putuskan hari ini?"
- **tu_operator** — memproses antrean operasional bervolume tinggi (absensi guru, pembayaran, berkas, PPDB, pesan wali) secepat mungkin ke formulirnya. JTBD: "apa tugas berikutnya yang harus saya kerjakan?"
- **guru** — mencatat: absensi kelas yang saya ampu + nilai pending, di sela antar-jam. JTBD: "kelas apa berikutnya dan apa yang belum saya catat?"
- **wali_kelas** — menggembalakan 1 rombel: tindak lanjut alpa/nunggak/flag BK + hubungi wali murid. JTBD: "anak saya mana yang perlu saya tangani?"
- **bendahara** — rekonsiliasi kas: tagihan jatuh tempo, verifikasi pembayaran, tutup kas, approval pengeluaran. JTBD: "uang apa yang harus saya tagih/verifikasi/tutup hari ini?"

## Arsitektur menang

**Konsep — C4 "Antrean Saya" (role-as-mode work-inbox).** Beranda berhenti jadi papan-pengumuman dan jadi **kokpit triase**. Hero tunggal = `Antrean Saya`: daftar verb-first ter-rank urgensi, tiap baris satu-tap deep-link ke formulir yang menyelesaikannya, dengan progress ("3 dari 9 beres") dan dismiss/snooze. **Peran sesi MENGGANTIKAN switch `FOCUS_BY_MODE` jam-dinding** — peran menentukan urutan DAN semesta item; jam-dinding turun jadi re-ranker lembut saja (pagi mengapungkan absensi). KPI wall lama turun pangkat jadi **strip Konteks** tipis yang bisa dilipat, hanya untuk peran oversight (kepala/bendahara) yang memang bertindak atas agregat. Komponen yang sama melayani 5 peran — hanya feed-nya yang berganti.

**Mengapa menang (sinyal juri):**
- **kepala_sekolah** (SF-B): hero tunggal `Antrean Saya` adalah permukaan triase yang lebih fokus dari tumpukan StatStrip+DecisionQueue+Tren — "satu daftar ter-rank untuk momen sempit 'apa yang harus saya putuskan SEKARANG'", plus dismiss/snooze yang dibutuhkan principal ("sudah saya tunjuk wali kelas, hilangkan dari antrean").
- **tu_operator** (FINAL): paling cocok untuk operator harian bervolume tinggi — sasaran eksplisit fitur ini.
- **guru** (SF-A): inbox memberi fokus pada satu aksi terpenting (catat absensi/nilai) tanpa noise sekolah-luas.
- **wali_kelas** (SF-A/B): inbox + Sinyal yang di-scope ke 1 rombel = mode gembala yang ketat.
- **bendahara** (SF-B): satu inbox ter-rank dengan progress menurunkan beban kognitif saat "menggiling pending-verify + jatuh tempo + tutup kas".

**Kunci selaras-kodebase:** menghormati kontrak *emphasis-not-visibility* (peran me-reorder/scope, tidak men-gate), dan mendaur pola yang sudah rilis (`keuanganWorkQueue` cockpit PR #64, `keuanganCalendar` Deadline strip, `deriveRoles`). Bukan baru — familiar.

## Spec panel per-role

Urutan render top→bottom. Setiap baris inbox = label verb-first + meta (jumlah/Rp) + dot severity + deep-link `to`.

| Peran | Strip Konteks (KPI) | HERO: Antrean Saya (aksi pertama) | Panel pendamping | Tren |
|---|---|---|---|---|
| **kepala_sekolah** | **Expanded** 1-baris: kehadiran 96%, total siswa, tunggakan total, coverage SK/wali | **"Keputusan Anda hari ini"** (4-6 item keputusan): "3 rombel tanpa wali → Tunjuk" → master/rombel; "6 SK habis 30 hari → Tinjau" → staff; "Tunggakan > Rp X (18 siswa) → Lihat" → keuangan; "Eskalasi disiplin (2) → Tindak". **Aksi pertama: tunjuk wali kelas.** | **Sinyal** (AttentionList sekolah-luas: coverage + arrears + rombel-tanpa-wali) + **Hari Saya** (Agenda Sekolah read-only) | LineChart kehadiran 7 hari + GaugeChart arrears |
| **tu_operator** | **Collapsed → 1 chip** ("Antrean hari ini: 29") | **Antrean Saya** worklist penuh: "Guru belum input absensi (2)"; "Pembayaran menunggu proses (8)"; "Berkas siswa belum lengkap (12)"; "PPDB perlu verifikasi (4)"; "Pesan wali belum dibalas (3)". ProgressRing burn-down. **+ AksiCepat grid** (grafted C3, lihat §Ide cangkok). **Aksi pertama: proses item teratas.** | Hari Saya: SLA cutoff operasional hari ini | Tidak ada (layar lean) |
| **guru** | **Hidden** (eyebrow "kelas berikutnya" saja) | **Hari Saya** strip: slot berikutnya + ruang + kelas, dengan **CTA "Input Absensi" menempel di slot itu** (grafted C2). Lalu **"Yang harus saya catat"**: "Absensi 10-IPA-2 belum diinput"; "Nilai UH Matematika pending (28)"; "Status izin/pengganti"; "Pesan wali tentang murid saya (1)". **Aksi pertama: dari slot → input absensi (1 tap).** | Tidak ada Sinyal, tidak ada chart (mobile-first) | Hidden |
| **wali_kelas** | **Hidden** | Strip mengajar guru + **"Yang harus saya catat"** (sama guru) | **Sinyal scope-rombel** (30 anak saya): "Alpa hari ini (2) → tindak lanjut"; "Nunggak SPP (3)"; "Flag BK/disiplin (1)"; "Data tak lengkap (4)" — dengan **multi-select + "Pesan Wali Murid" batch** (grafted C2). + CTA hubungi wali. | Sparkline kehadiran rombel saya |
| **bendahara** | **Expanded** numbers-dense: posisi kas, collected-today, tunggakan aging total | **Antrean Saya** = collection/verify queue (satu pane, bukan dua): "Tagihan jatuh tempo hari ini (Rp X)"; "Pembayaran menunggu verifikasi (8)"; "Tutup kas hari ini → belum"; "Approval pengeluaran (2)"; "Pembayaran PPDB masuk (4)". ProgressRing. Deep-link ke hub Alur Uang. **Aksi pertama: verifikasi pembayaran teratas.** | Hari Saya: tenggat uang via `keuanganCalendar` Deadline severity strip | Sparkline collections + StackedBar arrears-aging |

**Aturan global:** kepala & wali_kelas tidak boleh men-double-surface anak yang sama di Antrean + Sinyal (lihat Pertanyaan terbuka #2). Empty-state positif: "Antrean bersih — tidak ada yang menunggu Anda." Strip `Hari Saya` selalu-on supaya layar tak pernah kosong di hari sepi.

## Ide cangkok (grafted)

- **dari C1 (Simplest-path):** **hard subtraction sebagai disiplin default per peran** — guru/wali_kelas TIDAK fetch finance sekolah-luas, kepala TIDAK pernah lihat to-do transaksional. `berandaLayout` membatasi jumlah panel per peran (kepala ≤ hero+sinyal+tren; guru = hero saja) agar janji "scan 30 detik" terjaga. Juga: cangkok **enrolment-delta + SK-coverage-gap sebagai sinyal first-class** ke layer KPI/keputusan kepala (sinyal juri SF-A kepala).
- **dari C2 (Power-user):** **(a) CTA absensi menempel di slot Hari Saya guru** (edge-win guru SF-A: slot→record 1 tap, bukan cari item absensi terpisah). **(b) multi-select + bulk "Pesan Wali Murid / Buka semua" di Sinyal wali_kelas** (edge-win wali SF-A: batch-contact semua yang alpa hari ini). Bulk = deep-link/open saja (read-only), **bukan** mutasi — true bulk-post tetap deferred (sejalan keputusan Alur Uang).
- **dari C3 (Native-first):** **(a) AksiCepat grid eksplisit untuk tu_operator** (Tambah Siswa / Catat Pembayaran / Verifikasi PPDB / Input Absensi) — menutup edge PROAKTIF: walk-in parent / cash ad-hoc yang tak punya baris antrean untuk di-deep-link (sinyal juri SF-B tu_operator). **(b) config-driven panel registry** (`BERANDA_LAYOUT[primary]` → array panel-keys) sebagai mekanisme implementasi role-scoping, bukan 5 cabang if hand-written. **(c) graceful empty-state** untuk doctype yang belum punya agregat bersih (Pesan/BK flag) — render "tidak ada", jangan fabrikasi.

## Data & reuse

**Native-first Frappe:** Route memuat baris via `useResourceList`/`frappeFetch` (REST, **NO** `frappe.db` bypass) → aggregator murni → View. Tiap peran hanya fetch baris yang panelnya benar-benar dirender (guru tak fetch finance).

**Doctype & agregat (status terverifikasi 2026-06-07 — 7/8 clean, 1 absent):**
- ✅ **Absensi Harian** — fields `rombel`/`tanggal`/`dibuat_oleh`/`sumber_input`/`detail[]` (⚠️ **TANPA `guru`**). "Harian missing today" = scope by **rombel** (wali_kelas: rombel saya); item actionable bila record absent ATAU `detail[]` kosong (half-saved).
- ✅ **Absensi Pelajaran** — punya `guru` (Pegawai) + `rombel`/`tanggal`/`mata_pelajaran`/`detail[]`. "Pelajaran missing today" = scope by **guru** (butuh hop user→Pegawai).
- ✅ **Slot Jadwal** (istable child Jadwal Pelajaran) — `guru` (Link Pegawai), `hari` (**Select NAMA HARI**: Senin/Selasa/Rabu/Kamis/Jumat/Sabtu — **TANPA Minggu**). `useTodayMySlots`: map `Date`(WIB)→nama hari → filter `hari==<nama>` AND parent `Jadwal Pelajaran.is_aktif==1` + TA/semester aktif. **Minggu → empty-state** "tidak ada jadwal hari ini".
- ✅ **School Fee Invoice + Payment** (vernon_accounting; bukan "Tagihan") — `due_date`, `status` (Belum Dibayar/Sebagian/Lunas), `jumlah`/`dibayar`; aging = today−due_date. Pakai `useTagihanLive`/`usePembayaranLive`.
- ✅ **Rombongan Belajar** — `wali_kelas` (Link **ke User**, nullable) → rombel-tanpa-wali = `wali_kelas IS NULL` (kepala); wali_kelas scope = `wali_kelas == session.user` LANGSUNG (no Pegawai hop).
- ✅ **SK Mengajar** (bukan field Pegawai) — `status_validitas` (Aktif/Akan Berakhir/Berakhir; scheduler-synced H-30) + `tanggal_berakhir` → SK habis = `status_validitas="Akan Berakhir"` (kepala Sinyal). No manual date math.
- ⏭️ **Entri Nilai** — TANPA field `status`/`pending`/`guru` (fields: siswa/mata_pelajaran/semester/komponen[]/nilai_akhir). "Nilai pending" butuh aggregate user→Pegawai→SK Mengajar→expected(siswa×mapel) minus existing → **DESCOPE ke v2**, jangan ship sebagai count sederhana.
- ✅ **Agenda Sekolah** — `tanggal_mulai`/`status` (Terbit) → agenda hari ini = `status="Terbit" AND date(tanggal_mulai)=today` (kepala Hari Saya).
- ✅ **PPDB Pendaftaran/Pembayaran** — pending-verify counts (tu_operator/bendahara).
- ✅ **Contact Inbox SekolahPro** (Pesan) — `status` (Baru/Dibalas/Selesai) → belum dibalas = `status≠"Selesai"`.
- ✅ **Pengganti Guru** (izin/substitute — doctype ADA) — `status` (Belum Ditugaskan/Ditugaskan/Selesai), `guru_asli`, `tanggal` → pending = `status="Belum Ditugaskan"` (strip izin/pengganti guru).
- ❌ **BK/Disiplin** — TIDAK ADA doctype. Panel "flag BK/disiplin" (wali_kelas Sinyal) **DROP dari v1** atau render empty-state; jangan fabrikasi.

**Reuse komponen `@sekolahpro/ui`:** `DashboardTemplate`, `PageHeader`, `SectionCard`, `StatCard` (turun pangkat), `AttentionList` (Sinyal), `Badge`, `Avatar`, `Button`, `OnboardingChecklist` (dipertahankan).
✅ **TERVERIFIKASI:** `ProgressRing` ADA di `components/viz/charts.tsx:254` (BUKAN `@sekolahpro/ui`). "inbox progress ring" = `viz.ProgressRing` + `inboxProgress` (`keuanganWorkQueue.ts:184`).

**Reuse `components/viz`** (ganti `AttendanceChart` hand-rolled): `Sparkline`, `LineChart`, `GaugeChart`, `StackedBarChart`, `DonutChart`, `BarChart`, `ProgressRing`, `FunnelChart`.

**Reuse lib (SEMUA terverifikasi ada 2026-06-07):** `lib/sessionRole.ts:91` (`deriveRoles`), `:21` (`DeriveRoleConfig`), `:15` (`RoleMatcher`), `:73` (`pickPrimary`) — role dari `packages/auth` SessionStore via `get_roles` RPC + `useSession()`; `keuanganWorkQueue.ts:172/184` (`buildWorkQueue`/`inboxProgress`, `WorkItem`={id,type,label,amount,ageDays,dueLabel,severity,to}), `keuanganCalendar.ts:101/18` (`computeDeadlines`/`Deadline`={id,title,dueDate,daysLeft,severity,to}), `data/keuangan-live.ts:169/250` (`useTagihanLive`/`usePembayaranLive`, `LiveListResult<T>`), `orang/siswaStats.ts:131` (`deriveActionQueue`→AttentionItem[]), `orang/staffStats.ts:153/101` (`deriveStaffActionQueue`→AttentionItem[] + `sertifikasiCoverage`), `ppdbQueue.ts:175` (`buildWorkQueue`). CATATAN: tidak ada `buildAttention` generik — tiap domain punya `deriveActionQueue` sendiri; `berandaSignals` ikut pola itu.

**Lib aggregator BARU (murni, unit-testable, no React, no frappe.db):**
1. **`lib/berandaRole.ts`** — `BerandaRole = "kepala_sekolah"|"tu_operator"|"guru"|"wali_kelas"|"bendahara"`; `DeriveRoleConfig<BerandaRole>` di atas engine `deriveRoles`; matchers di-crib dari `keuanganRole.ts`/`akademikRole.ts`. Clone tipis `keuanganRole.ts`.
2. **`lib/berandaInbox.ts`** — `buildInbox(rows, role, today) → WorkItem[]` (id/type/label/meta/severity/to/dismissible); rank by severity→amount/age; `floatRolePreferred(items, role)` re-order + scope semesta item per bucket. Mirror `keuanganWorkQueue.ts`.
3. **`lib/berandaLayout.ts`** — `BERANDA_LAYOUT: Record<BerandaRole, PanelKey[]>` + flag konteks-expanded/collapsed/hidden (registry C3). Murni.
4. **`lib/berandaSignals.ts`** — agregator Sinyal cross-module (kepala sekolah-luas; wali_kelas scope-rombel) → `AttentionItem[]`, daur `siswaStats`/`staffStats` builders.

## File yang tersentuh

| File | Aksi | Size (Vernon) |
|---|---|---|
| `src/lib/berandaRole.ts` (+`.test.ts`) | NEW — clone `keuanganRole.ts` | **S** |
| `src/lib/berandaInbox.ts` (+`.test.ts`) | NEW — clone `keuanganWorkQueue.ts`, ranking+floatRolePreferred+scope | **M** |
| `src/lib/berandaLayout.ts` (+`.test.ts`) | NEW — panel registry per peran | **S** |
| `src/lib/berandaSignals.ts` (+`.test.ts`) | NEW — Sinyal cross-module (daur siswaStats/staffStats) | **M** |
| `src/lib/beranda/scope.ts` (+`.test.ts`) | NEW (risiko utama, de-risked) — `useMyPegawai()` (filter Pegawai `{user: session.user}`), `useMyRombels()` (filter Rombongan Belajar `wali_kelas==session.user`), `useTodayMySlots()` (user→Pegawai→Slot Jadwal `guru`); FE helper ABSENT, BE pola ada di `sekolahpro/api/mobile/v1/schedule.py:14`. Filter `session.user`, low-risk | **M** |
| `src/routes/sch.$sekolah.index.tsx` | REWRITE — Route loads rows (useResourceList paralel, role-scoped) → aggregator → View; hapus `FOCUS_BY_MODE`/mock KPI/`AttendanceChart`; render panel via registry; dismiss/snooze localStorage | **L** |
| `src/components/beranda/AntreanSaya.tsx` | NEW — hero inbox (baris + viz `ProgressRing` + dismiss) | **M** |
| `src/components/beranda/StripKonteks.tsx` | NEW — StatCard collapsible per peran | **S** |
| `src/components/beranda/HariSaya.tsx` | NEW — strip my-day (slot/deadline per peran) | **S** |
| `src/components/beranda/AksiCepat.tsx` | NEW — quick-action grid (tu_operator, grafted C3) | **S** |

**Verify inline** (sesuai redesign sibling): `pnpm tsc` 0 / `pnpm lint` 0 / `pnpm vitest` hijau (4 lib test baru) / `pnpm build` ok. Hooks `useResourceList` HARUS di atas session guard di route (learning `useKoperasiMode-hook-above-guards`). `pnpm generate` (routeTree.gen) sebelum tsc. Total estimasi: **L** (1 route rewrite besar + 4 lib + 4 komponen, semua pola sibling terbukti).

## Keputusan (resolved 2026-06-07 via investigasi kode)

1. ✅ **Dismiss/snooze persistence** → **v1 localStorage** (pola `ONBOARDING_DISMISS_KEY`). App tak punya backend read-state doctype; cockpit keuangan pun tak persist dismiss. Backend "Beranda Dismissal" doctype = defer.
2. ✅ **Double-surface guard** → ATURAN DITERAPKAN: jika exception sudah jadi baris Antrean Saya, **exclude dari Sinyal** (dedup by entity id). Cegah anak/SK yang sama muncul 2×.
3. ✅ **Resolusi user→guru/rombel/slot** (risiko utama) → FE helper **ABSENT, harus dibangun** = `lib/beranda/scope.ts` (3 hook). Field + BE pola ADA: `Pegawai.user` (unique), `Rombongan Belajar.wali_kelas` (Link **ke User** → filter langsung), `Slot Jadwal.guru` (Link Pegawai); BE ref `sekolahpro/api/mobile/v1/schedule.py:14` (`_resolve_guru_for_user`). Low-risk (filter `session.user`), masuk scope (lihat file table).
4. ✅ **Role-switcher chip** → MASUK v1. Clone `KeuanganRoleChips` (`components/keuangan/KeuanganRoleChips.tsx:19`) + `pickPrimaryRole` (`keuanganRole.ts:126`, priority+fallback). Hint presentasi, bukan gate permission.
5. ✅ **Threshold "tunggakan besar"** → named constant di `berandaInbox.ts` (konsisten `keuanganWorkQueue.ts:48-50` `RED_WITHIN_DAYS=3`/`DUE_SOON_WITHIN_DAYS=7`). Tak ada Pengaturan Keuangan singleton; config-driven = defer.
6. ✅ **Agregat** → 7/8 EXISTS-clean (Absensi Harian/Pelajaran, School Fee Invoice/Payment, Rombongan Belajar, SK Mengajar, Agenda Sekolah, Contact Inbox SekolahPro, Pengganti Guru). **BK/Disiplin ABSENT** → panel flag-BK DROP dari v1 / empty-state.

### Sisa risiko (cek saat implement, bukan blocker)
- Query load di rute terpanas: fetch role-scoped (guru tak fetch finance), paralel + cached `useResourceList`.
- `useResourceList` hooks WAJIB di atas session guard `__root` (learning `useKoperasiMode-hook-above-guards`).
- `Entri Nilai` pending-count per guru: verifikasi field link guru saat bangun `scope.ts`.

---

## Designs yang kalah (referensi)

- **C1 Simplest-path (M)** — satu layout, hanya di-reorder & pruned per peran; ≤4 panel/peran dari pool 6 komponen; tanpa switcher/tab. *Disiplin subtraction-nya dicangkok ke C4.*
- **C2 Power-user (L)** — command center padat: `<CockpitPanel>` + pin/saved-filter/expand + keyboard nav (j/k/Enter/x) + multi-select bulk. *Slot-attached absensi CTA + bulk pesan wali dicangkok ke C4.*
- **C3 Native-first (M)** — zero komponen baru; 1 lib `berandaRole` + namespace `lib/beranda/*` + panel registry config-driven; FOCUS_BY_MODE bertahan hanya untuk tu_operator. *Panel registry + AksiCepat grid + graceful empty-state dicangkok ke C4.*

---

## Revisi pra-implementasi (gate review 2026-06-07 — System Analyst + Code Reviewer)

Kedua reviewer BLOCK → must-fix di bawah **menggantikan** teks konflik di atas. Setelah fold = APPROVE.

### A. Domain (System Analyst)
- **A1 Role derivation.** "Wali Kelas" (`fixtures/role.json:296`) + "Tata Usaha" (`rombongan_belajar.json:149`) = role Frappe ASLI. `berandaRole.ts` matchers WAJIB tambah needle eksplisit: `tu_operator`←{`tata_usaha`,`operator`}, `wali_kelas`←{`wali_kelas`,`wali kelas`} (jangan andalkan tabel keuangan/akademik — tak punya bucket ini). **Primary `wali_kelas` = (punya role "Wali Kelas") OR (`useMyRombels()`≥1).** Empty (role tapi 0 rombel) → empty-state, **JANGAN** fall-through ke kepala.
- **A2 Absensi split.** Absensi Harian TANPA `guru` → "missing" scope by **rombel**; Absensi Pelajaran by **guru** (Pegawai). Dua selector beda doctype (lihat Data & reuse).
- **A3 Entri Nilai → v2.** Tak queryable sbg count → descope (lihat Data & reuse). Hapus baris "Nilai pending" dari spec guru v1.
- **A4 Slot weekday-name.** `hari`=Select nama-hari (no Minggu); map WIB Date→nama + constrain `is_aktif`. Minggu→empty.
- **A5 (nice) Timezone WIB.** Hitung satu `today`/`weekday` ref (Asia/Jakarta) sekali, oper ke builders — `getDayMode()` sekarang pakai browser-local `getHours()` (`index.tsx:29`).
- **A6 (nice) Dedup key = NIS siswa**, lintas panel rendered untuk primary session (Keputusan #2).
- **A7 (nice) SK defensive.** Surface `status_validitas=="Akan Berakhir"` OR `tanggal_berakhir<=today+30d`.
- **A8 (nice) Invoice/Payment scoped by `company`** via `useActiveCompany()` (`keuangan-live.ts:170`), BUKAN sekolah — reuse hooks as-is.

### B. Struktur (Code Reviewer)
- **B1 BerandaView orchestrator (FILE BARU, WAJIB).** Tambah `components/beranda/BerandaView.tsx` = View pure `{data, layout, renderLink}` yang baca `berandaLayout` registry + compose 4 panel. Route `Home()` = hooks + 1 call/aggregator + `renderLink` + `<BerandaView/>`, **target ≤60 baris, hard cap <300, NO early-return sebelum hooks** (pola `staff.index.tsx` `StaffDashboardView`, BUKAN keuangan.index 443-line god-file).
- **B2 berandaRole split.** `lib/berandaRole.ts` = PURE config+matchers (`DeriveRoleConfig<BerandaRole>`, consume `sessionRole.deriveRoles:91`), unit-test seperti `keuanganRole.test.ts`. `useBerandaRole()` (wrapper `useSession()`) pindah ke `scope.ts`, **untested** (cermin `useKeuanganRole`).
- **B3 scope.ts = HOOK module.** Keluarkan dari list "murni"; model `keuangan-live.ts`. Predikat pure (is-slot-mine, rombel-tanpa-wali, filter-shape user→pegawai) ekstrak ke helper pure → itu yang di-unit-test. scope.ts sendiri: tanpa janji `.test.ts` unit (atau `renderHook` integration terpisah).
- **B4 Compose bukan copy.** `berandaInbox` IMPORT `keuanganWorkQueue.buildWorkQueue:172` + type `WorkItem`/`WorkSeverity`/`floatRolePreferred` untuk bucket finance (bendahara/kepala), TAMBAH bucket non-finance (absensi/berkas/PPDB/pesan/pengganti). `berandaSignals` REUSE `staffStats.deriveStaffActionQueue:153` + `siswaStats.deriveActionQueue:131` (sudah →AttentionItem[]) + dedup-vs-inbox di boundary.
- **B5 Named consts.** Route deep-links → `ROUTE_*` const (pola `keuanganWorkQueue.ts:51`); dismiss key const (pola `ONBOARDING_DISMISS_KEY`); 5 role-string const; threshold const.

### File boundaries final (revisi)
```
lib/berandaRole.ts        PURE config+matchers (compose deriveRoles); .test.ts ✅
lib/berandaInbox.ts       PURE; COMPOSE keuanganWorkQueue + bucket non-finance baru; .test.ts ✅
lib/berandaLayout.ts      PURE registry + flag konteks; .test.ts ✅
lib/berandaSignals.ts     PURE; REUSE staffStats/siswaStats + dedup; .test.ts ✅
lib/beranda/scope.ts      HOOKS only (+useBerandaRole) model keuangan-live.ts; predikat pure diekstrak & ditest; NO unit-test promise pada hook
components/beranda/BerandaView.tsx        NEW pure View, baca layout registry, compose 4 panel (KUNCI route tetap <300); RTL +afterEach(cleanup)
components/beranda/{AntreanSaya,StripKonteks,HariSaya,AksiCepat}.tsx   leaf panels, render link via scopedLinkProps
routes/sch.$sekolah.index.tsx             THIN: hooks + aggregator + renderLink + <BerandaView/>; ≤60 baris, no early-return pre-hooks
```

### Urutan build (TDD)
1. Pure libs TDD-first (test→red→green): `berandaRole` → `berandaLayout` → `berandaInbox` → `berandaSignals`.
2. `lib/beranda/scope.ts` hooks + predikat pure (test predikat saja).
3. `BerandaView` + 4 leaf panel (RTL).
4. Route rewrite (integration; verify via tsc/build, bukan unit).
5. Verify inline sekuensial: `pnpm generate` → `pnpm tsc` 0 → `pnpm lint` 0 → `pnpm vitest` hijau → `pnpm build` ok.

🤖 Generated via vernon-dev design tournament (20 agents) + 5 investigators + 2-agent gate review.
