# Situs Sekolah — Modern Templates + Block-Driven CMS

**Tanggal:** 2026-06-02
**Status:** Draft — menunggu review
**Repo terdampak:** `sekolahpro-web` (SPA `apps/situs` + CMS `apps/school`) dan `sekolahpro` (backend Frappe)

---

## 1. Ringkasan & Tujuan

Modernisasi situs publik per-sekolah (`apps/situs`) — hero modern dan section yang lebih kontemporer — sekaligus mengubah sistem template dari **hardcoded per-template** menjadi **block-driven + data-driven**, sehingga:

- Admin sekolah menyusun halaman lewat **blok** (atur urutan, aktif/nonaktif, pilih variant, isi konten) langsung dari CMS app-school — **no-code**.
- Template baru ke depan bisa ditambah **hanya dengan membuat record** (Template Situs + default layout), tanpa deploy frontend — selama memakai building block yang sudah ada.
- Jenis blok / hero variant yang benar-benar baru tetap butuh 1 renderer React (sekali bikin, dipakai semua) — inilah batas hybrid **C**.

**Bukan tujuan (out of scope):** mengubah `apps/landing` (situs produk global), mengganti rendering ke Frappe Builder server-side, drag-drop visual WYSIWYG sebebas HTML, dark mode, multi-bahasa situs.

### Keputusan yang sudah dikunci

| Keputusan | Pilihan |
|---|---|
| Lingkup | Upgrade `apps/situs` existing (bukan sistem baru); `apps/landing` cuma referensi desain |
| Template | Hybrid **C** — library building block (code, sekali) + template = data |
| No-code model | Doctype-driven + React SPA (metadata Frappe = source of truth) |
| Block builder UI | Di CMS app-school (`sch.$sekolah.situs`) |
| Model data | **A1** — child table di `Situs Sekolah`; konten list pakai doctype existing |
| Render engine | **B1** — block-driven composer di SPA |
| Pengelola | Admin sekolah / kepala sekolah (role gating `/situs` existing) |
| Cakupan konten | Semua area |

---

## 2. Arsitektur

Tiga lapis, tiap lapis punya satu tanggung jawab:

```
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (sekolahpro)                                          │
│  Situs Sekolah (parent) + child tables:                       │
│   layout_blocks, keunggulan, statistik, testimoni             │
│  Template Situs (+ token fields, default_layout)              │
│  situs_admin.save_situs (permisif → simpan parent + child)    │
│  services/situs_content.build_site_payload → JSON             │
└───────────────┬───────────────────────────────────────────────┘
                │ JSON payload (guest read: situs.resolve_site)
                ▼
┌─────────────────────────────────────────────────────────────┐
│ SPA (apps/situs)                                              │
│  mapSite() → SiteData { layoutBlocks, keunggulan, ... tokens }│
│  composer: iterasi layoutBlocks → blockRegistry[type][variant]│
│  block renderers (Hero modern, Keunggulan, Statistik, ...)    │
│  theme tokens dari payload → CSS vars runtime                 │
└─────────────────────────────────────────────────────────────┘
                ▲ baca/tulis via situs_admin (authed)
                │
┌───────────────┴───────────────────────────────────────────────┐
│ CMS (apps/school · sch.$sekolah.situs)                        │
│  Tata Letak: susun/urut/toggle blok + variant + heading       │
│  Sorotan: editor child-array (keunggulan/statistik/testimoni) │
│  Tampilan: template picker + brand + hero (+ field baru)      │
└─────────────────────────────────────────────────────────────┘
```

**Prinsip kunci:** *layout & konten presentasional = data (child table)*; *konten list (berita/agenda/galeri/prestasi) = doctype existing, di-referensikan blok*; *visual = library renderer React (code)*.

---

## 3. Backend (repo `sekolahpro`)

### 3.1 `Situs Sekolah` — field baru (parent)

Saveable otomatis lewat `save_situs` yang permisif (loop `doc.set(key, val)` untuk tiap field di meta). Tambah ke `situs_sekolah.json`:

| Field | Tipe | Catatan |
|---|---|---|
| `hero_eyebrow` | Data | Badge kecil di atas judul hero |
| `hero_cta2_label` | Data | Label CTA sekunder |
| `hero_cta2_url` | Data | URL CTA sekunder |

(Field hero existing dipertahankan: `hero_judul`, `hero_subjudul`, `hero_cta_label`, `hero_cta_url`, `tagline`, `hero_image`, `brand_color`, `brand_color_2`, dst.) **Variant hero** tidak disimpan di parent — diambil dari blok hero di `layout_blocks`.

### 3.2 Child doctypes baru (`istable: 1`, parent `Situs Sekolah`)

