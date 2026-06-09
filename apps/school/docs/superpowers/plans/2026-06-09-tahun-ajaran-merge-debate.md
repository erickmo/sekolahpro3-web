# Debat: Gabung menu year-bound jadi satu workspace "Tahun Ajaran"?

> Tanggal: 2026-06-09 · Format: Pro ⚔ Kontra × 3 peran (Kepsek/TU/Guru) → sintesis · 17 agen
> Sifat: **DESIGN ONLY** — tidak ada kode ditulis. Ini rekomendasi untuk diputuskan manusia.

---

## 0. Usulan yang diperdebatkan

Bikin **satu menu top-level "Tahun Ajaran"** yang menyerap **Akademik + Ekstrakurikuler + Jadwal + Kelas + Absensi** jadi satu workspace period-first. Default = tahun berjalan; pemilih kartu untuk buka tahun lalu (arsip, mostly read). Kedalaman yang diminta pemilik = **restrukturisasi penuh** (IA + satukan engine TA terduplikasi + scope doctype Jadwal/Absensi yang belum ter-scope + migrasi data).

Kendala keras: **harus sangat mudah untuk pengguna pemula / gaptek.**

---

## 1. PUTUSAN (TL;DR)

> ### ❌ JANGAN bikin menu top-level "Tahun Ajaran". `should_merge = false`
>
> Ketiga peran (3/3) menolak big-bang dan memberi skor ramah-pemula **3/5** untuk usulan apa adanya. Tapi penyakit yang ditemukan **nyata dan terverifikasi di kode** — obatnya yang salah.

Usulan ini menggabung tiga hal berbeda yang harus dipisah:

| Lapisan | Apa | Putusan |
|---|---|---|
| **(A) Konsolidasi MESIN** | Satu engine TA bersama + label TA read-only di tiap modul, di tempatnya sekarang | ✅ **KERJAKAN** (aman, manfaat langsung, semua peran setuju) |
| **(B) Konsolidasi MENU** | Mega-menu period-first menelan 5 modul | ❌ **TOLAK** (sidebar "Jadwal/Absensi/Kelas" tetap pintu sendiri) |
| **(C) MIGRASI backend** | Scope doctype Jadwal/Absensi yang belum ter-scope | ⏳ **NANTI** (sempit, di belakang feature flag, additive-dulu) |

**Yang benar-benar melindungi kepatuhan Kepsek bukan penggabungan navigasi**, melainkan dua perbaikan sempit:
1. Jadikan `isPastPeriod` **write-lock SUNGGUHAN** yang ditegakkan di backend (sekarang cuma banner kuning di UI).
2. Tambah kolom `tahun_ajaran` ke **Absensi Harian** + backfill deterministik.

Capai "satu model mental" lewat **chrome seragam** (strip-tahun read-only identik di tiap pintu modul), **bukan** lewat hierarki menu baru.

---

## 2. Realitas kode (terverifikasi oleh agen, bukan asumsi)

| Temuan | Bukti |
|---|---|
| `/akademik` sudah period-first, auto-redirect nol-klik | `akademik.index.tsx:115,121-126` (`pickAutoRedirectTa` + `navigate replace:true`) |
| `isPastPeriod` **bukan kunci** — cuma munculkan banner | `AkademikContextBar.tsx:142` (tone info); entri-nilai/asesmen tak pernah disable simpan karena periode lampau |
| `ekskulContext` harfiah klon | `ekskulContext.tsx:5` "Cloned from akademikContext" — gandakan `isPastPeriod/noActiveTa/dirty` |
| **Absensi Harian** TANPA kolom `tahun_ajaran` | header `{name, rombel, tanggal, dibuat_oleh}`; filter `today=new Date()`; TODO `absensi.index.tsx:31` |
| **Absensi Guru** SUDAH punya `tahun_ajaran` (picker manual) | `AbsensiGuruFormModal` SearchableSelect (6 ref) → migrasi cuma Absensi Harian, bukan keduanya |
| **Jadwal** SUDAH ber-field `tahun_ajaran` | 9 ref di daftar/papan/persetujuan; `jadwal.papan.tsx:104,153` kirim `doc.tahun_ajaran` ke cek bentrok — tapi tahun tak pernah tampil |
| **Kelas** ter-scope cuma lewat KONVENSI, tak ditegakkan | `kelasBoard.ts:10` "Callers MUST pass rows already scoped" |
| Default "tahun berjalan" TIDAK dijamin | `resolveTahunAjaran` jatuh ke `newest()+noActiveTa` saat master-data kosong (`akademikPeriode.ts:78-79`) — kondisi khas sekolah gaptek |
| Storage diprioritaskan sebelum `is_current` | `akademikPeriode.ts:68` vs `70-71` → auto-redirect bisa mendarat di arsip |

