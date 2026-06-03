# INF-ADR-0001: Fasilitas Ruangan sebagai Child Table Tenanted via Parent

- **Status:** Accepted
- **Tanggal:** 2026-06-03
- **Domain:** Infrastruktur / Sarpras

## Konteks

Fasilitas Ruangan adalah child doctype (istable=1) yang hidup di dalam Ruangan.fasilitas — grid peralatan/furnitur dalam ruang. Frappe REST API untuk child doctype tidak menyediakan permission check per-child; hanya parent doc yang di-check. Child doctype juga tidak memiliki field <code>sekolah</code> sendiri untuk tenant scoping.

Pertanyaan desain: Bagaimana meng-enforce tenancy (setiap user hanya lihat Fasilitas milik sekolah mereka) ketika child doctype tidak punya field sekolah?

## Keputusan

**Tenancy Fasilitas Ruangan diturunkan via parent (Ruangan).** Bukan direct-child-query, tapi lazy-load via parent doc.

Implementasi:
- Saat list Ruangan, hanya load metadata (nama, kode, lantai, kapasitas, status)
- Saat user expand row Ruangan di detail page, call <code>useResourceDoc("Ruangan", name)</code> → GET parent doc lengkap dgn child table embedded
- Ruangan doc GET dilindungi tenancy check BE: Ruangan.sekolah harus match user session sekolah
- Child fasilitas ikut dalam response (embedded) → inherit tenancy dari parent check
- Edit Fasilitas: modal RuanganFormModal handle grid inline, saat submit kirim array fasilitas lengkap ke <code>useResourceUpdate("Ruangan", {patch: {fasilitas: [...]}})</code> — Frappe replace seluruh child array

Keuntungan: Sederhana, leverage parent tenancy, menghindari child doctype permission complexity.

## Konsekuensi

### Positif
- **Tenancy guarantee:** Parent sekolah check otomatis cover child juga; bukan permission-overhead baru
- **Lazy load:** Fasilitas hanya fetch saat expand row, bukan bulk-load 100+ ruangan = 100+ child table query (performa lebih baik)
- **Full-replace semantik jelas:** Modal selalu kirim array lengkap, tidak ada "patch row 3" confusion — atomic update

### Negatif
- **Performance jika user expand banyak row:** Setiap expand = 1 fetch Ruangan doc. Mitigasi: client-side cache (TanStack Query auto-cache <code>["resource:doc", "Ruangan", name]</code>)
- **Bulk edit Fasilitas across ruangan susah:** Harus buka 3 modal terpisah, edit 3 grid. Deferred ke task "bulk admin tool" jika dibutuhkan
- **Child REST endpoint tetap tidak accessible:** <code>GET /api/resource/Fasilitas%20Ruangan</code> 403 untuk web user. OK, karena design tujuan adalah lazy-load via parent saja

### Trade-off Ditunda (YAGNI)
- **Child-level permission:** Tidak buat custom perm hook per-child. Child selalu ikut parent scoping. Jika ada use-case (mis. guru X hanya edit fasilitas ruangan Y), tangani via role + approval flow, bukan permission doctype
- **Fasilitas Ruangan list page:** Tidak buat dedicated list page untuk child doctype (tidak standar Frappe). User navigasi via parent Ruangan → expand → edit grid
- **Child audit log:** Tidak track change history per fasilitas row (costly di Frappe, child updates via parent patch tidak auto-track). Jika audit penting, buat approval workflow di akademik modul (out of scope)

## Referensi

- apps/school/src/routes/sch.$sekolah.infrastruktur.daftar-gedung.$gedungId.tsx — line 70-107, FasilitasExpanded component
- apps/school/src/components/infrastruktur/RuanganFormModal.tsx — grid fasilitas inline logic
- docs/superpowers/specs/2026-05-30-gedung-infra-crud-design.md — Addendum 2026-05-30, keputusan reuse modal