> Child table inherit tenant scoping dari parent (tidak punya field tenant sendiri) → **TIDAK** masuk `tenant_registry.py`. Ini menghindari jebakan registry yang pernah terjadi di modul lain.

**`Situs Layout Block`** — field tabel `layout_blocks` di Situs Sekolah:

| Field | Tipe | Catatan |
|---|---|---|
| `tipe` | Select | `hero`, `keunggulan`, `statistik`, `testimoni`, `profil`, `berita`, `agenda`, `galeri`, `prestasi`, `ppdb`, `cta`, `kontak`, `richtext` (catatan: `fasilitas` ditunda — belum ada renderer/konten) |
| `variant` | Data | Key variant untuk tipe itu (mis. hero: `split`/`centered`/`fullbleed`/`overlay`) |
| `aktif` | Check (default 1) | Toggle tampil |
| `judul` | Data | Override heading section (opsional) |
| `subjudul` | Small Text | Override eyebrow/lead (opsional) |
| `cta_label` | Data | Untuk blok `cta` (opsional) |
| `cta_url` | Data | Untuk blok `cta` (opsional) |
| `konten` | Text Editor | Untuk blok `richtext` (opsional) |

Urutan = `idx` native Frappe.

**`Situs Keunggulan`** — field tabel `keunggulan`:

| Field | Tipe |
|---|---|
| `ikon` | Data (nama ikon dari set @sekolahpro/ui) |
| `judul` | Data |
| `deskripsi` | Small Text |

**`Situs Statistik`** — field tabel `statistik`:

| Field | Tipe |
|---|---|
| `label` | Data |
| `nilai` | Data |
| `satuan` | Data (opsional, mis. "siswa", "+") |

**`Situs Testimoni`** — field tabel `testimoni`:

| Field | Tipe |
|---|---|
| `nama` | Data |
| `peran` | Data (mis. "Wali Murid", "Alumni") |
| `foto` | Attach Image |
| `kutipan` | Small Text |

### 3.3 `Template Situs` — token fields baru

| Field | Tipe | Default contoh |
|---|---|---|
| `hero_variant` | Data | `split` |
| `radius` | Data | `12px` |
| `font_heading` | Data | nama font / token |
| `font_body` | Data | nama font / token |
| `shadow` | Data | string box-shadow |
| `section_style` | Select | `card` / `flat` / `bordered` |
| `default_layout` | Small Text (JSON/CSV) | urutan blok default untuk seeding sekolah baru |

### 3.4 API

- **`situs_admin.save_situs(sekolah, values)`** — sudah permisif. Verifikasi (+ test) bahwa `doc.set("layout_blocks", [..])` / `keunggulan` / `statistik` / `testimoni` dengan list-of-dict mengganti child rows dengan benar. Tidak perlu method baru.
- **`situs_admin.list_template()`** — perluas projeksi field agar ikut mengembalikan token baru (`hero_variant`, `radius`, dst.) untuk preview di picker CMS.
- **`services/situs_content.build_site_payload`** — proyeksikan ke payload publik:
  - `profil.hero_eyebrow`, `profil.hero_cta2_label`, `profil.hero_cta2_url`
  - blok `layout` baru: `layout_blocks` (urut, tipe, variant, aktif, judul, subjudul, cta_*, konten)
  - `keunggulan[]`, `statistik[]`, `testimoni[]`
  - `theme`/`tokens`: dari Template Situs (radius, font, shadow, section_style, hero_variant default)
  - **Fallback:** jika `layout_blocks` kosong (sekolah lama) → backend kirim `default_layout` dari template (atau SPA derive dari `sections`). Backward-compatible.
- **`situs.resolve_site` / `get_site`** (guest read) tetap entry point; payload diperluas otomatis lewat `build_site_payload`.

### 3.5 Fixtures & seeding

- `fixtures/template_situs.json` — isi token + `default_layout` untuk `klasik`, `modern`, `ceria` (modernisasi token mereka).
- Tambah **1 template flagship baru** sebagai demo data-driven, mis. **`aurora`** (hero `fullbleed` + gradient, `section_style: card`) — dibuat **hanya via fixture + variant existing**, membuktikan jalur "template baru = data".
- Sekolah existing tanpa `layout_blocks` → render pakai `default_layout` template (tidak perlu migrasi data wajib).

### 3.6 Tenant safety

- Tidak ada doctype **standalone** tenant baru → **tidak ada perubahan** `tenant_registry.py`. (Child table aman, inherit parent.) Dicatat eksplisit + test memastikan tidak ada kebocoran.

---

## 4. SPA (`apps/situs`)

### 4.1 Block engine (B1)