---

## 3. Vonis per peran

Semua bertemu di **gabung-dengan-syarat**, skor ramah-pemula **3/5** — tapi alasannya beda.

### 👔 Kepala Sekolah — `gabung-dengan-syarat` (3/5)
- **Pro:** satu pola periode konsisten = lebih sedikit yang dihafal staf; default nol-klik nyata; menutup lubang kepatuhan (Absensi tak ter-tag TA saat audit Dinas).
- **Kontra:** janji unggulan PRO **fiksi** — "tahun lalu terkunci" itu kalimat, bukan kunci; menyatukan UI ≠ menyatukan kebenaran data (rasa aman palsu); backfill salah-tebak = kerusakan kepatuhan tak terbalik; model "satu tahun" bocor untuk pengawasan lintas-tahun.
- **Syarat utama:** write-lock backend SUNGGUHAN dulu; fase terpisah bukan big-bang; pertahankan nol-klik; lensa lintas-tahun; **jangan namai "Tahun Ajaran"**; rute harian tetap di tempatnya.

### 🗂️ Tata Usaha — `gabung-dengan-syarat` (3/5)
- **Pro:** TA selama ini "tuan tersembunyi" (jadwal diam-diam kirim `doc.tahun_ajaran`) — bikin terlihat = ketakutan "salah tahun" jadi kelihatan; auto-redirect nol-klik nyata; guard arsip read-only hapus kelas-kesalahan terburuk.
- **Kontra:** Absensi nyatanya **beririma tanggal/tahun-kalender**, bukan TA (modal pakai `getFullYear()-2..+1`) → memaksanya digerbang TA melawan refleks; migrasi atas data yang "diasumsikan" ter-scope = risiko pindah ke level data dan **TU yang membereskan**.
- **Syarat utama:** pisahkan (A) mesin dari (B) menu+migrasi; Absensi harian **tidak boleh digerbang TA**; backfill deterministik + bucket "Tanpa Tahun Ajaran" yang selalu tampil + dry-run reversibel.

### 🍎 Guru — `gabung-dengan-syarat` (3/5) — **paling tegas tolak penggabungan menu**
- **Pro:** hapus klon ekskulContext = belajar sekali; badge Arsip bisa dipakai ulang di Jadwal yang kini tanpa rambu; auto-redirect = nol-klik tetap; Jadwal sudah ber-field TA = scoping murah.
- **Kontra:** alur harian (`kelas/saya`, `absensi`) **sudah nol-konsep TA** — period-first MENAMBAH konsep ke layar paling sederhana; default tak dijamin (`noActiveTa` → mendarat di tahun salah dengan percaya diri); nama "Tahun Ajaran" = istilah administratif TU, bukan kata yang dicari guru ("Absensi").
- **Syarat utama:** **JANGAN satukan menu** — pintu "Absensi/Jadwal/Kelas" tetap terpisah & berlabel jujur; konsolidasi HANYA di lapisan engine/data; migrasi Absensi **additive-dulu-verifikasi-baru-aktif** supaya tombol simpan tak pernah terkunci salah.

---

## 4. Titik sepakat & konflik

