# STF-ADR-0001: SK Mengajar & SK Jabatan Sebagai Dokumen Penugasan Berkala

- **Status:** Accepted
- **Tanggal:** 2026-06-03
- **Domain:** Guru & Staf (Kepegawaian)

## Konteks

Dalam sekolah Indonesia, penugasan guru dan staff memiliki dasar hukum: Surat Keputusan (SK) yang diterbitkan oleh kepala sekolah. Setiap tahun ajaran (atau periode kontrak), SK baru harus diterbitkan atas nama guru/staff untuk tugas mengajar atau jabatan yang akan dilakukan.

Dua pertanyaan desain muncul:
1. Apakah SK adalah dokumen legal *sekali terbit* (immutable, arsipal), atau *repeatable per-periode*?
2. Bagaimana menyimpan histori penugasan multi-tahun tanpa duplikasi data?

Tanpa keputusan eksplisit, risiko:
- **Duplikasi:** Menyimpan "Penugasan 2024/1 & 2024/2 & 2025/1 & ..." memecah data guru yang sama
- **Immutability ambigu:** Jika SK dapat diubah, auditnya susah; jika tidak, renovasi penugasan kompleks
- **Workflow confusion:** Apakah perubahan Penugasan = buat SK baru, atau update SK lama?

## Keputusan

**SK Mengajar & SK Jabatan adalah dokumen penugasan *berkala* (per-periode/kontrak), bukan arsipal.**

1. **Satu SK = satu periode legal.** Setiap SK Mengajar melekat pada satu Penugasan Guru (1:1), dengan tanggal_mulai_berlaku—tanggal_berakhir mewakili periode akademik/fiscal. Saat TA baru dimulai, operator mempersiapkan Penugasan baru & SK Mengajar baru.

2. **SK Diterbitkan = immutable; renovasi via SK Pencabutan + SK Baru.** Setelah SK Mengajar.on_submit() (docstatus=1, Diterbitkan), dokumen locked — tidak boleh edit field substansi (mapel, kelas, JJM, tanggal). Jika penugasan berubah mid-period: operator harus terbitkan SK Pencabutan (set <code>sk_pencabutan_ref</code>), lalu SK Mengajar baru. Immutability rule: **R-AKD-SK-01.**

3. **Historisasi via dokumen chain, bukan versioning.** Setiap SK Mengajar/SK Jabatan yang Diterbitkan menjadi "periode snapshot" dengan tanggal_mulai_berlaku & tanggal_berakhir. Historian membaca chain: Penugasan 2024/1 → SK Mengajar Diterbitkan → (mid-period pembatalan?) → SK Pencabutan → Penugasan 2024/2 → SK Mengajar Baru Diterbitkan. Tidak ada "version field" pada SK; historisasi organik dari dokumen sequence.

4. **Publish event "akademik.sk_mengajar.diterbitkan" saat on_submit.** Downstream sistem (payroll, absensi realisasi, audit log) subscribe untuk tahu kapan periode legal dimulai. Event payload: <code>{name, guru, tanggal_mulai_berlaku, tanggal_berakhir}</code>.

## Konsekuensi

### Positif

- **Immutability → audit trail jelas:** Setiap SK Diterbitkan adalah record legal point-in-time; tidak ada "hidden edits." Pembatalan tercatat eksplisit via sk_pencabutan_ref.
- **Compliance dengan regulasi:** Permendikbud mensyaratkan SK legal per-periode; design ini matching exact requirement.
- **Historisasi natural:** Tidak perlu versioning table; timeline SK Mengajar di filter <code>guru=X</code> sudah timeline penugasan.
- **Workflow clarity:** "Buat SK" action 1:1 ke "Penugasan Aktif → tombol Buat SK → draft SK."

### Negatif

- **Lebih banyak dokumen:** Setiap tahun/periode = SK baru; 10 tahun penugasan = ~10+ SK Mengajar rows. List bisa panjang (mitigasi: filter by year, archive old).
- **Pembatalan multi-langkah:** Jika mid-period perlu henti: operator harus buat SK Pencabutan (extra field, extra UI step). Complexity trade-off vs immutability.
- **No "bulk edit":** Kalau 50 guru naik JJM sama-sama, operator harus touch 50 Penugasan × 50 SK (tidak ada bulk update setelah Diterbitkan). Mitigasi: design bulk-create SK Mengajar untuk TA baru, per-guru edit pre-submit.

### Trade-off ditunda (YAGNI)

- **Soft-delete vs hard-delete Penugasan:** Jika Penugasan dihapus, SK Mengajar yg dirujuk jadi orphan. Mitigasi: validate Penugasan.on_trash() che check SK referencing. Soft-delete tidak urgent — jarang terjadi.
- **Time-window SK overlap:** Kalau operator upload SK Mengajar 2025 sebelum SK Mengajar 2024 selesai, kedua periode overlap. Mitigasi future: scope-level business rule atau alert, bukan hard block (sekolah mungkin ada kasus legitimate overlap).
- **QR verification link validity:** SK Mengajar.qr_verifikasi punya build_verify_url() ke QR. Kalau SK Dicabut, apakah QR link harus invalidate? Mitigasi: future feature — maintain revocation list di verification endpoint.

## Referensi

- apps/school/src/routes/sch.$sekolah.staff.penugasan.tsx — Penugasan list & "Buat SK" button  
- apps/school/src/routes/sch.$sekolah.staff.sk-mengajar.tsx — SK Mengajar list & BulkGenerateSkButton  
- sekolahpro/akademik/doctype/sk_mengajar/sk_mengajar.py — on_submit event, immutability validation, sk_pencabutan_ref rule  
- sekolahpro/akademik/doctype/penugasan_guru/penugasan_guru.py — status guard (Aktif required to create SK)  
- docs/staff.md — admin flow "Penugasan → tombol Buat SK → SK Mengajar draft"