- **`src/templates/blocks/registry.ts`** — `blockRegistry: Record<BlockType, Record<Variant, FC<BlockProps>>>` + renderer fallback.
- **`src/templates/Composer.tsx`** — gantikan `HomeBody` per-template: baca `site.layoutBlocks`, urut, filter `aktif`, render tiap blok via registry dengan props (heading/cta/konten + data section). Blok list-type (berita/agenda/galeri/prestasi/ppdb/profil/kontak) memakai **section component existing** sebagai renderer (dibungkus jadi block renderer).
- **Default layout:** jika `layoutBlocks` kosong → generate dari `default_layout`/`sections` template (logika `HomeBody` lama dipertahankan sebagai *default-layout generator*). Existing sites tetap jalan.
- **`registry.ts` template** dipertahankan untuk fallback `getTemplate()` + default layout.

### 4.2 Block renderers modern (frontend-design)

Dibangun dengan skill **frontend-design** (gradient, animasi halus, type scale modern, spacing kontemporer; hindari AI-generic):

- **Hero** variants: `split`, `centered`, `fullbleed` (gradient/overlay), `overlay` (image + scrim). Pakai `hero_eyebrow`, `hero_judul`, `hero_subjudul`, CTA primer + sekunder, `hero_image`, brand tokens.
- **Keunggulan** — grid kartu ikon + judul + deskripsi.
- **Statistik** — band angka besar (label/nilai/satuan), animasi count opsional.
- **Testimoni** — kartu/quote dengan foto + peran.
- **CTA** — band ajakan (judul/subjudul + tombol) dari field blok.
- Section existing (Berita/Agenda/Galeri/Prestasi/Profil/PPDB/Kontak/Footer/Nav) — dimodernisasi visualnya (depth, hover, spacing) tetap sebagai renderer blok.

### 4.3 Theme tokens dari payload

- `theme.ts` / `applyTheme` — set CSS vars (`--situs-radius`, `--situs-heading-font`, `--situs-card-shadow`, `--situs-section-style`, dll.) **dari payload `theme/tokens`**, bukan hanya `skins.css` hardcoded. `skins.css` jadi fallback default. Template baru cukup kirim token → skin berubah tanpa code.

### 4.4 Kontrak data

- `src/types.ts` — `SiteData` + `LayoutBlock`, `Keunggulan`, `Statistik`, `Testimoni`, `SiteTheme`.
- `src/lib/site.ts` `mapSite()` — map snake_case payload → camelCase (layout_blocks, keunggulan, statistik, testimoni, hero_eyebrow, hero_cta2_*, theme).
- `src/data/demo-site.ts` — tambah demo blocks + keunggulan/statistik/testimoni biar preview offline (:5184) menampilkan template modern.
- `src/constants.ts` — `BLOCK_TYPES`, daftar variant per tipe.

### 4.5 Tests (vitest, jaga 16 existing hijau)

- Composer: render blok sesuai urutan; skip `aktif=false`; fallback ke default layout saat `layoutBlocks` kosong.
- Renderer: hero per-variant, keunggulan/statistik/testimoni, cta.
- Theme: token dari payload → CSS vars (extend `theme.test.ts`).
- `mapSite`: field baru (extend `site.test.ts`).
- Contract: registry blok ≡ BLOCK_TYPES.

---

## 5. CMS (`apps/school` · `sch.$sekolah.situs`)

### 5.1 Halaman "Tata Letak" — `sch.$sekolah.situs.tataletak.tsx`

- List `layout_blocks`: reorder (tombol naik/turun — hindari dependency DnD baru), toggle `aktif`, pilih `variant` (dropdown sesuai tipe), edit `judul`/`subjudul`/`cta_*`/`konten`.
- Tambah blok dari `BLOCK_TYPES` yang tersedia; hapus blok.
- Simpan via `save_situs` (kirim array `layout_blocks` utuh dengan urutan baru).

### 5.2 Halaman "Sorotan" — child-array editors

Komponen generik **`ChildArrayManager`** (cermin pola `KontenManager`, tapi untuk child array di doc Situs, disimpan via `save_situs`):

- Editor **Keunggulan**, **Statistik**, **Testimoni** — add/edit/hapus/urut baris sesuai schema, simpan array via `save_situs`.
- Schema-driven (reuse pola `schemas.ts`), sehingga child-array baru ke depan = 1 entry schema.

### 5.3 Enrich "Tampilan" — `sch.$sekolah.situs.tampilan.tsx`

- Field baru: `hero_eyebrow`, `hero_cta2_label`, `hero_cta2_url`.
- Template picker: tampilkan template baru + preview token (radius/font/shadow) di kartu.

### 5.4 Navigasi & data