### ✅ Sepakat (3/3)
- Penyakit nyata & terverifikasi (pemilih TA hilang di Jadwal & Absensi Harian; Kelas ter-scope cuma konvensi; klon ekskulContext; Absensi Harian tanpa kolom TA).
- Tolak big-bang → pentahapan + feature flag.
- Engine periode WAJIB disatukan (pakai `akademikPeriode.ts`+`akademikNav.ts` yang sudah ber-test, hapus klon).
- Nol-klik harian WAJIB lewat auto-redirect — "wajib pilih tahun tiap pagi" itu **mitos** (salah baca kode).
- Label "Tahun Ajaran" **ditolak**; wajib penunjuk 1-klik ke `/ppdb`.
- Migrasi WAJIB deterministik + reversibel + tak menyembunyikan data + dry-run sebelum commit.
- Jadwal duluan (risiko rendah); Absensi paling akhir.
- Sediakan lensa lintas-tahun ("Riwayat Siswa" + "Bandingkan Tahun").

### ⚔️ Konflik & resolusi
| Konflik | Resolusi |
|---|---|
| Gabung menu? Kepsek/TU "opsional paling akhir" vs Guru "tegas jangan" | **Menangkan Guru** — beban terberat di pengguna gaptek; bahkan Kepsek/TU taruh penggabungan "paling akhir/opsional" = bukan prasyarat. **Jangan satukan menu.** |
| Absensi Guru punya field TA? | Verifikasi: **punya** (picker manual). Hanya **Absensi Harian** yang tak punya → persempit migrasi. |
| Default "tahun berjalan" terjamin? | **Menangkan Guru** — saat `noActiveTa`, JANGAN diam-diam pakai sebagai tahun aktif untuk input; peringatan tegas + konfirmasi. |
| Write-lock: prasyarat mutlak vs mesin-dulu | **Berlapis:** write-lock FRONTEND di Fase 1; write-lock BACKEND = gerbang WAJIB sebelum migrasi (Fase 2). |
| Dialog "edit belum tersimpan" di absensi harian | **Menangkan Guru** — hilangkan barrier dirty dari centang-hadir-simpan; tetap hidup di Akademik/Ekskul. |

---

## 5. Proposal IA (chrome, bukan menu baru)

- **Tidak ada menu baru.** Sidebar tetap: `Akademik`, `Ekstrakurikuler`, `Jadwal`, `Absensi`, `Kelas` — pintu berlabel kerja, bukan istilah administratif.
- **Yang berubah hanya chrome di dalam tiap modul** (strip-tahun read-only seragam), bukan hierarki menu.
- **Default:** klik modul → mendarat LANGSUNG di tahun berjalan (auto-redirect). Kartu pemilih hanya saat sesi pertama atau sengaja klik "Lihat tahun lain".
- **Pindah tahun:** strip-tahun seragam (pola `AkademikContextBar`) — label TA read-only + badge (Berjalan / Arsip+gembok) + dropdown semester. Klik "Lihat tahun lain" → daftar kartu TA → konfirmasi "Anda berpindah ke TA 2024/2025 (arsip). Mode: hanya baca." TA terkunci di URL path (dua tab berdampingan).
- **Submodul:** Akademik (sumber pola) · Ekskul (migrasi dari dropdown ke pola sama, hapus klon) · Jadwal (strip-tahun, **PILOT**) · Absensi (Harian tetap click-and-go + label turunan-tanggal; Guru pakai picker yang ada) · Kelas (strip + bucket "Tanpa TA").
- **Lensa lintas-tahun** (BUKAN submodul per-TA): "Riwayat Siswa" + "Bandingkan Tahun" di `lib/orang`.

