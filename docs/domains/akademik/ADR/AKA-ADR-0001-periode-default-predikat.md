# AKA-ADR-0001: Periode Akademik Default & Predikat Ekstrakurikuler

- Status: Accepted
- Tanggal: 2026-06-03
- Domain: Akademik

## Konteks

Halaman operasional Akademik (Input Asesmen, Entri Nilai, Raport) menyaring data per periode (Tahun Ajaran + Semester). Sebelumnya, bar periode kosong saat user masuk — user wajib pilih TA tiap kunjungan, menciptakan friksi tinggi dan layar kosong membingungkan. Model data punya penanda TA aktif (`is_current` + window tanggal semester) yang dapat dipakai default otomatis.

Untuk predikat ekstrakurikuler, pembina (guru pembimbing) menilai kehadiran siswa lalu perlu memberikan predikat (Sangat Baik / Baik / Cukup / Kurang) di raport. Tanpa default, 30 siswa = 30 keputusan manual. Dengan helper sensible yang map % kehadiran → predikat, 30 siswa menjadi 30 konfirmasi.

## Keputusan

### Periode Default & Hardening

1. **Resolusi Otomatis:** Periode terpilih di chain bertingkat (berhenti di match pertama):
   - URL `?ta=` (jika valid di list TA)
   - localStorage last-used (`akademik:periode:$sekolah`)
   - TA dengan `is_current = 1`
   - TA `status = "Aktif"` dan acuan hari ini ∈ `[tanggal_mulai, tanggal_selesai]`
   - TA dengan `tanggal_mulai` terbaru (fallback, flag `noActiveTa=true`)

2. **Semester:** Dihitung dari window tanggal TA (Jul–Des → Ganjil, Jan–Jun → Genap) atau URL/localStorage.

3. **Persistence:** URL search params sumber kebenaran; setiap perubahan sinkron ke localStorage supaya sesi berikutnya langsung benar.

4. **Safety Guards:**
   - Banner peringatan kuning saat TA Closed / di luar window
   - Guard konfirmasi saat ganti periode dengan edit belum tersimpan
   - Echo periode di header & toast simpan
   - Nudge info jika tak ada TA aktif

5. **Implementation:** Modul pure `akademikPeriode.ts` (testable, reusable) + context + resolver di layout + `AkademikContextBar` (pill + banner + guard).

### Predikat dari Kehadiran

Helper pure `predikatFromKehadiran(persentase)` map % kehadiran → predikat dengan threshold konstan (bukan magic number):
- ≥90% → Sangat Baik
- ≥75% → Baik
- ≥50% → Cukup
- <50% → Kurang

Dipakai di form raport/ekstrakurikuler untuk suggest default; pembina tetap edit jika perlu.

## Konsekuensi

### Positif

- **UX:** User tidak perlu pilih TA tiap kunjungan; periode sudah benar otomatis. Friksi turun drastis.
- **Safety:** Banner + guard mencegah input ke periode salah. Echo periode di header & toast konfirmasi kesadaran.
- **Persistence:** Periode last-used tersimpan — kembali ke modul Akademik hari esok langsung ke periode kemarin.
- **Predikat Default:** Pembina dapat saran predikat dari kehadiran; tinggal konfirmasi/edit. 30 penilaian menjadi 30 review (bukan keputusan 30× baru).
- **Testable:** Logika periode & predikat pure — unit test tanpa DB/session/React, cepat & repeatable.

### Negatif

- **localStorage Dependency:** Jika localStorage unavailable (private browsing, quota full), periode fallback ke resolusi chain tiap sesi (tidak fatal, tapi UX turun ke default tiap kunjungan).
- **Date Boundary Edge Cases:** Perubahan TA window atau tanggal sistem dapat menggeser semester terukur; edge case testing penting.
- **Predikat Threshold Statis:** Threshold predikat hardcoded (90/75/50); perubahan butuh code update bukan config backend. YAGNI untuk sekarang.

### Trade-off Ditunda (YAGNI)

- **Manage `is_current` dari UI web:** Tetap manual backend/fixture saja.
- **Custom threshold predikat via config:** Threshold tetap hardcoded lib.
- **Periode default di modul non-Akademik:** Setiap modul punya strategi tersendiri (atau tidak ada periode).

## Referensi

- Spec Design: `apps/school/docs/superpowers/specs/2026-05-31-akademik-tahun-ajaran-default-design.md`
- Plan Implementasi: `apps/school/docs/superpowers/plans/2026-05-31-akademik-periode-default.md`
- Source Code:
  - `src/lib/akademikPeriode.ts` — pure resolver periode
  - `src/lib/akademikPeriode.test.ts` — unit test (80 line)
  - `src/lib/akademikContext.tsx` — context value + provider
  - `src/routes/sch.$sekolah.akademik.tsx` — layout fetch TA, resolusi, redirect, context provider
  - `src/components/akademik/AkademikContextBar.tsx` — bar pill + banner + nudge + guard
  - `src/lib/predikatFromKehadiran.ts` — helper predikat (threshold konstan)
  - Test totals: 638 lines akademik-related test (4 suites)