- `sch.$sekolah.situs.tsx` TABS — tambah tab **Tata Letak** dan **Sorotan**. Role gating `/situs` existing (kepala_sekolah, admin_sekolah) dipertahankan.
- `data/situs.ts` — perluas interface `SitusDoc` + tipe blok/keunggulan/statistik/testimoni; hook `useSaveSitus` existing sudah cukup (save_situs permisif).

### 5.5 Tests (app-school)

- Tata Letak: reorder/toggle/variant → bentuk payload `layout_blocks` benar saat save.
- ChildArrayManager: CRUD baris + payload save.
- Tampilan: field hero baru ter-render & tersimpan.
- Patuhi aturan RTL cleanup (cek setting vitest `globals`; bila `false`, `afterEach(cleanup)` per file).

---

## 6. Alur Data (contoh: admin tambah blok Keunggulan)

1. Admin buka **Sorotan → Keunggulan**, tambah 3 item, simpan → `save_situs(sekolah, { keunggulan: [...] })` → child rows tersimpan.
2. Admin buka **Tata Letak**, tambah blok `tipe=keunggulan`, urutkan setelah hero, `aktif=1`, simpan → `save_situs(sekolah, { layout_blocks: [...] })`.
3. Pengunjung buka situs → `situs.resolve_site` → `build_site_payload` proyeksikan `layout_blocks` + `keunggulan` → SPA `mapSite` → `Composer` render blok `keunggulan` variant terpilih dengan data.
4. Pratinjau CMS (`lib/situsPreview.ts`) buka SPA `?sekolah=` → tampil sama.

---

## 7. Error Handling

- **Backend:** `save_situs` tetap whitelist field-protected; child rows divalidasi controller doctype masing-masing (field wajib). Variant/tipe tak dikenal disimpan apa adanya (data), divalidasi di SPA.
- **SPA:** `blockRegistry` fallback — tipe/variant tak dikenal → renderer default (atau skip dengan log dev), tidak crash. Payload tanpa `layout_blocks` → default layout. Tetap pertahankan offline demo fallback existing.
- **CMS:** validasi form inline (field wajib per schema), tombol disabled saat `isPending`, error API ditampilkan inline.

---

## 8. Testing Strategy (ringkas)

- **Backend (pytest, bench di docker):** save_situs simpan/replace child arrays; build_site_payload kontrak baru (⚠️ update test kontrak `build_site_payload` yang ada); list_template kembalikan token; tidak ada kebocoran tenant.
- **SPA (vitest):** composer, renderer, theme tokens, mapSite, contract — 16 existing tetap hijau.
- **CMS (vitest):** Tata Letak, ChildArrayManager, Tampilan.
- Lint + `tsc --noEmit` bersih di ketiga area.

---

## 9. Unit & Batas (isolation)

| Unit | Tugas | Bergantung pada |
|---|---|---|
| `Situs Layout Block` (child) | simpan urutan/tipe/variant/aktif blok | Situs Sekolah |
| `Situs Keunggulan/Statistik/Testimoni` (child) | konten presentasional | Situs Sekolah |
| `build_site_payload` | proyeksi doc → JSON publik | doctypes di atas |
| SPA `Composer` | render daftar blok → UI | payload, blockRegistry |
| `blockRegistry` + renderers | visual per tipe/variant | tokens, SiteData |
| CMS `Tata Letak` | susun blok (data ops) | save_situs |
| CMS `ChildArrayManager` | CRUD child array | save_situs, schema |

Tiap unit bisa diuji terpisah lewat kontrak (payload JSON, props blok, schema).

---

## 10. Eksekusi Bertahap (1 spec, plan 3 fase)

1. **Backend** — field + child doctypes + token + payload + fixtures + tests.
2. **SPA** — block engine + renderer modern (frontend-design) + tokens + mapSite + demo + tests.
3. **CMS** — Tata Letak + ChildArrayManager + Tampilan + nav + tests.

Tiap fase di branch sendiri, hijau (tests + tsc + lint) sebelum lanjut.

---

## 11. Risiko & Catatan

- ⚠️ **Kontrak `build_site_payload`** punya test existing — wajib di-update bersamaan (pernah jadi sumber kegagalan di modul situs).
- ⚠️ Verifikasi `save_situs` benar-benar mengganti child rows lewat `doc.set(table_field, list)` — tulis test lebih dulu.
- ⚠️ Backward-compat: sekolah existing tanpa `layout_blocks` harus tetap render (default layout dari template).
- ⚠️ RTL cleanup (vitest `globals:false`) di app-school.
- Reorder blok: pakai tombol naik/turun, **tanpa** menambah dependency DnD (kecuali sudah ada).
- frontend-design dipakai saat implementasi renderer visual.