### Sengaja dikecualikan
- **PPDB** (tahun depan) — tapi WAJIB kartu/petunjuk 1-klik (lihat must-fix #5).
- Data lintas-tahun (mutasi/kelulusan/riwayat) — disajikan kronologis, bukan satu-kartu-per-tahun.
- Menu top-level gabungan — ditolak sebagai keputusan.
- Ganti picker tahun-kalender di modal Absensi dengan picker TA — ditolak (absensi beririma tanggal).

---

## 6. Prinsip desain ramah-pemula

1. **Nol-klik harian adalah hukum** — auto-redirect; pemilih tahun hanya saat sengaja diminta; tak ada gerbang TA di depan tugas rutin.
2. **Label di bahasa kerja, bukan administrasi** — pintu tetap "Absensi/Jadwal/Kelas".
3. **Buat tahun TERLIHAT, jangan PAKSA dipilih** — strip read-only bikin "salah tahun" kelihatan tanpa menambah keputusan.
4. **Arsip MENGUNCI secara struktural, bukan memperingatkan** — tombol simpan disabled (bukan disembunyikan) + alasan + "Kembali ke tahun ini".
5. **Jangan pernah menebak diam-diam** — `noActiveTa` → peringatan tegas; data tanpa tahun → bucket "Tanpa TA" yang selalu tampil.
6. **Satu cara-ganti-tahun untuk dihafal sekali** — hapus klon, satu engine + satu UI strip (sekarang ada 3 cara untuk 1 konsep).

---

## 7. Implikasi backend & risiko migrasi

**Backend:**
- **Write-lock arsip sungguhan (prioritas tertinggi):** controller tolak write ke TA Closed/luar-window (Asesmen, Entri/Detail Nilai, Rapor, Ekskul, lalu Jadwal/Absensi). Tanpa ini pagar kepatuhan batal.
- Satukan engine periode (pure-function, no I/O) → kegagalan resolver = "pilih tahun manual", bukan "modul mati".
- Scope **Absensi Harian** (satu-satunya yang perlu migrasi): tambah kolom `tahun_ajaran` turunan tanggal∈window.
- **Jadwal** = label/UI + enforce filter, **bukan migrasi data** (field sudah ada) → PILOT.
- **Kelas** = tegakkan scope di query, bukan kolom buta; bucket "Tanpa TA".
- Daftarkan setiap perubahan scope ke `tenant_registry` (atau scoping bocor diam-diam).

**Risiko migrasi:**
- Salah tebak batas Juli → kehadiran melekat ke TA salah → terkunci-baca. → Backfill **deterministik** via `inWindow`; tanpa tanggal jelas TIDAK ditebak.
- Data lama "raib" di balik filter → bucket "Tanpa TA" persisten + tombol "Tetapkan Tahun".
- Write-lock dinyalakan sebelum migrasi terbukti → simpan tiba-tiba abu-abu → **additive-dulu-verifikasi-baru-aktif**.
- Rasa aman palsu → jangan tampilkan "sudah ter-scope" sebelum backend benar validasi.
- Tak reversibel → simpan `tahun_ajaran_asli` + dry-run "X dipetakan, Y tidak" + layar koreksi.
- Permukaan kegagalan raksasa kalau serentak → feature-flag + rollout per-modul.

---

## 8. Pentahapan (anti big-bang)

| Fase | Isi | Sentuh data? |
|---|---|---|
| **0** Fondasi | Satukan engine (`akademikPeriode`+`akademikNav`), hapus `ekskulContext`; Ekskul ikut pola; peringatan tegas saat `noActiveTa` | ❌ frontend-only |
| **1** Chrome seragam | Strip-tahun read-only di Jadwal → Kelas → Absensi (di tempatnya, tombol harian tetap); arsip disable tombol di FE; auto-redirect dipertahankan; Absensi Harian & Kelas Saya tetap nol-konsep; kartu PPDB; lensa Riwayat/Bandingkan | ❌ frontend-only |
| **2** Write-lock backend | Tolak write ke TA Closed/luar-window di Akademik+Ekskul (sudah ber-scope) — tutup lubang kepatuhan tanpa migrasi | ❌ |
| **3** Migrasi Absensi Harian | Di belakang flag; additive-dulu (kolom turunan tanggal); bucket "Tanpa TA"; dry-run + koreksi + `tahun_ajaran_asli` + reversibel; verifikasi 100% SEBELUM filter/lock | ✅ (hati-hati) |
| **4** Penegakan Jadwal/Kelas | Enforce filter + write-lock backend Jadwal lalu Kelas; per-modul, masih di flag | ✅ |
| **5** (Opsional) | Pertimbangkan ulang konsolidasi navigasi HANYA jika terbukti perlu; default tetap pintu terpisah; dapat dibatalkan | — |

---

## 9. Uji pemula (kritik adversarial) — `perlu-perbaikan`

Penilai = orang tua/guru gaptek pertama-kali. 5 titik bingung terverifikasi. **7 yang WAJIB diperbaiki sebelum dibangun:**

1. **Strip di alur harian** — di modul nol-konsep TA (Absensi Harian, Kelas Saya), strip-tahun TIDAK boleh punya kontrol bisa-diklik (dropdown/"Lihat tahun lain"). Hanya chip kecil pasif "TA 2025/2026 · otomatis ikut tanggal". Aksi utama paling dominan secara visual.
2. **`noActiveTa` = BLOKIR, bukan banner** — area input terkunci, blok merah berbahasa awam + tombol "Minta admin menyiapkan" (notif otomatis) + opt-in sadar "Saya yakin, lanjut". (`resolveTahunAjaran:79` belum punya gate ini.)
3. **Auto-redirect TIDAK boleh mendarat di arsip** — `storedTa` hanya picu redirect bila TA itu Berjalan; arsip → paksa ke tahun berjalan + link kecil "Terakhir Anda lihat: …". (`akademikPeriode.ts:68` vs `70-71`.)
4. **Penjelasan disabled-state** — tiap tombol disabled karena arsip WAJIB punya teks alasan + tombol besar "Kembali ke tahun ini". Disabled tanpa alasan = bug di mata pemula.
5. **Kartu PPDB SELALU terlihat di hub** — kartu ketiga permanen sejajar Berjalan/Arsip: "Pendaftaran Murid Baru (Tahun Depan) →" link ke `/ppdb`. Jangan sembunyikan di balik tombol.
6. **Gate write-lock backend SEBELUM migrasi Absensi** — Fase 2 + dry-run 100% cocok WAJIB selesai di staging sebelum Fase 3-4. Jangan tampilkan "sudah ter-scope" sebelum backend benar menolak write.
7. **Bucket "Tanpa TA" berbahasa menenangkan + aksi massal** — microcopy non-error + "tetapkan semua ke TA X" + garansi reversibel; baris ber-tanggal dipetakan deterministik (tak masuk bucket); tetapkan ambang jumlah baris.

---

## 10. Pertanyaan terbuka untuk pemilik

1. Bolehkah TA arsip menolak write untuk SEMUA doctype? Adakah peran sah (super/Admin/Kepsek) yang perlu menulis ke arsip (koreksi nilai pasca-tutup, cetak ulang)? → perlu kebijakan pengecualian.
2. Apakah window tanggal TA (`tanggal_mulai/selesai`) SELALU terisi di produksi? Berapa estimasi baris Absensi Harian tanpa tanggal/TA?
3. Pernahkah window TA tumpang-tindih (1 tanggal → >1 TA)? Itu mematahkan backfill deterministik.
4. Absensi Guru (sudah ber-picker manual) — validasi TA terhadap tanggal, atau biarkan manual?
5. Skala migrasi: berapa sekolah & baris historis? Menentukan manual vs tooling batch.
6. `lib/orang` sudah simpan jejak TA per-enrolmen siswa? (untuk "Riwayat Siswa" kronologis)
7. PPDB: cukup link keluar, atau kartu "tahun depan" dengan ringkasan inline?
8. Jika Fase 5 jalan: label apa? ("Ruang Kelas & Nilai" / "Kegiatan Belajar" usul TU, atau tetap per-modul)

---

## Lampiran — metodologi

17 agen: 6 argumen pembuka (Pro+Kontra × 3 peran) → 6 sanggahan (tiap sisi baca lawan) → 3 vonis per-peran (hakim = peran itu sendiri, pemula) → 1 sintesis lintas-peran → 1 kritik pemula adversarial. Beginner-usability bobot tinggi di semua prompt. Agen membaca kode langsung; saling koreksi klaim (mis. Absensi Guru ternyata punya field TA).
