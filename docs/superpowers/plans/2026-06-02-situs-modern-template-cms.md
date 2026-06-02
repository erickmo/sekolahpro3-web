# Situs Sekolah — Modern Templates + Block-Driven CMS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the per-school public site (`apps/situs`) with modern hero/sections and convert templates to a block-driven, data-driven model managed no-code from the app-school CMS.

**Architecture:** Backend adds child tables (`layout_blocks`, `keunggulan`, `statistik`, `testimoni`) on `Situs Sekolah` + token fields on `Template Situs`; the permissive `save_situs` persists them and `build_site_payload` projects them. The `apps/situs` SPA renders pages by iterating ordered layout blocks through a `blockRegistry[type][variant]` library (Composer), with theme tokens applied as CSS vars. The app-school CMS gains a "Tata Letak" block builder + "Sorotan" child-array editors + enriched "Tampilan". Adding a new template later = a backend record (no frontend deploy) unless a brand-new block/variant renderer is needed.

**Tech Stack:** Frappe (Python doctypes/JSON, whitelisted API), React 18 + TypeScript + Vite + TanStack Router/Query, Tailwind + CSS vars, vitest + pytest.

**Spec:** `docs/superpowers/specs/2026-06-02-situs-modern-template-cms-design.md`

**Phases:** 1) Backend (Tasks 1–9) · 2) SPA (Tasks 10–19) · 3) CMS (Tasks 20–26). Each phase on its own branch, green (tests + tsc + lint) before the next.

---



---

# PHASE 1 — BACKEND

I have all the information needed. Here is the Phase 1 markdown.

---

## Phase 1 — Backend (repo: `sekolahpro`)

All paths are relative to `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro` unless absolute. Bench runs in docker. Module tests live in `api/test_situs.py` (class `SitusTestCase`). Child tables are `istable:1` and inherit tenant scoping from `Situs Sekolah` — they are **never** added to `api/tenant_registry.py`.

Bench test command (used in every task):
```
docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs
```

---

### Task 1: Add 3 new parent fields to `Situs Sekolah` (hero_eyebrow, hero_cta2_label, hero_cta2_url)

**Files**
- Modify: `website_sekolah/doctype/situs_sekolah/situs_sekolah.json`

These three fields belong in the existing `section_konten` block, placed immediately after `hero_cta_url` (line 30 of `field_order` / line 81 of `fields`) so the hero content stays grouped before `column_break_konten`.

- [ ] **Step 1.1: Insert the 3 fieldnames into `field_order`.**
  Edit `field_order` — replace the line `"hero_cta_url",` (line 30) with:
  ```json
    "hero_cta_url",
    "hero_eyebrow",
    "hero_cta2_label",
    "hero_cta2_url",
  ```

- [ ] **Step 1.2: Insert the 3 field objects into `fields`.**
  Replace the field object line for `hero_cta_url` (line 81):
  ```json
      {"fieldname":"hero_cta_url","fieldtype":"Data","label":"URL Tombol Hero"},
  ```
  with:
  ```json
      {"fieldname":"hero_cta_url","fieldtype":"Data","label":"URL Tombol Hero"},
      {"fieldname":"hero_eyebrow","fieldtype":"Data","label":"Eyebrow Hero","description":"Teks kecil di atas judul hero, mis. 'Selamat Datang di'."},
      {"fieldname":"hero_cta2_label","fieldtype":"Data","label":"Label Tombol Hero 2"},
      {"fieldname":"hero_cta2_url","fieldtype":"Data","label":"URL Tombol Hero 2"},
  ```

- [ ] **Step 1.3: Bump `modified` timestamp** in the JSON to the current date-time so migrate picks up the schema change.

- [ ] **Step 1.4: Migrate to apply the schema.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
  ```
  Expected: `Updating DocTypes for sekolahpro ... Situs Sekolah` then `*** Scheduler is disabled ***` with exit 0, no traceback.

- [ ] **Step 1.5: Commit.**
  ```
  git commit -am "feat(situs): add hero_eyebrow + 2nd hero CTA fields to Situs Sekolah"
  ```

---

### Task 2: Create child doctype `Situs Layout Block` + add `layout_blocks` Table field

**Files**
- Create: `website_sekolah/doctype/situs_layout_block/__init__.py` (empty)
- Create: `website_sekolah/doctype/situs_layout_block/situs_layout_block.json`
- Create: `website_sekolah/doctype/situs_layout_block/situs_layout_block.py`
- Modify: `website_sekolah/doctype/situs_sekolah/situs_sekolah.json`

- [ ] **Step 2.1: Write a failing test that the new child doctype exists.**
  Add to `api/test_situs.py` inside `SitusTestCase`:
  ```python
  	def test_situs_layout_block_doctype_exists(self):
  		"""The Situs Layout Block child doctype is installed and istable."""
  		meta = frappe.get_meta("Situs Layout Block")
  		self.assertTrue(meta.istable)
  		field_names = {f.fieldname for f in meta.fields}
  		self.assertEqual(
  			field_names,
  			{"tipe", "variant", "aktif", "judul", "subjudul", "cta_label", "cta_url", "konten"},
  		)
  ```

- [ ] **Step 2.2: Run it — fails (DoesNotExistError: DocType Situs Layout Block not found).**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_situs_layout_block_doctype_exists
  ```
  Expected: `frappe.exceptions.DoesNotExistError: Situs Layout Block not found` → `FAILED (errors=1)`.

- [ ] **Step 2.3: Create the empty `__init__.py`** at `website_sekolah/doctype/situs_layout_block/__init__.py`.

- [ ] **Step 2.4: Create `situs_layout_block.json`** (mirrors the `wa_template_param` istable shape, module `Website Sekolah`):
  ```json
  {
   "actions": [],
   "creation": "2026-06-02 00:00:00.000000",
   "doctype": "DocType",
   "engine": "InnoDB",
   "istable": 1,
   "editable_grid": 1,
   "field_order": ["tipe", "variant", "aktif", "judul", "subjudul", "cta_label", "cta_url", "konten"],
   "fields": [
    {"fieldname":"tipe","fieldtype":"Select","label":"Tipe","options":"hero\nkeunggulan\nstatistik\ntestimoni\nprofil\nberita\nagenda\ngaleri\nprestasi\nppdb\ncta\nkontak\nrichtext","reqd":1,"in_list_view":1,"columns":2},
    {"fieldname":"variant","fieldtype":"Data","label":"Variant","in_list_view":1,"columns":2},
    {"fieldname":"aktif","fieldtype":"Check","label":"Aktif","default":"1","in_list_view":1,"columns":1},
    {"fieldname":"judul","fieldtype":"Data","label":"Judul","in_list_view":1,"columns":3},
    {"fieldname":"subjudul","fieldtype":"Small Text","label":"Subjudul"},
    {"fieldname":"cta_label","fieldtype":"Data","label":"Label CTA"},
    {"fieldname":"cta_url","fieldtype":"Data","label":"URL CTA"},
    {"fieldname":"konten","fieldtype":"Text Editor","label":"Konten"}
   ],
   "links": [],
   "modified": "2026-06-02 00:00:00.000000",
   "modified_by": "Administrator",
   "module": "Website Sekolah",
   "name": "Situs Layout Block",
   "owner": "Administrator",
   "permissions": [],
   "sort_field": "idx",
   "sort_order": "ASC",
   "track_changes": 0
  }
  ```

- [ ] **Step 2.5: Create `situs_layout_block.py`** (mirrors `WATemplateParam`):
  ```python
  """Situs Layout Block — child table: an ordered, typed section in a school's page layout."""
  from __future__ import annotations

  from frappe.model.document import Document


  class SitusLayoutBlock(Document):
  	pass
  ```

- [ ] **Step 2.6: Add the `layout_blocks` Table field to `Situs Sekolah`.**
  In `situs_sekolah.json`, append `"layout_blocks"` to the END of `field_order` (after `og_image`, line 56), and append this field object as the last entry in `fields` (after the `og_image` object, line 107):
  ```json
      {"fieldname":"layout_blocks","fieldtype":"Table","label":"Blok Layout","options":"Situs Layout Block","description":"Susunan section halaman beranda. Bila kosong, SPA memakai default_layout dari template."}
  ```
  Add a `section_layout` Section Break before it so it gets its own tab. Insert `"section_layout",` before `"layout_blocks"` in `field_order` and add to `fields`:
  ```json
      {"fieldname":"section_layout","fieldtype":"Section Break","label":"Layout Halaman"},
  ```
  Bump `modified`.

- [ ] **Step 2.7: Migrate + re-run the test — passes.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_situs_layout_block_doctype_exists
  ```
  Expected: `Ran 1 test ... OK`.

- [ ] **Step 2.8: Commit.**
  ```
  git commit -am "feat(situs): add Situs Layout Block child table + layout_blocks field"
  ```

---

### Task 3: Create child doctypes `Situs Keunggulan`, `Situs Statistik`, `Situs Testimoni` + their Table fields

**Files**
- Create: `website_sekolah/doctype/situs_keunggulan/{__init__.py, situs_keunggulan.json, situs_keunggulan.py}`
- Create: `website_sekolah/doctype/situs_statistik/{__init__.py, situs_statistik.json, situs_statistik.py}`
- Create: `website_sekolah/doctype/situs_testimoni/{__init__.py, situs_testimoni.json, situs_testimoni.py}`
- Modify: `website_sekolah/doctype/situs_sekolah/situs_sekolah.json`

- [ ] **Step 3.1: Write a failing test that all three child doctypes exist with the contract fields.**
  Add to `SitusTestCase`:
  ```python
  	def test_situs_content_child_doctypes_exist(self):
  		"""Keunggulan/Statistik/Testimoni child doctypes are istable with exact fields."""
  		expected = {
  			"Situs Keunggulan": {"ikon", "judul", "deskripsi"},
  			"Situs Statistik": {"label", "nilai", "satuan"},
  			"Situs Testimoni": {"nama", "peran", "foto", "kutipan"},
  		}
  		for doctype, fields in expected.items():
  			meta = frappe.get_meta(doctype)
  			self.assertTrue(meta.istable, f"{doctype} must be istable")
  			self.assertEqual({f.fieldname for f in meta.fields}, fields)
  ```

- [ ] **Step 3.2: Run it — fails** (`DoesNotExistError: Situs Keunggulan not found`).

- [ ] **Step 3.3: Create `situs_keunggulan/__init__.py` (empty) + `.json`:**
  ```json
  {
   "actions": [],
   "creation": "2026-06-02 00:00:00.000000",
   "doctype": "DocType",
   "engine": "InnoDB",
   "istable": 1,
   "editable_grid": 1,
   "field_order": ["ikon", "judul", "deskripsi"],
   "fields": [
    {"fieldname":"ikon","fieldtype":"Data","label":"Ikon","in_list_view":1,"columns":2,"description":"Nama ikon (mis. lucide 'shield', 'book-open')."},
    {"fieldname":"judul","fieldtype":"Data","label":"Judul","reqd":1,"in_list_view":1,"columns":4},
    {"fieldname":"deskripsi","fieldtype":"Small Text","label":"Deskripsi","in_list_view":1,"columns":5}
   ],
   "links": [],
   "modified": "2026-06-02 00:00:00.000000",
   "modified_by": "Administrator",
   "module": "Website Sekolah",
   "name": "Situs Keunggulan",
   "owner": "Administrator",
   "permissions": [],
   "sort_field": "idx",
   "sort_order": "ASC",
   "track_changes": 0
  }
  ```
  And `situs_keunggulan.py`:
  ```python
  """Situs Keunggulan — child table: a single advantage/feature card on a school site."""
  from __future__ import annotations

  from frappe.model.document import Document


  class SitusKeunggulan(Document):
  	pass
  ```

- [ ] **Step 3.4: Create `situs_statistik/__init__.py` (empty) + `.json`:**
  ```json
  {
   "actions": [],
   "creation": "2026-06-02 00:00:00.000000",
   "doctype": "DocType",
   "engine": "InnoDB",
   "istable": 1,
   "editable_grid": 1,
   "field_order": ["label", "nilai", "satuan"],
   "fields": [
    {"fieldname":"label","fieldtype":"Data","label":"Label","reqd":1,"in_list_view":1,"columns":5},
    {"fieldname":"nilai","fieldtype":"Data","label":"Nilai","reqd":1,"in_list_view":1,"columns":3},
    {"fieldname":"satuan","fieldtype":"Data","label":"Satuan","in_list_view":1,"columns":3}
   ],
   "links": [],
   "modified": "2026-06-02 00:00:00.000000",
   "modified_by": "Administrator",
   "module": "Website Sekolah",
   "name": "Situs Statistik",
   "owner": "Administrator",
   "permissions": [],
   "sort_field": "idx",
   "sort_order": "ASC",
   "track_changes": 0
  }
  ```
  And `situs_statistik.py`:
  ```python
  """Situs Statistik — child table: one headline statistic (label/nilai/satuan)."""
  from __future__ import annotations

  from frappe.model.document import Document


  class SitusStatistik(Document):
  	pass
  ```

- [ ] **Step 3.5: Create `situs_testimoni/__init__.py` (empty) + `.json`:**
  ```json
  {
   "actions": [],
   "creation": "2026-06-02 00:00:00.000000",
   "doctype": "DocType",
   "engine": "InnoDB",
   "istable": 1,
   "editable_grid": 1,
   "field_order": ["nama", "peran", "foto", "kutipan"],
   "fields": [
    {"fieldname":"nama","fieldtype":"Data","label":"Nama","reqd":1,"in_list_view":1,"columns":3},
    {"fieldname":"peran","fieldtype":"Data","label":"Peran","in_list_view":1,"columns":2},
    {"fieldname":"foto","fieldtype":"Attach Image","label":"Foto"},
    {"fieldname":"kutipan","fieldtype":"Small Text","label":"Kutipan","reqd":1,"in_list_view":1,"columns":5}
   ],
   "links": [],
   "modified": "2026-06-02 00:00:00.000000",
   "modified_by": "Administrator",
   "module": "Website Sekolah",
   "name": "Situs Testimoni",
   "owner": "Administrator",
   "permissions": [],
   "sort_field": "idx",
   "sort_order": "ASC",
   "track_changes": 0
  }
  ```
  And `situs_testimoni.py`:
  ```python
  """Situs Testimoni — child table: one testimonial (nama/peran/foto/kutipan)."""
  from __future__ import annotations

  from frappe.model.document import Document


  class SitusTestimoni(Document):
  	pass
  ```

- [ ] **Step 3.6: Add the 3 Table fields to `Situs Sekolah`.**
  Add a new section to group them. In `situs_sekolah.json` `field_order`, after `"layout_blocks"` (added in Task 2) append:
  ```json
      "section_blok_konten",
      "keunggulan",
      "statistik",
      "testimoni"
  ```
  And in `fields`, after the `layout_blocks` object append:
  ```json
      {"fieldname":"section_blok_konten","fieldtype":"Section Break","label":"Blok Konten"},
      {"fieldname":"keunggulan","fieldtype":"Table","label":"Keunggulan","options":"Situs Keunggulan"},
      {"fieldname":"statistik","fieldtype":"Table","label":"Statistik","options":"Situs Statistik"},
      {"fieldname":"testimoni","fieldtype":"Table","label":"Testimoni","options":"Situs Testimoni"}
  ```
  Bump `modified`.

- [ ] **Step 3.7: Migrate + re-run — passes.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_situs_content_child_doctypes_exist
  ```
  Expected: `Ran 1 test ... OK`.

- [ ] **Step 3.8: Commit.**
  ```
  git commit -am "feat(situs): add Situs Keunggulan/Statistik/Testimoni child tables + fields"
  ```

---

### Task 4: Add theme-token fields to `Template Situs`

**Files**
- Modify: `website_sekolah/doctype/template_situs/template_situs.json`

These are theme tokens read by `build_site_payload` (Task 6) and the template marketplace. Place them in a new `section_break_token` section after the existing `sections` field (line 29 of `fields` / end of `field_order`).

- [ ] **Step 4.1: Write a failing test that the token fields exist on the meta.**
  Add to `SitusTestCase`:
  ```python
  	def test_template_situs_token_fields_exist(self):
  		"""Template Situs exposes the theme-token + default_layout fields."""
  		meta = frappe.get_meta("Template Situs")
  		field_names = {f.fieldname for f in meta.fields}
  		for fieldname in (
  			"hero_variant", "radius", "font_heading", "font_body",
  			"shadow", "section_style", "default_layout",
  		):
  			self.assertIn(fieldname, field_names)
  		self.assertEqual(meta.get_field("section_style").options, "card\nflat\nbordered")
  ```

- [ ] **Step 4.2: Run it — fails** (`AssertionError: 'hero_variant' not found`).

- [ ] **Step 4.3: Append token fieldnames to `field_order`.**
  Replace the closing `"sections"` line of `field_order` (line 17) with:
  ```json
      "sections",
      "section_break_token",
      "hero_variant",
      "radius",
      "section_style",
      "column_break_token",
      "font_heading",
      "font_body",
      "shadow",
      "default_layout"
  ```

- [ ] **Step 4.4: Append the token field objects to `fields`.**
  Replace the `sections` field object (line 29) with:
  ```json
      {"fieldname":"sections","fieldtype":"Small Text","label":"Sections","description":"CSV daftar section key yang didukung template; contoh: hero,profil,berita,kontak"},
      {"fieldname":"section_break_token","fieldtype":"Section Break","label":"Token Tema"},
      {"fieldname":"hero_variant","fieldtype":"Data","label":"Hero Variant","description":"Varian hero default, mis. split, centered, fullbleed."},
      {"fieldname":"radius","fieldtype":"Data","label":"Radius","description":"Token radius CSS, mis. 0.5rem, 1rem, 9999px."},
      {"fieldname":"section_style","fieldtype":"Select","label":"Gaya Section","options":"card\nflat\nbordered","default":"card"},
      {"fieldname":"column_break_token","fieldtype":"Column Break"},
      {"fieldname":"font_heading","fieldtype":"Data","label":"Font Heading"},
      {"fieldname":"font_body","fieldtype":"Data","label":"Font Body"},
      {"fieldname":"shadow","fieldtype":"Data","label":"Shadow","description":"Token shadow CSS, mis. sm, md, lg."},
      {"fieldname":"default_layout","fieldtype":"Small Text","label":"Default Layout","description":"JSON array of {tipe,variant} dipakai SPA bila Situs.layout_blocks kosong."}
  ```
  Bump `modified`.

- [ ] **Step 4.5: Migrate + re-run — passes.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_template_situs_token_fields_exist
  ```
  Expected: `Ran 1 test ... OK`.

- [ ] **Step 4.6: Commit.**
  ```
  git commit -am "feat(situs): add theme-token + default_layout fields to Template Situs"
  ```

---

### Task 5: pytest — `save_situs` replaces layout_blocks / keunggulan / statistik / testimoni child rows

No new admin method is needed: `_apply_situs_values` (`api/situs_admin.py:142`) already loops the payload and calls `doc.set(key, val)` for any non-protected field present in meta. Passing a list-of-dicts for a Table field makes Frappe replace the child rows. This task proves it. The school-A fixture (`self._situs_a`) from `setUp` is reused; calls go through the private `_save_situs` (bypasses the membership guard so no Pengguna Sekolah fixture is needed).

**Files**
- Modify: `api/test_situs.py`

- [ ] **Step 5.1: Import `situs_admin` at the top of `test_situs.py`.**
  Change the existing import line (line 31):
  ```python
  from sekolahpro.services import situs_content, situs_resolver
  ```
  to:
  ```python
  from sekolahpro.api import situs_admin
  from sekolahpro.services import situs_content, situs_resolver
  ```

- [ ] **Step 5.2: Write the failing replacement test.**
  Add to `SitusTestCase`:
  ```python
  	def test_save_situs_replaces_child_rows(self):
  		"""save_situs sets and then fully replaces the layout/content child rows."""
  		situs_admin._save_situs(
  			SEKOLAH_A,
  			{
  				"layout_blocks": [
  					{"tipe": "hero", "variant": "split", "aktif": 1, "judul": "Selamat Datang"},
  					{"tipe": "keunggulan", "variant": "grid", "aktif": 1},
  				],
  				"keunggulan": [{"ikon": "shield", "judul": "Aman", "deskripsi": "Lingkungan aman"}],
  				"statistik": [{"label": "Siswa", "nilai": "1200", "satuan": "anak"}],
  				"testimoni": [{"nama": "Budi", "peran": "Wali", "kutipan": "Sekolah hebat"}],
  			},
  		)
  		doc = frappe.get_doc("Situs Sekolah", self._situs_a)
  		self.assertEqual(len(doc.layout_blocks), 2)
  		self.assertEqual(doc.layout_blocks[0].tipe, "hero")
  		self.assertEqual(doc.layout_blocks[0].variant, "split")
  		self.assertEqual(len(doc.keunggulan), 1)
  		self.assertEqual(doc.keunggulan[0].judul, "Aman")
  		self.assertEqual(len(doc.statistik), 1)
  		self.assertEqual(len(doc.testimoni), 1)

  		# Second save with shorter lists must REPLACE, not append.
  		situs_admin._save_situs(
  			SEKOLAH_A,
  			{
  				"layout_blocks": [{"tipe": "cta", "variant": "banner", "aktif": 1}],
  				"keunggulan": [],
  			},
  		)
  		doc = frappe.get_doc("Situs Sekolah", self._situs_a)
  		self.assertEqual(len(doc.layout_blocks), 1)
  		self.assertEqual(doc.layout_blocks[0].tipe, "cta")
  		self.assertEqual(len(doc.keunggulan), 0)
  ```

- [ ] **Step 5.3: Run it.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_save_situs_replaces_child_rows
  ```
  Expected: `Ran 1 test ... OK` — no production code change is needed since `_apply_situs_values` is already permissive and the Table fields now exist (Tasks 2–3). If it errors with `the field 'layout_blocks' does not exist`, the Task 2/3 migrate did not run — re-run `bench migrate`.

- [ ] **Step 5.4: Commit.**
  ```
  git commit -am "test(situs): prove save_situs replaces layout/keunggulan/statistik/testimoni rows"
  ```

---

### Task 6: Extend `build_site_payload` — project hero fields, layout_blocks, keunggulan, statistik, testimoni, theme

**Files**
- Modify: `services/situs_content.py`
- Modify: `api/test_situs.py` (UPDATE the existing contract test `test_build_site_payload_sections_reflect_toggles` plus add a dedicated payload-shape test)

- [ ] **Step 6.1: Add the new hero keys to `PROFIL_KEYS`.**
  In `situs_content.py`, extend the `PROFIL_KEYS` tuple (lines 60–70) — add `hero_eyebrow`, `hero_cta2_label`, `hero_cta2_url` after `hero_cta_url`:
  ```python
  PROFIL_KEYS = (
  	"tagline",
  	"hero_judul",
  	"hero_subjudul",
  	"hero_cta_label",
  	"hero_cta_url",
  	"hero_eyebrow",
  	"hero_cta2_label",
  	"hero_cta2_url",
  	"visi",
  	"misi",
  	"sambutan_kepsek",
  	"peta_embed",
  )
  ```

- [ ] **Step 6.2: Add projection key tuples + the template doctype constant.**
  After `PRESTASI_FIELDS` (line 117), add:
  ```python
  DT_TEMPLATE = "Template Situs"

  LAYOUT_BLOCK_KEYS = ("tipe", "variant", "aktif", "judul", "subjudul", "cta_label", "cta_url", "konten")
  KEUNGGULAN_KEYS = ("ikon", "judul", "deskripsi")
  STATISTIK_KEYS = ("label", "nilai", "satuan")
  TESTIMONI_KEYS = ("nama", "peran", "foto", "kutipan")
  THEME_KEYS = ("hero_variant", "radius", "font_heading", "font_body", "shadow", "section_style")
  ```

- [ ] **Step 6.3: Add the child-row + theme builder helpers.**
  After `_site_contact` (ends line 226), add:
  ```python
  def _rows(situs, table_field: str, keys) -> list[dict]:
  	"""Project a Situs child table into a list of flat contract dicts (order kept)."""
  	return [{key: row.get(key) for key in keys} for row in (situs.get(table_field) or [])]


  def _site_theme(situs) -> dict:
  	"""Theme-token block sourced from the school's Template Situs (empty if unset)."""
  	template = situs.get("template")
  	tpl = (
  		frappe.db.get_value(DT_TEMPLATE, template, list(THEME_KEYS) + ["default_layout"], as_dict=True)
  		if template
  		else None
  	) or {}
  	return {key: tpl.get(key) for key in THEME_KEYS}


  def _layout_blocks(situs) -> list[dict]:
  	"""Ordered layout blocks; falls back to the template's default_layout JSON."""
  	blocks = _rows(situs, "layout_blocks", LAYOUT_BLOCK_KEYS)
  	if blocks:
  		return blocks
  	template = situs.get("template")
  	raw = frappe.db.get_value(DT_TEMPLATE, template, "default_layout") if template else None
  	parsed = frappe.parse_json(raw) if raw else []
  	return [{**{key: None for key in LAYOUT_BLOCK_KEYS}, "aktif": 1, **b} for b in (parsed or [])]
  ```

- [ ] **Step 6.4: Wire the new blocks into `build_site_payload`'s return dict.**
  In `build_site_payload` (return dict at lines 161–172), add five keys after `"nav": _build_nav(sections),`:
  ```python
  		"nav": _build_nav(sections),
  		"layout_blocks": _layout_blocks(situs),
  		"keunggulan": _rows(situs, "keunggulan", KEUNGGULAN_KEYS),
  		"statistik": _rows(situs, "statistik", STATISTIK_KEYS),
  		"testimoni": _rows(situs, "testimoni", TESTIMONI_KEYS),
  		"theme": _site_theme(situs),
  ```
  The hero fields ride along automatically because `_site_profil` already spreads `_project(situs, PROFIL_KEYS)` (extended in Step 6.1).

- [ ] **Step 6.5: UPDATE the existing contract test.**
  In `api/test_situs.py`, extend `test_build_site_payload_sections_reflect_toggles`. After the existing `order` assertion (current last line, ~line 171), add NEW assertions confirming the contract keys are present and well-typed:
  ```python
  		# New site-builder contract keys (Phase 1).
  		for key in ("layout_blocks", "keunggulan", "statistik", "testimoni", "theme"):
  			self.assertIn(key, payload)
  		self.assertIsInstance(payload["layout_blocks"], list)
  		self.assertIsInstance(payload["theme"], dict)
  		for token in ("hero_variant", "radius", "font_heading", "font_body", "shadow", "section_style"):
  			self.assertIn(token, payload["theme"])
  		# Hero eyebrow / 2nd CTA project into profil.
  		for hero_key in ("hero_eyebrow", "hero_cta2_label", "hero_cta2_url"):
  			self.assertIn(hero_key, payload["profil"])
  ```

- [ ] **Step 6.6: Add a focused payload-shape test (child-row + default_layout fallback).**
  Add to `SitusTestCase`:
  ```python
  	def test_build_site_payload_projects_child_rows(self):
  		"""Saved child rows surface in the payload; layout_blocks fall back to template."""
  		situs_admin._save_situs(
  			SEKOLAH_A,
  			{
  				"keunggulan": [{"ikon": "shield", "judul": "Aman", "deskripsi": "Lingkungan aman"}],
  				"statistik": [{"label": "Siswa", "nilai": "1200", "satuan": "anak"}],
  				"testimoni": [{"nama": "Budi", "peran": "Wali", "kutipan": "Hebat"}],
  				"layout_blocks": [{"tipe": "hero", "variant": "split", "aktif": 1}],
  			},
  		)
  		payload = situs_content.build_site_payload(SEKOLAH_A)
  		self.assertEqual(payload["keunggulan"][0]["judul"], "Aman")
  		self.assertEqual(payload["statistik"][0]["nilai"], "1200")
  		self.assertEqual(payload["testimoni"][0]["nama"], "Budi")
  		self.assertEqual(payload["layout_blocks"][0]["tipe"], "hero")
  		self.assertEqual(payload["layout_blocks"][0]["variant"], "split")
  ```

- [ ] **Step 6.7: Run the contract + new tests — pass.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_build_site_payload_sections_reflect_toggles
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_build_site_payload_projects_child_rows
  ```
  Expected: `Ran 1 test ... OK` for each.

- [ ] **Step 6.8: Commit.**
  ```
  git commit -am "feat(situs): project hero/layout_blocks/keunggulan/statistik/testimoni/theme into site payload"
  ```

---

### Task 7: Extend `situs_admin.list_template` projection to include the new token fields

**Files**
- Modify: `api/situs_admin.py`
- Modify: `api/test_situs.py`

- [ ] **Step 7.1: Write a failing test on the projection.**
  Add to `SitusTestCase`:
  ```python
  	def test_list_template_includes_token_fields(self):
  		"""list_template returns theme-token + default_layout columns per template."""
  		rows = situs_admin._list_template()
  		self.assertTrue(rows, "expected at least one Template Situs fixture")
  		row = rows[0]
  		for key in (
  			"hero_variant", "radius", "font_heading", "font_body",
  			"shadow", "section_style", "default_layout",
  		):
  			self.assertIn(key, row)
  ```

- [ ] **Step 7.2: Run it — fails** (`AssertionError: 'hero_variant' not found in <row keys>`).

- [ ] **Step 7.3: Extend the `_list_template` projection.**
  In `api/situs_admin.py`, edit `_list_template` (lines 237–244) — extend the `fields` list:
  ```python
  def _list_template() -> list[dict]:
  	"""Return the active/beta template catalog ordered for the picker."""
  	return frappe.get_all(
  		TEMPLATE_DOCTYPE,
  		filters={"status": ("!=", "Arsip")},
  		fields=[
  			"name", "key", "nama", "deskripsi", "preview_image", "sections",
  			"aksen_default", "urutan", "hero_variant", "radius", "font_heading",
  			"font_body", "shadow", "section_style", "default_layout",
  		],
  		order_by="urutan asc, nama asc",
  	)
  ```

- [ ] **Step 7.4: Re-run — passes.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_list_template_includes_token_fields
  ```
  Expected: `Ran 1 test ... OK`.

- [ ] **Step 7.5: Commit.**
  ```
  git commit -am "feat(situs): expose theme-token + default_layout in list_template projection"
  ```

---

### Task 8: Update `fixtures/template_situs.json` — token tokens for klasik/modern/ceria + new `aurora` template

**Files**
- Modify: `fixtures/template_situs.json`

- [ ] **Step 8.1: Write a failing test that all four templates carry tokens + a default_layout.**
  Add to `SitusTestCase`:
  ```python
  	def test_template_fixtures_have_tokens(self):
  		"""klasik/modern/ceria/aurora fixtures carry theme tokens + default_layout JSON."""
  		for key in ("klasik", "modern", "ceria", "aurora"):
  			self.assertTrue(frappe.db.exists("Template Situs", key), f"missing template {key}")
  			row = frappe.db.get_value(
  				"Template Situs",
  				key,
  				["hero_variant", "section_style", "default_layout"],
  				as_dict=True,
  			)
  			self.assertTrue(row.hero_variant, f"{key} missing hero_variant")
  			self.assertIn(row.section_style, ("card", "flat", "bordered"))
  			self.assertTrue(frappe.parse_json(row.default_layout), f"{key} default_layout not a JSON array")
  		aurora = frappe.db.get_value(
  			"Template Situs", "aurora", ["hero_variant", "section_style"], as_dict=True
  		)
  		self.assertEqual(aurora.hero_variant, "fullbleed")
  		self.assertEqual(aurora.section_style, "card")
  ```

- [ ] **Step 8.2: Run it — fails** (aurora does not exist; `hero_variant` is `None` for klasik).

- [ ] **Step 8.3: Rewrite `fixtures/template_situs.json`** to add tokens to all three existing entries and append `aurora`. `default_layout` is a JSON-string holding an array of `{tipe,variant}`:
  ```json
  [
   {
    "doctype": "Template Situs",
    "name": "klasik",
    "key": "klasik",
    "nama": "Klasik",
    "deskripsi": "Formal dan akademik. Tipografi serif, tata letak terstruktur. Cocok untuk SMP/SMA/Madrasah.",
    "status": "Aktif",
    "urutan": 1,
    "sections": "hero,profil,berita,agenda,galeri,prestasi,fasilitas,ppdb,kontak",
    "aksen_default": "#1d4ed8",
    "hero_variant": "split",
    "radius": "0.375rem",
    "font_heading": "Merriweather",
    "font_body": "Source Sans 3",
    "shadow": "sm",
    "section_style": "bordered",
    "default_layout": "[{\"tipe\":\"hero\",\"variant\":\"split\"},{\"tipe\":\"keunggulan\",\"variant\":\"grid\"},{\"tipe\":\"profil\",\"variant\":\"default\"},{\"tipe\":\"berita\",\"variant\":\"list\"},{\"tipe\":\"agenda\",\"variant\":\"default\"},{\"tipe\":\"prestasi\",\"variant\":\"default\"},{\"tipe\":\"ppdb\",\"variant\":\"default\"},{\"tipe\":\"kontak\",\"variant\":\"default\"}]"
   },
   {
    "doctype": "Template Situs",
    "name": "modern",
    "key": "modern",
    "nama": "Modern",
    "deskripsi": "Bersih dan modern. Berita & PPDB tampil di depan untuk mendorong pendaftaran.",
    "status": "Aktif",
    "urutan": 2,
    "sections": "hero,berita,ppdb,prestasi,profil,galeri,agenda,kontak",
    "aksen_default": "#0e7490",
    "hero_variant": "centered",
    "radius": "1rem",
    "font_heading": "Plus Jakarta Sans",
    "font_body": "Inter",
    "shadow": "lg",
    "section_style": "flat",
    "default_layout": "[{\"tipe\":\"hero\",\"variant\":\"centered\"},{\"tipe\":\"statistik\",\"variant\":\"row\"},{\"tipe\":\"berita\",\"variant\":\"cards\"},{\"tipe\":\"ppdb\",\"variant\":\"banner\"},{\"tipe\":\"prestasi\",\"variant\":\"default\"},{\"tipe\":\"profil\",\"variant\":\"default\"},{\"tipe\":\"galeri\",\"variant\":\"masonry\"},{\"tipe\":\"kontak\",\"variant\":\"default\"}]"
   },
   {
    "doctype": "Template Situs",
    "name": "ceria",
    "key": "ceria",
    "nama": "Ceria",
    "deskripsi": "Ceria dan ramah anak. Bentuk membulat, galeri & prestasi menonjol. Cocok untuk TK/SD.",
    "status": "Aktif",
    "urutan": 3,
    "sections": "hero,galeri,prestasi,berita,agenda,ppdb,profil,kontak",
    "aksen_default": "#db2777",
    "hero_variant": "playful",
    "radius": "1.5rem",
    "font_heading": "Baloo 2",
    "font_body": "Nunito",
    "shadow": "md",
    "section_style": "card",
    "default_layout": "[{\"tipe\":\"hero\",\"variant\":\"playful\"},{\"tipe\":\"keunggulan\",\"variant\":\"cards\"},{\"tipe\":\"galeri\",\"variant\":\"grid\"},{\"tipe\":\"prestasi\",\"variant\":\"default\"},{\"tipe\":\"testimoni\",\"variant\":\"carousel\"},{\"tipe\":\"berita\",\"variant\":\"cards\"},{\"tipe\":\"ppdb\",\"variant\":\"banner\"},{\"tipe\":\"kontak\",\"variant\":\"default\"}]"
   },
   {
    "doctype": "Template Situs",
    "name": "aurora",
    "key": "aurora",
    "nama": "Aurora",
    "deskripsi": "Hero layar penuh dengan gradien hidup dan kartu lembut. Cocok untuk sekolah unggulan/branding kuat.",
    "status": "Aktif",
    "urutan": 4,
    "sections": "hero,keunggulan,statistik,profil,berita,prestasi,galeri,testimoni,ppdb,kontak",
    "aksen_default": "#7c3aed",
    "hero_variant": "fullbleed",
    "radius": "1.25rem",
    "font_heading": "Sora",
    "font_body": "Inter",
    "shadow": "lg",
    "section_style": "card",
    "default_layout": "[{\"tipe\":\"hero\",\"variant\":\"fullbleed\"},{\"tipe\":\"keunggulan\",\"variant\":\"grid\"},{\"tipe\":\"statistik\",\"variant\":\"row\"},{\"tipe\":\"profil\",\"variant\":\"default\"},{\"tipe\":\"berita\",\"variant\":\"cards\"},{\"tipe\":\"prestasi\",\"variant\":\"default\"},{\"tipe\":\"galeri\",\"variant\":\"masonry\"},{\"tipe\":\"testimoni\",\"variant\":\"carousel\"},{\"tipe\":\"ppdb\",\"variant\":\"banner\"},{\"tipe\":\"kontak\",\"variant\":\"default\"}]"
   }
  ]
  ```

- [ ] **Step 8.4: Re-import fixtures (or migrate) so the rows update.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost migrate
  ```
  Expected: `Syncing fixtures ... Updated Template Situs` lines including `aurora`, exit 0.

- [ ] **Step 8.5: Re-run the fixture test — passes.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_template_fixtures_have_tokens
  ```
  Expected: `Ran 1 test ... OK`.

- [ ] **Step 8.6: Commit.**
  ```
  git commit -am "feat(situs): seed template theme tokens + default_layout, add aurora template"
  ```

---

### Task 9: Verify NO `tenant_registry.py` change is needed (child tables inherit parent scoping)

The four new doctypes (`Situs Layout Block`, `Situs Keunggulan`, `Situs Statistik`, `Situs Testimoni`) are all `istable:1`. They carry no `sekolah`/`organisasi` column and are only reachable through the `Situs Sekolah` parent (already registered at `api/tenant_registry.py:97`), so they MUST NOT be added to `DOCTYPES['SCHOOL']` — exactly as the manajemen-aset child `Item Peminjaman Aset` is deliberately excluded (see the comment block at `tenant_registry.py:105`). `Template Situs` is a global provider catalog (not tenant-scoped) and likewise stays out.

**Files**
- Modify: `api/test_situs.py`

- [ ] **Step 9.1: Add a guard test asserting the new child doctypes are istable and absent from the tenant registry.**
  Add to `SitusTestCase`:
  ```python
  	def test_situs_child_tables_not_in_tenant_registry(self):
  		"""istable children inherit Situs Sekolah scoping — never registered directly."""
  		from sekolahpro.api import tenant_registry

  		children = (
  			"Situs Layout Block", "Situs Keunggulan", "Situs Statistik", "Situs Testimoni",
  		)
  		school_set = set(tenant_registry.DOCTYPES["SCHOOL"])
  		for child in children:
  			self.assertTrue(frappe.get_meta(child).istable, f"{child} must be istable")
  			self.assertNotIn(child, school_set, f"{child} (istable child) must not be tenant-registered")
  		# Parent stays registered; global template catalog stays out.
  		self.assertIn("Situs Sekolah", school_set)
  		self.assertNotIn("Template Situs", school_set)
  ```
  Note: if `tenant_registry.DOCTYPES` is keyed differently than `["SCHOOL"]`, read `api/tenant_registry.py` and adjust the key reference before running — the test should assert against the same collection `Situs Sekolah` lives in (line 97).

- [ ] **Step 9.2: Run it — passes immediately** (no production change; this locks the invariant).
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs --test test_situs_child_tables_not_in_tenant_registry
  ```
  Expected: `Ran 1 test ... OK`.

- [ ] **Step 9.3: Run the FULL Situs suite to confirm all original 16 + 8 new tests are green together.**
  ```
  docker exec frappe-backend-1 bench --site sekolahpro.localhost run-tests --module sekolahpro.api.test_situs
  ```
  Expected: `Ran 24 tests in N.NNNs` / `OK` (16 pre-existing + 8 added across Tasks 2,3,4,5,6,7,8,9), no failures or errors.

- [ ] **Step 9.4: Commit.**
  ```
  git commit -am "test(situs): assert istable children stay out of tenant_registry"
  ```

---

Relevant absolute paths touched in Phase 1:
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/website_sekolah/doctype/situs_sekolah/situs_sekolah.json`
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/website_sekolah/doctype/situs_layout_block/` (new)
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/website_sekolah/doctype/situs_keunggulan/` (new)
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/website_sekolah/doctype/situs_statistik/` (new)
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/website_sekolah/doctype/situs_testimoni/` (new)
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/website_sekolah/doctype/template_situs/template_situs.json`
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/services/situs_content.py`
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/api/situs_admin.py`
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/fixtures/template_situs.json`
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/api/test_situs.py`
- `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro/sekolahpro/api/tenant_registry.py` (READ ONLY — verified, no change)

---

# PHASE 2 — SPA (apps/situs)

I have enough from the SPA side, which is all Phase 2 needs (the spec says the backend payload test is referenced but Phase 2 scope is the SPA). I have all the exact patterns: CSS vars, `useSite()`, `Container`/`SectionHeading`/`ImageOrFallback`, `ifEnabled`, `renderWithSite`, registry shape, demo-site shape. I'll write Phase 2 now.

```markdown
## Phase 2 — SPA Block-Driven Render Engine (`apps/situs`)

Phase 1 (Tasks 1–9) delivered the backend doctypes, `save_situs` child-row replacement, and the `build_site_payload` additions (`layout_blocks`, `keunggulan`, `statistik`, `testimoni`, `theme`, profil hero fields). Phase 2 makes the public SPA (`apps/situs`) render those blocks with modern, theme-driven renderers while keeping the existing 16 tests green.

All paths are absolute under `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/situs`.

Test command: `pnpm --filter @sekolahpro/app-situs test`
Typecheck: `pnpm --filter @sekolahpro/app-situs typecheck`

This phase **uses the `frontend-design` skill** for the visual renderers (Tasks 16, 17): gradient/overlay hero treatments, modern type scale, elevation, motion. Every code step below is complete real code — no `TODO`/`similar to`.

---

### Task 10 — SPA types for blocks, content rows, and theme

- [ ] **Step 10.1: Extend `types.ts` with the block contract.** Edit `src/types.ts`. Add the new interfaces and extend `SiteProfil` + `SiteData`. Insert after the `SiteSocial` interface (around line 23) the block/content types, and add the profil hero fields + SiteData arrays:

  Add the new exported types (place near the top, after `SiteSocial`):
  ```ts
  /** Discriminator for a layout block; mirrors backend Situs Layout Block.tipe. */
  export type BlockType =
    | "hero"
    | "keunggulan"
    | "statistik"
    | "testimoni"
    | "profil"
    | "berita"
    | "agenda"
    | "galeri"
    | "prestasi"
    | "ppdb"
    | "cta"
    | "kontak"
    | "richtext";

  /** One ordered section on the homepage. `variant` selects a renderer skin. */
  export interface LayoutBlock {
    tipe: BlockType;
    variant: string;
    aktif: boolean;
    judul?: string | undefined;
    subjudul?: string | undefined;
    ctaLabel?: string | undefined;
    ctaUrl?: string | undefined;
    /** HTML (Text Editor) for richtext blocks. */
    konten?: string | undefined;
  }

  export interface Keunggulan {
    ikon: string;
    judul: string;
    deskripsi: string;
  }

  export interface Statistik {
    label: string;
    nilai: string;
    satuan?: string | undefined;
  }

  export interface Testimoni {
    nama: string;
    peran?: string | undefined;
    foto?: string | undefined;
    kutipan: string;
  }

  /** Visual tokens sourced from the school's Template Situs record. */
  export interface SiteTheme {
    heroVariant: string;
    radius: string;
    fontHeading: string;
    fontBody: string;
    shadow: string;
    sectionStyle: "card" | "flat" | "bordered";
  }
  ```

- [ ] **Step 10.2: Add the profil hero fields.** In the `SiteProfil` interface, append after `petaEmbed`:
  ```ts
    /** Small uppercase label above the hero title. */
    heroEyebrow?: string | undefined;
    /** Secondary hero CTA label. */
    heroCta2Label?: string | undefined;
    /** Secondary hero CTA url. */
    heroCta2Url?: string | undefined;
  ```

- [ ] **Step 10.3: Extend `SiteData`.** In `SiteData`, after the `nav: NavLink[];` line add:
  ```ts
    /** Ordered homepage blocks; empty => template derives a default layout. */
    layoutBlocks: LayoutBlock[];
    keunggulan: Keunggulan[];
    statistik: Statistik[];
    testimoni: Testimoni[];
    theme: SiteTheme;
  ```

- [ ] **Step 10.4: Typecheck (expected to fail).** Run `pnpm --filter @sekolahpro/app-situs typecheck`. It MUST fail: `demoSite` (data/demo-site.ts) and `mapSite` (lib/site.ts) no longer satisfy `SiteData` (missing `layoutBlocks`, `keunggulan`, `statistik`, `testimoni`, `theme`). This proves the contract is wired. The next tasks make it pass.

- [ ] **Step 10.5: Commit.** `git add apps/situs/src/types.ts && git commit -m "feat(situs): add LayoutBlock/Keunggulan/Statistik/Testimoni/SiteTheme types"`

---

### Task 11 — Block-type + variant constants

- [ ] **Step 11.1: Write the failing constants test.** Create `src/__tests__/blockConstants.test.ts`:
  ```ts
  import { describe, expect, it } from "vitest";
  import { BLOCK_TYPES, HERO_VARIANTS, SECTION_STYLES, DEFAULT_HERO_VARIANT } from "../constants";

  describe("block constants", () => {
    it("declares all 13 block types", () => {
      expect(BLOCK_TYPES).toHaveLength(13);
      expect(BLOCK_TYPES).toContain("hero");
      expect(BLOCK_TYPES).toContain("keunggulan");
      expect(BLOCK_TYPES).toContain("richtext");
    });

    it("declares the four hero variants", () => {
      expect([...HERO_VARIANTS]).toEqual(["split", "centered", "fullbleed", "overlay"]);
      expect(HERO_VARIANTS).toContain(DEFAULT_HERO_VARIANT);
    });

    it("declares the section styles matching the backend Select", () => {
      expect([...SECTION_STYLES]).toEqual(["card", "flat", "bordered"]);
    });
  });
  ```

- [ ] **Step 11.2: Run it (fails).** `pnpm --filter @sekolahpro/app-situs test blockConstants` — fails: exports do not exist.

- [ ] **Step 11.3: Add the constants.** Append to `src/constants.ts` (after `PPDB_JALUR`):
  ```ts
  // Block engine: the ordered set of renderable block types. MUST stay in sync
  // with the backend Situs Layout Block.tipe Select and the SPA BlockType union.
  export const BLOCK_TYPES = [
    "hero",
    "keunggulan",
    "statistik",
    "testimoni",
    "profil",
    "berita",
    "agenda",
    "galeri",
    "prestasi",
    "ppdb",
    "cta",
    "kontak",
    "richtext",
  ] as const;

  // Renderer variants per block type. A block's `variant` selects which
  // registered FC renders it; an unknown variant falls back to the first entry.
  export const HERO_VARIANTS = ["split", "centered", "fullbleed", "overlay"] as const;
  export type HeroVariant = (typeof HERO_VARIANTS)[number];
  export const DEFAULT_HERO_VARIANT: HeroVariant = "split";

  export const KEUNGGULAN_VARIANTS = ["grid", "cards"] as const;
  export const STATISTIK_VARIANTS = ["bar", "tiles"] as const;
  export const TESTIMONI_VARIANTS = ["carousel", "grid"] as const;
  export const CTA_VARIANTS = ["banner", "split"] as const;
  export const DEFAULT_VARIANT = "default";

  // Section chrome style from Template Situs.section_style.
  export const SECTION_STYLES = ["card", "flat", "bordered"] as const;
  export type SectionStyle = (typeof SECTION_STYLES)[number];
  export const DEFAULT_SECTION_STYLE: SectionStyle = "card";
  ```

- [ ] **Step 11.4: Run it (passes).** `pnpm --filter @sekolahpro/app-situs test blockConstants` — green.

- [ ] **Step 11.5: Commit.** `git add apps/situs/src/constants.ts apps/situs/src/__tests__/blockConstants.test.ts && git commit -m "feat(situs): add BLOCK_TYPES + per-type variant constants"`

---

### Task 12 — `mapSite()` maps the new payload fields

- [ ] **Step 12.1: Extend `site.test.ts` with failing assertions.** Add to `src/__tests__/site.test.ts` inside the existing `describe("mapSite", …)`:
  ```ts
  it("maps layout blocks, content rows, theme, and hero extra fields", () => {
    const site = mapSite({
      sekolah: "SMA Nusantara",
      profil: {
        hero_eyebrow: "Sejak 1998",
        hero_cta2_label: "Profil Sekolah",
        hero_cta2_url: "/profil",
      },
      layout_blocks: [
        { tipe: "hero", variant: "overlay", aktif: 1, judul: "Halo" },
        { tipe: "richtext", variant: "default", aktif: 0, konten: "<p>x</p>" },
      ],
      keunggulan: [{ ikon: "award", judul: "Akreditasi A", deskripsi: "Unggul" }],
      statistik: [{ label: "Siswa", nilai: "1200", satuan: "anak" }],
      testimoni: [{ nama: "Budi", peran: "Alumni", kutipan: "Mantap" }],
      theme: {
        hero_variant: "overlay",
        radius: "16px",
        font_heading: "Poppins",
        font_body: "Inter",
        shadow: "0 10px 30px rgba(0,0,0,.2)",
        section_style: "flat",
      },
    });
    expect(site.profil.heroEyebrow).toBe("Sejak 1998");
    expect(site.profil.heroCta2Label).toBe("Profil Sekolah");
    expect(site.profil.heroCta2Url).toBe("/profil");
    expect(site.layoutBlocks).toHaveLength(2);
    expect(site.layoutBlocks[0]).toMatchObject({ tipe: "hero", variant: "overlay", aktif: true, judul: "Halo" });
    expect(site.layoutBlocks[1].aktif).toBe(false);
    expect(site.layoutBlocks[1].konten).toBe("<p>x</p>");
    expect(site.keunggulan).toEqual([{ ikon: "award", judul: "Akreditasi A", deskripsi: "Unggul" }]);
    expect(site.statistik[0]).toMatchObject({ label: "Siswa", nilai: "1200", satuan: "anak" });
    expect(site.testimoni[0]).toMatchObject({ nama: "Budi", peran: "Alumni", kutipan: "Mantap" });
    expect(site.theme).toEqual({
      heroVariant: "overlay",
      radius: "16px",
      fontHeading: "Poppins",
      fontBody: "Inter",
      shadow: "0 10px 30px rgba(0,0,0,.2)",
      sectionStyle: "flat",
    });
  });

  it("defaults theme + empty arrays when payload omits the block fields", () => {
    const site = mapSite({ sekolah: "X" });
    expect(site.layoutBlocks).toEqual([]);
    expect(site.keunggulan).toEqual([]);
    expect(site.statistik).toEqual([]);
    expect(site.testimoni).toEqual([]);
    expect(site.theme.heroVariant).toBe("split");
    expect(site.theme.sectionStyle).toBe("card");
  });

  it("drops blocks with an unknown tipe", () => {
    const site = mapSite({ sekolah: "X", layout_blocks: [{ tipe: "bogus" }, { tipe: "cta" }] });
    expect(site.layoutBlocks.map((b) => b.tipe)).toEqual(["cta"]);
  });
  ```

- [ ] **Step 12.2: Run it (fails).** `pnpm --filter @sekolahpro/app-situs test site` — fails: `mapSite` returns no `layoutBlocks`/`theme`.

- [ ] **Step 12.3: Extend the `ApiSite` shape + add mappers.** In `src/lib/site.ts`, update imports (top of file) to pull the new constants + types:
  ```ts
  import {
    BLOCK_TYPES,
    DEFAULT_HERO_VARIANT,
    DEFAULT_SECTION_STYLE,
    DEFAULT_TEMPLATE,
    DEFAULT_VARIANT,
    SECTION_KEYS,
    SECTION_STYLES,
    type SectionKey,
    type SectionStyle,
    type TemplateKey,
  } from "../constants";
  import { demoSite } from "../data/demo-site";
  import type {
    BlockType,
    Keunggulan,
    LayoutBlock,
    NavLink,
    SiteData,
    SiteTheme,
    Statistik,
    Testimoni,
  } from "../types";
  ```

  Extend the `ApiSite` interface (add fields after `nav?: ApiNav[];`):
  ```ts
    layout_blocks?: Array<Record<string, unknown>>;
    keunggulan?: Array<Record<string, unknown>>;
    statistik?: Array<Record<string, unknown>>;
    testimoni?: Array<Record<string, unknown>>;
    theme?: Record<string, unknown>;
  ```

- [ ] **Step 12.4: Add the row mappers.** Insert these helpers above `export function mapSite` in `src/lib/site.ts`. They are small, pure, and DRY (one coercion path each):
  ```ts
  function str(v: unknown): string {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }
  function optStr(v: unknown): string | undefined {
    const s = str(v);
    return s ? s : undefined;
  }
  function bool(v: unknown): boolean {
    // Frappe Check fields arrive as 0/1; treat undefined as active.
    return v === undefined || v === null ? true : Boolean(typeof v === "number" ? v : v === true || v === "1");
  }

  function mapLayoutBlocks(raw: Array<Record<string, unknown>> | undefined): LayoutBlock[] {
    const allowed = new Set<string>(BLOCK_TYPES);
    return (raw ?? [])
      .filter((b) => allowed.has(str(b.tipe)))
      .map((b) => ({
        tipe: str(b.tipe) as BlockType,
        variant: str(b.variant) || DEFAULT_VARIANT,
        aktif: bool(b.aktif),
        judul: optStr(b.judul),
        subjudul: optStr(b.subjudul),
        ctaLabel: optStr(b.cta_label),
        ctaUrl: optStr(b.cta_url),
        konten: optStr(b.konten),
      }));
  }

  function mapKeunggulan(raw: Array<Record<string, unknown>> | undefined): Keunggulan[] {
    return (raw ?? []).map((k) => ({ ikon: str(k.ikon), judul: str(k.judul), deskripsi: str(k.deskripsi) }));
  }
  function mapStatistik(raw: Array<Record<string, unknown>> | undefined): Statistik[] {
    return (raw ?? []).map((s) => ({ label: str(s.label), nilai: str(s.nilai), satuan: optStr(s.satuan) }));
  }
  function mapTestimoni(raw: Array<Record<string, unknown>> | undefined): Testimoni[] {
    return (raw ?? []).map((t) => ({
      nama: str(t.nama),
      peran: optStr(t.peran),
      foto: optStr(t.foto),
      kutipan: str(t.kutipan),
    }));
  }

  function validSectionStyle(v: unknown): SectionStyle {
    const s = str(v);
    return (SECTION_STYLES as readonly string[]).includes(s) ? (s as SectionStyle) : DEFAULT_SECTION_STYLE;
  }

  function mapTheme(raw: Record<string, unknown> | undefined): SiteTheme {
    const t = raw ?? {};
    return {
      heroVariant: str(t.hero_variant) || DEFAULT_HERO_VARIANT,
      radius: str(t.radius),
      fontHeading: str(t.font_heading),
      fontBody: str(t.font_body),
      shadow: str(t.shadow),
      sectionStyle: validSectionStyle(t.section_style),
    };
  }
  ```

- [ ] **Step 12.5: Wire them into `mapSite`.** In the `profil:` object literal, after `petaEmbed: p.peta_embed ?? "",` add:
  ```ts
        heroEyebrow: p.hero_eyebrow,
        heroCta2Label: p.hero_cta2_label,
        heroCta2Url: p.hero_cta2_url,
  ```
  Then before the closing `};` of the returned object (after `nav: mapNav(raw.nav, sections),`) add:
  ```ts
      layoutBlocks: mapLayoutBlocks(raw.layout_blocks),
      keunggulan: mapKeunggulan(raw.keunggulan),
      statistik: mapStatistik(raw.statistik),
      testimoni: mapTestimoni(raw.testimoni),
      theme: mapTheme(raw.theme),
  ```
  Note: `p` is `Record<string, string>`; widen the `profil` accessor to read the new keys by changing the `ApiSite.profil` type to `Record<string, string | undefined>` (no behavior change — all reads already use `?? ""`).

- [ ] **Step 12.6: Run it (passes).** `pnpm --filter @sekolahpro/app-situs test site` — green. Typecheck still fails only on `demoSite` (fixed in Task 18).

- [ ] **Step 12.7: Commit.** `git add apps/situs/src/lib/site.ts apps/situs/src/__tests__/site.test.ts && git commit -m "feat(situs): mapSite maps layout_blocks/keunggulan/statistik/testimoni/theme + hero fields"`

---

### Task 13 — Theme tokens flow to CSS vars (`theme.ts`)

- [ ] **Step 13.1: Extend `theme.test.ts` with failing assertions.** Add a new `describe` block to `src/__tests__/theme.test.ts`:
  ```ts
  import { computeThemeVars, hexToRgb, readableOn, computeTemplateVars } from "../theme";
  import type { SiteTheme } from "../types";

  describe("computeTemplateVars", () => {
    const full: SiteTheme = {
      heroVariant: "overlay",
      radius: "16px",
      fontHeading: "Poppins",
      fontBody: "Inter",
      shadow: "0 10px 30px rgba(0,0,0,.2)",
      sectionStyle: "flat",
    };

    it("emits CSS vars for every provided token", () => {
      const vars = computeTemplateVars(full);
      expect(vars["--situs-radius"]).toBe("16px");
      expect(vars["--situs-heading-font"]).toBe("Poppins");
      expect(vars["--situs-body-font"]).toBe("Inter");
      expect(vars["--situs-card-shadow"]).toBe("0 10px 30px rgba(0,0,0,.2)");
      expect(vars["--situs-section-style"]).toBe("flat");
    });

    it("omits a var when its token is empty so skins.css remains the fallback", () => {
      const vars = computeTemplateVars({
        heroVariant: "split",
        radius: "",
        fontHeading: "",
        fontBody: "",
        shadow: "",
        sectionStyle: "card",
      });
      expect(vars["--situs-radius"]).toBeUndefined();
      expect(vars["--situs-heading-font"]).toBeUndefined();
      expect(vars["--situs-card-shadow"]).toBeUndefined();
      // sectionStyle is an enum (never empty) so it is always emitted.
      expect(vars["--situs-section-style"]).toBe("card");
    });
  });
  ```

- [ ] **Step 13.2: Run it (fails).** `pnpm --filter @sekolahpro/app-situs test theme` — fails: `computeTemplateVars` undefined.

- [ ] **Step 13.3: Add `computeTemplateVars` + extend `applyTheme`.** Edit `src/theme.ts`. Add the import and the function; widen `applyTheme` to optionally receive a theme:
  ```ts
  import type { SiteBrand, SiteTheme } from "./types";
  ```
  Add after `computeThemeVars`:
  ```ts
  /**
   * Per-school template tokens (radius / fonts / shadow / section style) sourced
   * from Template Situs. Only non-empty tokens are emitted so skins.css keeps
   * supplying the per-template default for any token the school left blank.
   */
  export function computeTemplateVars(theme: SiteTheme): Record<string, string> {
    const vars: Record<string, string> = {};
    if (theme.radius) {
      vars["--situs-radius"] = theme.radius;
      vars["--situs-radius-lg"] = theme.radius;
    }
    if (theme.fontHeading) vars["--situs-heading-font"] = theme.fontHeading;
    if (theme.fontBody) vars["--situs-body-font"] = theme.fontBody;
    if (theme.shadow) vars["--situs-card-shadow"] = theme.shadow;
    // Always present (enum): drives [data-section-style] section chrome.
    vars["--situs-section-style"] = theme.sectionStyle;
    return vars;
  }
  ```
  Change `applyTheme` to take the optional theme and apply both sets:
  ```ts
  export function applyTheme(brand: SiteBrand, theme?: SiteTheme): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(computeThemeVars(brand))) {
      root.style.setProperty(key, value);
    }
    if (theme) {
      for (const [key, value] of Object.entries(computeTemplateVars(theme))) {
        root.style.setProperty(key, value);
      }
    }
  }
  ```

- [ ] **Step 13.4: Pass the theme from `SiteLayout`.** In `src/layout/SiteLayout.tsx`, update the effect in `SiteShell`:
  ```ts
    useEffect(() => {
      applyTheme(site.brand, site.theme);
    }, [site.brand, site.theme]);
  ```

- [ ] **Step 13.5: Add the section-style fallback CSS.** Append to `src/templates/skins.css`:
  ```css
  /* Section chrome override driven by Template Situs.section_style via --situs-section-style.
     Falls back to each template's .situs-card defaults when the var is unset. */
  [data-section-style="flat"] .situs-card {
    border-color: transparent;
    box-shadow: none;
    background: var(--situs-section-soft, #f8fafc);
  }
  [data-section-style="bordered"] .situs-card {
    border: 1px solid var(--situs-border);
    box-shadow: none;
  }
  ```

- [ ] **Step 13.6: Run it (passes).** `pnpm --filter @sekolahpro/app-situs test theme` — green.

- [ ] **Step 13.7: Commit.** `git add apps/situs/src/theme.ts apps/situs/src/layout/SiteLayout.tsx apps/situs/src/templates/skins.css apps/situs/src/__tests__/theme.test.ts && git commit -m "feat(situs): apply Template Situs theme tokens to CSS vars (skins.css fallback)"`

---

### Task 14 — Block renderer registry + `BlockProps`

- [ ] **Step 14.1: Write the failing registry contract test.** Create `src/__tests__/blockRegistry.test.ts`:
  ```ts
  import { describe, expect, it } from "vitest";
  import { BLOCK_TYPES } from "../constants";
  import { blockRegistry, resolveBlockRenderer } from "../templates/blocks/registry";

  describe("block renderer registry contract", () => {
    it("registers at least one renderer for every BLOCK_TYPE", () => {
      for (const tipe of BLOCK_TYPES) {
        const variants = blockRegistry[tipe];
        expect(variants, `missing renderer map for "${tipe}"`).toBeDefined();
        expect(Object.keys(variants).length).toBeGreaterThan(0);
      }
    });

    it("resolves a known variant", () => {
      expect(resolveBlockRenderer("hero", "overlay")).toBe(blockRegistry.hero.overlay);
    });

    it("falls back to the first registered variant for an unknown variant", () => {
      const first = Object.values(blockRegistry.hero)[0];
      expect(resolveBlockRenderer("hero", "does-not-exist")).toBe(first);
    });
  });
  ```

- [ ] **Step 14.2: Run it (fails).** `pnpm --filter @sekolahpro/app-situs test blockRegistry` — fails: module missing.

- [ ] **Step 14.3: Create the registry skeleton.** Create `src/templates/blocks/registry.ts`. Renderers are added in Tasks 15–17; for the first green pass we register thin placeholders that the real renderers replace (each later task swaps its entry):
  ```ts
  // Block renderer registry: maps a BlockType + variant to a React component.
  // Open/closed — adding a block renderer = add a module + one entry here.
  // The contract test (src/__tests__/blockRegistry.test.ts) asserts every
  // BLOCK_TYPE has at least one renderer and that variant fallback works.

  import type { FC } from "react";
  import type { BlockType, LayoutBlock } from "../../types";

  /** Every block renderer receives its own block config. Site data is read
   *  from context via useSite(); the block carries per-block overrides. */
  export interface BlockProps {
    block: LayoutBlock;
  }

  export type BlockRenderer = FC<BlockProps>;

  /** tipe -> (variant -> renderer). The first entry per tipe is the fallback. */
  export type BlockRegistry = Record<BlockType, Record<string, BlockRenderer>>;
  ```
  Then the registry object + resolver. (Imports of the real renderers are appended as each is built — start by importing the ones Phase 1 sections already cover; see Step 17.x. For Step 14 green, stub the not-yet-built ones with a shared no-op so the contract holds.)
  ```ts
  const Empty: BlockRenderer = () => null;

  export const blockRegistry: BlockRegistry = {
    hero: { split: Empty },
    keunggulan: { grid: Empty },
    statistik: { bar: Empty },
    testimoni: { carousel: Empty },
    profil: { default: Empty },
    berita: { default: Empty },
    agenda: { default: Empty },
    galeri: { default: Empty },
    prestasi: { default: Empty },
    ppdb: { default: Empty },
    cta: { banner: Empty },
    kontak: { default: Empty },
    richtext: { default: Empty },
  };

  export function resolveBlockRenderer(tipe: BlockType, variant: string): BlockRenderer {
    const variants = blockRegistry[tipe];
    return variants[variant] ?? Object.values(variants)[0];
  }
  ```

- [ ] **Step 14.4: Run it (passes).** `pnpm --filter @sekolahpro/app-situs test blockRegistry` — green.

- [ ] **Step 14.5: Commit.** `git add apps/situs/src/templates/blocks/registry.ts apps/situs/src/__tests__/blockRegistry.test.ts && git commit -m "feat(situs): block renderer registry + BlockProps + variant fallback"`

---

### Task 15 — Composer drives the homepage from `layoutBlocks`

- [ ] **Step 15.1: Write the failing Composer test.** Create `src/__tests__/composer.test.tsx`:
  ```tsx
  import { afterEach, describe, expect, it } from "vitest";
  import { cleanup, screen } from "@testing-library/react";
  import { Composer } from "../templates/Composer";
  import { demoSite } from "../data/demo-site";
  import type { SiteData } from "../types";
  import { renderWithSite } from "./test-utils";

  afterEach(cleanup);

  function withBlocks(blocks: SiteData["layoutBlocks"]): SiteData {
    return { ...demoSite, layoutBlocks: blocks };
  }

  describe("Composer", () => {
    it("renders blocks in the configured order", () => {
      renderWithSite(
        <Composer />,
        withBlocks([
          { tipe: "richtext", variant: "default", aktif: true, konten: "<p>FIRST</p>" },
          { tipe: "richtext", variant: "default", aktif: true, konten: "<p>SECOND</p>" },
        ]),
      );
      const first = screen.getByText("FIRST");
      const second = screen.getByText("SECOND");
      expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("skips inactive blocks", () => {
      renderWithSite(
        <Composer />,
        withBlocks([
          { tipe: "richtext", variant: "default", aktif: false, konten: "<p>HIDDEN</p>" },
          { tipe: "richtext", variant: "default", aktif: true, konten: "<p>SHOWN</p>" },
        ]),
      );
      expect(screen.queryByText("HIDDEN")).toBeNull();
      expect(screen.getByText("SHOWN")).toBeInTheDocument();
    });

    it("falls back to the template default layout when no blocks are configured", () => {
      // demoSite.templateKey === "klasik" => KlasikHome leads with the Hero.
      renderWithSite(<Composer />, withBlocks([]));
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(demoSite.profil.heroJudul);
    });
  });
  ```
  (`RichTextBlock` is the simplest renderer to assert ordering against; it ships in Task 17. Build the Composer first against it.)

- [ ] **Step 15.2: Run it (fails).** `pnpm --filter @sekolahpro/app-situs test composer` — fails: `Composer` missing.

- [ ] **Step 15.3: Build the Composer.** Create `src/templates/Composer.tsx`:
  ```tsx
  import { Fragment } from "react";
  import { useSite } from "../SiteContext";
  import { getTemplate } from "./registry";
  import { resolveBlockRenderer } from "./blocks/registry";

  /**
   * Block-driven homepage. Renders site.layoutBlocks in order, skipping inactive
   * ones, resolving each to a renderer via the block registry. When a school has
   * no configured blocks we fall back to the chosen template's HomeBody, which is
   * the per-template default layout generator (Klasik/Modern/Ceria).
   */
  export function Composer() {
    const site = useSite();
    const blocks = site.layoutBlocks.filter((b) => b.aktif);

    if (blocks.length === 0) {
      const tpl = getTemplate(site.templateKey);
      return <tpl.HomeBody />;
    }

    return (
      <>
        {blocks.map((block, i) => {
          const Renderer = resolveBlockRenderer(block.tipe, block.variant);
          return (
            <Fragment key={`${block.tipe}-${i}`}>
              <Renderer block={block} />
            </Fragment>
          );
        })}
      </>
    );
  }
  ```

- [ ] **Step 15.4: Point `Home.tsx` at the Composer.** Replace the body of `src/pages/Home.tsx`:
  ```tsx
  import { Composer } from "../templates/Composer";

  /** Homepage: block-driven via Composer, with template HomeBody as the default. */
  export function Home() {
    return <Composer />;
  }
  ```

- [ ] **Step 15.5: Run it.** The order/skip tests need `RichTextBlock`; the fallback test passes now. Proceed to Task 17 to land `RichTextBlock`, then re-run `pnpm --filter @sekolahpro/app-situs test composer` to green all three. (If sequencing strictly, move the order/skip assertions into Task 17's step and keep only the fallback assertion here.)

- [ ] **Step 15.6: Commit.** `git add apps/situs/src/templates/Composer.tsx apps/situs/src/pages/Home.tsx apps/situs/src/__tests__/composer.test.tsx && git commit -m "feat(situs): Composer renders ordered layout blocks, template HomeBody fallback"`

---

### Task 16 — Modern `HeroBlock` (4 variants)

Uses the **`frontend-design` skill** for the hero treatments: gradient + overlay, generous type scale, dual-CTA hierarchy, subtle motion via `.situs-rise`. All color comes from `--situs-brand*` vars; radius/shadow from the Task 13 tokens.

- [ ] **Step 16.1: Write the failing render test.** Create `src/__tests__/heroBlock.test.tsx`:
  ```tsx
  import { afterEach, describe, expect, it } from "vitest";
  import { cleanup, screen } from "@testing-library/react";
  import { HERO_VARIANTS } from "../constants";
  import { HeroBlock } from "../templates/blocks/HeroBlock";
  import { demoSite } from "../data/demo-site";
  import type { LayoutBlock, SiteData } from "../types";
  import { renderWithSite } from "./test-utils";

  afterEach(cleanup);

  const site: SiteData = {
    ...demoSite,
    profil: {
      ...demoSite.profil,
      heroEyebrow: "Sejak 1998",
      heroCta2Label: "Profil Sekolah",
      heroCta2Url: "/profil",
    },
  };

  function block(variant: string): LayoutBlock {
    return { tipe: "hero", variant, aktif: true };
  }

  describe("HeroBlock", () => {
    for (const v of HERO_VARIANTS) {
      it(`renders title, primary + secondary CTA for the "${v}" variant`, () => {
        renderWithSite(<HeroBlock block={block(v)} />, site);
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.profil.heroJudul);
        expect(screen.getByRole("link", { name: site.profil.heroCtaLabel })).toHaveAttribute("href", "/ppdb");
        expect(screen.getByRole("link", { name: "Profil Sekolah" })).toHaveAttribute("href", "/profil");
      });
    }

    it("uses the block judul/subjudul/cta overrides when present", () => {
      renderWithSite(
        <HeroBlock block={{ tipe: "hero", variant: "split", aktif: true, judul: "Override", ctaLabel: "Daftar", ctaUrl: "/x" }} />,
        site,
      );
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Override");
      expect(screen.getByRole("link", { name: "Daftar" })).toHaveAttribute("href", "/x");
    });

    it("shows the eyebrow label", () => {
      renderWithSite(<HeroBlock block={block("overlay")} />, site);
      expect(screen.getByText("Sejak 1998")).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 16.2: Run it (fails).** `pnpm --filter @sekolahpro/app-situs test heroBlock` — fails: module missing.

- [ ] **Step 16.3: Build `HeroBlock`.** Create `src/templates/blocks/HeroBlock.tsx`. Block overrides win over profil; CTAs render through a shared helper (DRY):
  ```tsx
  import { Link } from "react-router-dom";
  import { useSite } from "../../SiteContext";
  import { DEFAULT_HERO_VARIANT, type HeroVariant } from "../../constants";
  import { Container } from "../../sections/primitives";
  import type { BlockProps } from "./registry";

  function HeroCtas({ primaryLabel, primaryUrl, secondaryLabel, secondaryUrl, center }: {
    primaryLabel: string;
    primaryUrl: string;
    secondaryLabel?: string | undefined;
    secondaryUrl?: string | undefined;
    center?: boolean;
  }) {
    return (
      <div className={`mt-7 flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
        <Link to={primaryUrl} className="situs-brand-bg situs-round px-7 py-3 text-sm font-semibold shadow-lg transition hover:brightness-110">
          {primaryLabel}
        </Link>
        {secondaryLabel ? (
          <Link
            to={secondaryUrl || "/profil"}
            className="situs-round border px-7 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/10"
            style={{ borderColor: "var(--situs-border)", color: "var(--situs-ink)" }}
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    );
  }

  export function HeroBlock({ block }: BlockProps) {
    const site = useSite();
    const p = site.profil;
    const eyebrow = block.judul ? block.subjudul : p.heroEyebrow ?? p.tagline;
    const judul = block.judul || p.heroJudul;
    const subjudul = block.subjudul || p.heroSubjudul;
    const primaryLabel = block.ctaLabel || p.heroCtaLabel || "Informasi PPDB";
    const primaryUrl = block.ctaUrl || p.heroCtaUrl || "/ppdb";
    const secondaryLabel = p.heroCta2Label;
    const secondaryUrl = p.heroCta2Url;
    const variant = (block.variant as HeroVariant) || DEFAULT_HERO_VARIANT;
    const img = site.brand.heroImage;

    const eyebrowNode = eyebrow ? (
      <p className="situs-brand-text text-sm font-semibold uppercase tracking-[0.2em]">{eyebrow}</p>
    ) : null;

    if (variant === "centered") {
      return (
        <section className="situs-section situs-soft-bg overflow-hidden">
          <Container className="situs-rise mx-auto max-w-3xl text-center">
            {eyebrowNode}
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl" style={{ color: "var(--situs-ink)" }}>
              {judul}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg" style={{ color: "var(--situs-muted)" }}>{subjudul}</p>
            <HeroCtas primaryLabel={primaryLabel} primaryUrl={primaryUrl} secondaryLabel={secondaryLabel} secondaryUrl={secondaryUrl} center />
          </Container>
        </section>
      );
    }

    if (variant === "fullbleed") {
      return (
        <section className="situs-section relative isolate overflow-hidden" style={{ background: "linear-gradient(135deg, var(--situs-brand) 0%, var(--situs-brand-2) 100%)" }}>
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full opacity-30" style={{ background: "rgba(255,255,255,0.25)", filter: "blur(40px)" }} />
          <Container className="situs-rise relative max-w-3xl" >
            {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--situs-brand-fg)" }}>{eyebrow}</p> : null}
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl" style={{ color: "var(--situs-brand-fg)" }}>{judul}</h1>
            <p className="mt-5 max-w-2xl text-lg" style={{ color: "var(--situs-brand-fg)", opacity: 0.9 }}>{subjudul}</p>
            <HeroCtas primaryLabel={primaryLabel} primaryUrl={primaryUrl} secondaryLabel={secondaryLabel} secondaryUrl={secondaryUrl} />
          </Container>
        </section>
      );
    }

    if (variant === "overlay") {
      return (
        <section className="situs-section relative isolate flex min-h-[60vh] items-center overflow-hidden">
          {img ? <img src={img} alt={site.nama} className="absolute inset-0 -z-10 h-full w-full object-cover" /> : <div className="absolute inset-0 -z-10 situs-brand-bg" />}
          <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 100%)" }} />
          <Container className="situs-rise max-w-3xl">
            {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">{eyebrow}</p> : null}
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">{judul}</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">{subjudul}</p>
            <HeroCtas primaryLabel={primaryLabel} primaryUrl={primaryUrl} secondaryLabel={secondaryLabel} secondaryUrl={secondaryUrl} />
          </Container>
        </section>
      );
    }

    // split (default): copy left, branded media right.
    return (
      <section className="situs-section situs-soft-bg overflow-hidden">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="situs-rise">
            {eyebrowNode}
            <h1 className="mt-3 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl" style={{ color: "var(--situs-ink)" }}>{judul}</h1>
            <p className="mt-5 text-lg" style={{ color: "var(--situs-muted)" }}>{subjudul}</p>
            <HeroCtas primaryLabel={primaryLabel} primaryUrl={primaryUrl} secondaryLabel={secondaryLabel} secondaryUrl={secondaryUrl} />
          </div>
          <div className="situs-round-lg relative aspect-[4/3] w-full overflow-hidden shadow-2xl" style={{ background: "linear-gradient(135deg, rgba(var(--situs-brand-rgb),0.15), rgba(var(--situs-brand-rgb),0.04))" }}>
            {img ? (
              <img src={img} alt={site.nama} className="h-full w-full object-cover" />
            ) : (
              <div className="situs-brand-bg flex h-full w-full items-center justify-center">
                <span className="font-display text-7xl font-bold opacity-80">{site.nama.slice(0, 1)}</span>
              </div>
            )}
          </div>
        </Container>
      </section>
    );
  }
  ```

- [ ] **Step 16.4: Register the hero variants.** In `src/templates/blocks/registry.ts`, import `HeroBlock` and replace the `hero` entry so all four variants resolve to it:
  ```ts
  import { HeroBlock } from "./HeroBlock";
  // …
    hero: { split: HeroBlock, centered: HeroBlock, fullbleed: HeroBlock, overlay: HeroBlock },
  ```

- [ ] **Step 16.5: Run it (passes).** `pnpm --filter @sekolahpro/app-situs test heroBlock` — green.

- [ ] **Step 16.6: Commit.** `git add apps/situs/src/templates/blocks/HeroBlock.tsx apps/situs/src/templates/blocks/registry.ts apps/situs/src/__tests__/heroBlock.test.tsx && git commit -m "feat(situs): modern HeroBlock with split/centered/fullbleed/overlay variants"`

---

### Task 17 — Content blocks + wrapping existing sections

Uses the **`frontend-design` skill** for `KeunggulanBlock`/`StatistikBlock`/`TestimoniBlock`/`CtaBlock`. The Berita/Agenda/Galeri/Prestasi/Profil/Ppdb/Kontak renderers are thin adapters around the Phase 1 section components (no duplication).

- [ ] **Step 17.1: Write the failing content-block test.** Create `src/__tests__/contentBlocks.test.tsx`:
  ```tsx
  import { afterEach, describe, expect, it } from "vitest";
  import { cleanup, screen } from "@testing-library/react";
  import { KeunggulanBlock } from "../templates/blocks/KeunggulanBlock";
  import { StatistikBlock } from "../templates/blocks/StatistikBlock";
  import { TestimoniBlock } from "../templates/blocks/TestimoniBlock";
  import { CtaBlock } from "../templates/blocks/CtaBlock";
  import { RichTextBlock } from "../templates/blocks/RichTextBlock";
  import { demoSite } from "../data/demo-site";
  import type { LayoutBlock, SiteData } from "../types";
  import { renderWithSite } from "./test-utils";

  afterEach(cleanup);

  const site: SiteData = {
    ...demoSite,
    keunggulan: [{ ikon: "award", judul: "Akreditasi A", deskripsi: "Unggul" }],
    statistik: [{ label: "Siswa", nilai: "1200", satuan: "anak" }],
    testimoni: [{ nama: "Budi", peran: "Alumni", kutipan: "Sekolah terbaik" }],
  };
  const b = (over: Partial<LayoutBlock> = {}): LayoutBlock => ({ tipe: "keunggulan", variant: "default", aktif: true, ...over });

  describe("content blocks", () => {
    it("KeunggulanBlock renders each keunggulan row", () => {
      renderWithSite(<KeunggulanBlock block={b({ judul: "Mengapa Kami" })} />, site);
      expect(screen.getByText("Akreditasi A")).toBeInTheDocument();
      expect(screen.getByText("Unggul")).toBeInTheDocument();
    });

    it("StatistikBlock renders value + label + satuan", () => {
      renderWithSite(<StatistikBlock block={b({ tipe: "statistik" })} />, site);
      expect(screen.getByText("1200")).toBeInTheDocument();
      expect(screen.getByText("Siswa")).toBeInTheDocument();
      expect(screen.getByText(/anak/)).toBeInTheDocument();
    });

    it("TestimoniBlock renders the quote + name", () => {
      renderWithSite(<TestimoniBlock block={b({ tipe: "testimoni" })} />, site);
      expect(screen.getByText(/Sekolah terbaik/)).toBeInTheDocument();
      expect(screen.getByText("Budi")).toBeInTheDocument();
    });

    it("CtaBlock renders a heading + CTA link", () => {
      renderWithSite(<CtaBlock block={b({ tipe: "cta", judul: "Ayo Daftar", ctaLabel: "Daftar", ctaUrl: "/ppdb" })} />, site);
      expect(screen.getByText("Ayo Daftar")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Daftar" })).toHaveAttribute("href", "/ppdb");
    });

    it("RichTextBlock renders sanitized HTML konten", () => {
      renderWithSite(<RichTextBlock block={b({ tipe: "richtext", konten: "<p>Halo Dunia</p>" })} />, site);
      expect(screen.getByText("Halo Dunia")).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 17.2: Run it (fails).** `pnpm --filter @sekolahpro/app-situs test contentBlocks` — fails: modules missing.

- [ ] **Step 17.3: Build `RichTextBlock`** (Composer order/skip tests depend on it). Create `src/templates/blocks/RichTextBlock.tsx`:
  ```tsx
  import { useSite } from "../../SiteContext";
  import { Container, SectionHeading } from "../../sections/primitives";
  import { RichText } from "../../sections/RichText";
  import type { BlockProps } from "./registry";

  export function RichTextBlock({ block }: BlockProps) {
    if (!block.konten) return null;
    return (
      <section className="situs-section">
        <Container>
          {block.judul ? <SectionHeading title={block.judul} lead={block.subjudul} /> : null}
          <RichText html={block.konten} className="situs-prose mt-5 max-w-3xl" />
        </Container>
      </section>
    );
  }
  ```

- [ ] **Step 17.4: Build `KeunggulanBlock`.** Create `src/templates/blocks/KeunggulanBlock.tsx`:
  ```tsx
  import { useSite } from "../../SiteContext";
  import { Container, SectionHeading } from "../../sections/primitives";
  import type { BlockProps } from "./registry";

  export function KeunggulanBlock({ block }: BlockProps) {
    const { keunggulan } = useSite();
    if (!keunggulan.length) return null;
    return (
      <section className="situs-section">
        <Container>
          <SectionHeading eyebrow={block.subjudul ?? "Keunggulan"} title={block.judul || "Mengapa Memilih Kami"} align="center" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {keunggulan.map((k, i) => (
              <div key={`${k.judul}-${i}`} className="situs-card situs-round-lg p-6 transition hover:-translate-y-1">
                <div className="situs-brand-soft situs-brand-text mb-4 flex h-12 w-12 items-center justify-center situs-round-lg text-xl font-bold">
                  {k.ikon ? <span aria-hidden>{k.ikon.slice(0, 2)}</span> : <span aria-hidden>★</span>}
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--situs-ink)" }}>{k.judul}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--situs-muted)" }}>{k.deskripsi}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }
  ```

- [ ] **Step 17.5: Build `StatistikBlock`.** Create `src/templates/blocks/StatistikBlock.tsx`:
  ```tsx
  import { useSite } from "../../SiteContext";
  import { Container } from "../../sections/primitives";
  import type { BlockProps } from "./registry";

  export function StatistikBlock({ block }: BlockProps) {
    const { statistik } = useSite();
    if (!statistik.length) return null;
    return (
      <section className="situs-section" style={{ background: "linear-gradient(135deg, var(--situs-brand) 0%, var(--situs-brand-2) 100%)" }}>
        <Container>
          {block.judul ? <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl" style={{ color: "var(--situs-brand-fg)" }}>{block.judul}</h2> : null}
          <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
            {statistik.map((s, i) => (
              <div key={`${s.label}-${i}`}>
                <div className="text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--situs-brand-fg)" }}>
                  {s.nilai}
                  {s.satuan ? <span className="ml-1 text-xl font-semibold opacity-80">{s.satuan}</span> : null}
                </div>
                <div className="mt-2 text-sm font-medium uppercase tracking-wide" style={{ color: "var(--situs-brand-fg)", opacity: 0.85 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }
  ```

- [ ] **Step 17.6: Build `TestimoniBlock`.** Create `src/templates/blocks/TestimoniBlock.tsx`:
  ```tsx
  import { useSite } from "../../SiteContext";
  import { Container, ImageOrFallback, SectionHeading } from "../../sections/primitives";
  import type { BlockProps } from "./registry";

  export function TestimoniBlock({ block }: BlockProps) {
    const { testimoni } = useSite();
    if (!testimoni.length) return null;
    return (
      <section className="situs-section situs-soft-bg">
        <Container>
          <SectionHeading eyebrow={block.subjudul ?? "Testimoni"} title={block.judul || "Apa Kata Mereka"} align="center" />
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimoni.map((t, i) => (
              <figure key={`${t.nama}-${i}`} className="situs-card situs-round-lg flex flex-col p-6">
                <blockquote className="flex-1 text-base italic leading-relaxed" style={{ color: "var(--situs-ink)" }}>“{t.kutipan}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-full">
                    <ImageOrFallback src={t.foto} alt={t.nama} label={t.nama} ratio="aspect-square" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--situs-ink)" }}>{t.nama}</div>
                    {t.peran ? <div className="text-xs" style={{ color: "var(--situs-muted)" }}>{t.peran}</div> : null}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>
    );
  }
  ```

- [ ] **Step 17.7: Build `CtaBlock`.** Create `src/templates/blocks/CtaBlock.tsx`:
  ```tsx
  import { Link } from "react-router-dom";
  import { useSite } from "../../SiteContext";
  import { Container } from "../../sections/primitives";
  import type { BlockProps } from "./registry";

  export function CtaBlock({ block }: BlockProps) {
    const site = useSite();
    const judul = block.judul || `Bergabung dengan ${site.nama}`;
    const label = block.ctaLabel || site.profil.heroCtaLabel || "Informasi PPDB";
    const url = block.ctaUrl || site.profil.heroCtaUrl || "/ppdb";
    return (
      <section className="situs-section">
        <Container>
          <div className="situs-round-lg relative overflow-hidden p-10 text-center shadow-2xl sm:p-14" style={{ background: "linear-gradient(135deg, var(--situs-brand) 0%, var(--situs-brand-2) 100%)" }}>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--situs-brand-fg)" }}>{judul}</h2>
            {block.subjudul ? <p className="mx-auto mt-3 max-w-xl text-base" style={{ color: "var(--situs-brand-fg)", opacity: 0.9 }}>{block.subjudul}</p> : null}
            <Link to={url} className="mt-7 inline-block situs-round bg-white px-8 py-3 text-sm font-bold shadow-lg transition hover:brightness-95" style={{ color: "var(--situs-brand)" }}>
              {label}
            </Link>
          </div>
        </Container>
      </section>
    );
  }
  ```

- [ ] **Step 17.8: Build the section adapters.** Create `src/templates/blocks/sectionBlocks.tsx`. These wrap the Phase 1 components so existing sections render inside the block engine without duplicating their markup. `ProfilSection` accepts `full`; the others accept no block-driven props, so the adapters ignore `block`:
  ```tsx
  import { AgendaPreview } from "../../sections/AgendaPreview";
  import { BeritaPreview } from "../../sections/BeritaPreview";
  import { GaleriPreview } from "../../sections/GaleriPreview";
  import { KontakSection } from "../../sections/KontakSection";
  import { PpdbPreview } from "../../sections/PpdbPreview";
  import { PrestasiPreview } from "../../sections/PrestasiPreview";
  import { ProfilSection } from "../../sections/ProfilSection";
  import type { BlockProps } from "./registry";

  /* eslint-disable @typescript-eslint/no-unused-vars -- block reserved for future per-block overrides */
  export const BeritaBlock = (_: BlockProps) => <BeritaPreview />;
  export const AgendaBlock = (_: BlockProps) => <AgendaPreview />;
  export const GaleriBlock = (_: BlockProps) => <GaleriPreview />;
  export const PrestasiBlock = (_: BlockProps) => <PrestasiPreview />;
  export const ProfilBlock = (_: BlockProps) => <ProfilSection />;
  export const PpdbBlock = (_: BlockProps) => <PpdbPreview />;
  export const KontakBlock = (_: BlockProps) => <KontakSection />;
  ```

- [ ] **Step 17.9: Wire all renderers into the registry.** Replace the placeholder `blockRegistry` object in `src/templates/blocks/registry.ts` (remove the `Empty` no-op) with the real renderers:
  ```ts
  import { HeroBlock } from "./HeroBlock";
  import { KeunggulanBlock } from "./KeunggulanBlock";
  import { StatistikBlock } from "./StatistikBlock";
  import { TestimoniBlock } from "./TestimoniBlock";
  import { CtaBlock } from "./CtaBlock";
  import { RichTextBlock } from "./RichTextBlock";
  import { AgendaBlock, BeritaBlock, GaleriBlock, KontakBlock, PpdbBlock, PrestasiBlock, ProfilBlock } from "./sectionBlocks";

  export const blockRegistry: BlockRegistry = {
    hero: { split: HeroBlock, centered: HeroBlock, fullbleed: HeroBlock, overlay: HeroBlock },
    keunggulan: { grid: KeunggulanBlock, cards: KeunggulanBlock, default: KeunggulanBlock },
    statistik: { bar: StatistikBlock, tiles: StatistikBlock, default: StatistikBlock },
    testimoni: { carousel: TestimoniBlock, grid: TestimoniBlock, default: TestimoniBlock },
    profil: { default: ProfilBlock },
    berita: { default: BeritaBlock },
    agenda: { default: AgendaBlock },
    galeri: { default: GaleriBlock },
    prestasi: { default: PrestasiBlock },
    ppdb: { default: PpdbBlock },
    cta: { banner: CtaBlock, split: CtaBlock, default: CtaBlock },
    kontak: { default: KontakBlock },
    richtext: { default: RichTextBlock },
  };
  ```

- [ ] **Step 17.10: Run the suites.** `pnpm --filter @sekolahpro/app-situs test contentBlocks composer blockRegistry` — all green (Composer order/skip now pass via `RichTextBlock`).

- [ ] **Step 17.11: Commit.** `git add apps/situs/src/templates/blocks apps/situs/src/__tests__/contentBlocks.test.tsx && git commit -m "feat(situs): Keunggulan/Statistik/Testimoni/Cta/RichText blocks + section adapters wired into registry"`

---

### Task 18 — Demo data: modern blocks + theme (offline `:5184`)

- [ ] **Step 18.1: Write the failing demo-data test.** Create `src/__tests__/demoSite.test.ts`:
  ```ts
  import { describe, expect, it } from "vitest";
  import { BLOCK_TYPES, SECTION_STYLES } from "../constants";
  import { demoSite } from "../data/demo-site";

  describe("demoSite block layout", () => {
    it("ships an ordered layout starting with a hero block", () => {
      expect(demoSite.layoutBlocks.length).toBeGreaterThan(3);
      expect(demoSite.layoutBlocks[0].tipe).toBe("hero");
    });
    it("only uses known block types", () => {
      const allowed = new Set<string>(BLOCK_TYPES);
      for (const b of demoSite.layoutBlocks) expect(allowed.has(b.tipe)).toBe(true);
    });
    it("ships keunggulan, statistik, testimoni content + a theme", () => {
      expect(demoSite.keunggulan.length).toBeGreaterThan(0);
      expect(demoSite.statistik.length).toBeGreaterThan(0);
      expect(demoSite.testimoni.length).toBeGreaterThan(0);
      expect(SECTION_STYLES).toContain(demoSite.theme.sectionStyle);
    });
  });
  ```

- [ ] **Step 18.2: Run it (fails).** `pnpm --filter @sekolahpro/app-situs test demoSite` — fails: fields missing (and typecheck still red from Task 10).

- [ ] **Step 18.3: Extend `demoSite`.** In `src/data/demo-site.ts`: import the new types, add the profil hero extras, and append the block/content/theme fields. Update the import block:
  ```ts
  import type {
    Agenda,
    Berita,
    Galeri,
    Halaman,
    Keunggulan,
    LayoutBlock,
    PpdbInfo,
    Prestasi,
    SiteData,
    SiteTheme,
    Statistik,
    Testimoni,
  } from "../types";
  ```
  In `demoSite.profil`, after `petaEmbed: "",` add:
  ```ts
      heroEyebrow: "Sekolah Berakreditasi A · Sejak 1998",
      heroCta2Label: "Profil Sekolah",
      heroCta2Url: "/profil",
  ```
  Before the closing `isDemo: true,` of `demoSite`, add the new fields:
  ```ts
    layoutBlocks: [
      { tipe: "hero", variant: "split", aktif: true },
      { tipe: "statistik", variant: "bar", aktif: true, judul: "SMP Pelita Bangsa dalam Angka" },
      { tipe: "keunggulan", variant: "grid", aktif: true, judul: "Mengapa Memilih Kami", subjudul: "Keunggulan" },
      { tipe: "berita", variant: "default", aktif: true },
      { tipe: "prestasi", variant: "default", aktif: true },
      { tipe: "testimoni", variant: "grid", aktif: true, judul: "Apa Kata Mereka", subjudul: "Testimoni" },
      { tipe: "galeri", variant: "default", aktif: true },
      { tipe: "profil", variant: "default", aktif: true },
      { tipe: "cta", variant: "banner", aktif: true, judul: "Siap Bergabung Tahun Ajaran 2026/2027?", subjudul: "Daftar sekarang, kuota terbatas.", ctaLabel: "Daftar PPDB", ctaUrl: "/ppdb" },
    ] satisfies LayoutBlock[],
    keunggulan: [
      { ikon: "📚", judul: "Kurikulum Merdeka", deskripsi: "Pembelajaran aktif, kreatif, dan berpusat pada peserta didik." },
      { ikon: "🏆", judul: "Berprestasi", deskripsi: "Puluhan prestasi akademik dan non-akademik tingkat kota hingga nasional." },
      { ikon: "💻", judul: "Fasilitas Modern", deskripsi: "Lab komputer & IPA, perpustakaan digital, dan ruang kelas ber-AC." },
      { ikon: "🤝", judul: "Pembinaan Karakter", deskripsi: "Penanaman akhlak dan budi pekerti dalam setiap kegiatan." },
    ] satisfies Keunggulan[],
    statistik: [
      { label: "Peserta Didik", nilai: "1.200", satuan: "+" },
      { label: "Guru & Staf", nilai: "84" },
      { label: "Tahun Pengalaman", nilai: "27" },
      { label: "Akreditasi", nilai: "A" },
    ] satisfies Statistik[],
    testimoni: [
      { nama: "Ahmad Fauzan", peran: "Alumni 2023", foto: "", kutipan: "Guru-gurunya sangat suportif. Saya merasa siap menghadapi jenjang berikutnya." },
      { nama: "Ibu Ratna", peran: "Orang Tua Siswa", foto: "", kutipan: "Komunikasi sekolah dengan orang tua sangat baik dan anak saya berkembang pesat." },
      { nama: "Khadijah Salsabila", peran: "Siswa Kelas 9", foto: "", kutipan: "Banyak ekstrakurikuler seru dan fasilitasnya lengkap. Belajar jadi menyenangkan." },
    ] satisfies Testimoni[],
    theme: {
      heroVariant: "split",
      radius: "14px",
      fontHeading: "",
      fontBody: "",
      shadow: "0 18px 40px -28px rgba(15, 23, 42, 0.45)",
      sectionStyle: "card",
    } satisfies SiteTheme,
  ```

- [ ] **Step 18.4: Run it (passes) + full typecheck.** `pnpm --filter @sekolahpro/app-situs test demoSite` — green. Then `pnpm --filter @sekolahpro/app-situs typecheck` — now passes (the Task 10 contract gaps are closed).

- [ ] **Step 18.5: Commit.** `git add apps/situs/src/data/demo-site.ts apps/situs/src/__tests__/demoSite.test.ts && git commit -m "feat(situs): demo layout blocks + keunggulan/statistik/testimoni + theme for offline preview"`

---

### Task 19 — Keep the 16 existing tests green + full sweep

- [ ] **Step 19.1: Run the whole suite.** `pnpm --filter @sekolahpro/app-situs test`. Expected: the 16 pre-existing tests still pass alongside the new ones. Two pre-existing files need attention:
  - `render.test.tsx` — `"renders the demo school once resolved"` mounts `<App/>`, whose homepage is now the Composer. Because `demoSite.layoutBlocks` is non-empty (Task 18), the homepage renders block-driven. The assertion `screen.getAllByText(demoSite.nama)` is satisfied by `Nav`/`Footer` (unchanged), so it stays green. No edit needed; if it flakes, assert on `demoSite.profil.heroJudul` (rendered by `HeroBlock`) instead.
  - `contract.test.ts` (template registry) — unchanged: `TEMPLATE_REGISTRY` keys still equal `TEMPLATE_KEYS`. The new **block** registry has its own contract test (`blockRegistry.test.ts`); do not merge them.

- [ ] **Step 19.2: Add the block-registry contract guard against `BLOCK_TYPES` drift.** (Already covered by Task 14's test — confirm it runs in the full sweep. No new code.)

- [ ] **Step 19.3: If `render.test.tsx` regresses, apply this minimal fix.** Change the offline assertion to target the hero rendered by the Composer:
  ```tsx
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(demoSite.profil.heroJudul);
    });
  ```
  Commit separately only if applied: `git commit -m "test(situs): assert hero heading on offline render (Composer-driven home)"`

- [ ] **Step 19.4: Typecheck + final commit.** `pnpm --filter @sekolahpro/app-situs typecheck` (0 errors) and `pnpm --filter @sekolahpro/app-situs test` (all green). If any incidental fixes were made: `git add -p && git commit -m "chore(situs): close out block engine phase 2"`.
```

Phase 2 markdown delivered above. Key facts I verified against the real source so the plan matches exact patterns:

- `applyTheme(brand)` is currently single-arg and called from `SiteLayout.tsx` `SiteShell` effect — Task 13 widens it to `applyTheme(brand, theme?)`.
- CSS vars `--situs-radius`, `--situs-heading-font`, `--situs-body-font`, `--situs-card-shadow`, `--situs-section-soft` are real and set per-template in `skins.css`; `--situs-section-style` is new.
- `Home.tsx` currently does `getTemplate(site.templateKey)` → `<tpl.HomeBody/>`; Task 15 swaps to `<Composer/>` and the Composer keeps `HomeBody` as the empty-layout fallback.
- `renderWithSite(ui, site=demoSite)` and `renderApp` exist in `test-utils.tsx`; tests use them as-is. Vitest uses non-global RTL in some files, so the new `.tsx` test files include `afterEach(cleanup)` (matches the documented RTL-cleanup-leak memory).
- Section components wrapped as adapters take no block props (`AgendaPreview({limit=4})`, `PpdbPreview()`, `KontakSection()`, etc.), so adapters ignore `block` — no markup duplication.
- `mapSite` returns object literal; new fields appended before closing brace; `p`/`b`/`c`/`m`/`s` accessor pattern preserved. Frappe `Check` → 0/1 handled by `bool()` (undefined ⇒ active).

One sequencing caveat flagged inline: Task 15's order/skip Composer assertions depend on `RichTextBlock` (built in Task 17.3), so the plan notes either run them after 17.3 or keep only the fallback assertion in Task 15. The build_site_payload backend test is Phase-1 scope (not re-drafted here per the Phase 2 boundary).

---

# PHASE 3 — CMS (apps/school)

I have all the patterns I need. The route test pattern mocks `@tanstack/react-router` (`createFileRoute`, `useParams`, `Link`) and exports a named Page component for direct rendering. The situs routes currently use `Route.useParams()` inline, so I'll have Phase 3 routes export a named Page component taking `sekolah` as a prop (Route→Page→View) to make them testable, matching the ppdb pattern. `globals: false` confirmed → every test file needs `afterEach(cleanup)`.

Now I'll write Phase 3.

─────────────────────────────────────────────────────

### Task 20: Extend `SitusDoc` with new parent fields + child-array row types

- [ ] **Step 20.1: Write failing type-contract test for the new `SitusDoc` shape**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/data/__tests__/situs-types.test.ts`:
  ```ts
  // Compile-time + runtime contract: SitusDoc carries the Phase-3 fields the CMS edits.
  import { describe, it, expect } from "vitest";
  import type {
    SitusDoc,
    LayoutBlockRow,
    KeunggulanRow,
    StatistikRow,
    TestimoniRow,
  } from "../situs";

  describe("SitusDoc Phase-3 shape", () => {
    it("accepts hero secondary fields + child arrays", () => {
      const block: LayoutBlockRow = { tipe: "hero", variant: "split", aktif: 1 };
      const keunggulan: KeunggulanRow = { ikon: "shield", judul: "Aman", deskripsi: "CCTV 24 jam" };
      const statistik: StatistikRow = { label: "Siswa", nilai: "1200", satuan: "anak" };
      const testimoni: TestimoniRow = { nama: "Budi", peran: "Wali", foto: "", kutipan: "Bagus" };
      const doc: Partial<SitusDoc> = {
        hero_eyebrow: "Selamat datang",
        hero_cta2_label: "Hubungi Kami",
        hero_cta2_url: "/kontak",
        layout_blocks: [block],
        keunggulan: [keunggulan],
        statistik: [statistik],
        testimoni: [testimoni],
      };
      expect(doc.layout_blocks).toHaveLength(1);
      expect(doc.keunggulan?.[0].judul).toBe("Aman");
      expect(doc.statistik?.[0].nilai).toBe("1200");
      expect(doc.testimoni?.[0].kutipan).toBe("Bagus");
    });
  });
  ```

- [ ] **Step 20.2: Run it — fails (types not exported yet)**
  `pnpm --filter @sekolahpro/app-school test -- src/data/__tests__/situs-types.test.ts`
  Expected: `FAIL ... Module '"../situs"' has no exported member 'LayoutBlockRow'.` (tsc/transform error).

- [ ] **Step 20.3: Add row types + extend `SitusDoc` in `data/situs.ts`**
  In `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/data/situs.ts`, insert the row types immediately above `export interface SitusDoc {`:
  ```ts
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
  ```
  Then add the new fields inside `SitusDoc`, directly after the `hero_cta_url: string | null;` line (line 32):
  ```ts
    hero_eyebrow: string | null;
    hero_cta2_label: string | null;
    hero_cta2_url: string | null;
  ```
  And add the four child arrays directly after the `og_image: string | null;` line (last field, line 53), before the closing brace:
  ```ts
    layout_blocks: LayoutBlockRow[];
    keunggulan: KeunggulanRow[];
    statistik: StatistikRow[];
    testimoni: TestimoniRow[];
  ```

- [ ] **Step 20.4: Run it — passes**
  `pnpm --filter @sekolahpro/app-school test -- src/data/__tests__/situs-types.test.ts`
  Expected:
  ```
  ✓ src/data/__tests__/situs-types.test.ts (1)
    ✓ SitusDoc Phase-3 shape > accepts hero secondary fields + child arrays
  Test Files  1 passed (1)
  ```

- [ ] **Step 20.5: Typecheck the package**
  `pnpm --filter @sekolahpro/app-school typecheck`
  Expected: exit 0, no output. (`useSaveSitus` already accepts `Partial<SitusDoc>`, so `mutate({ layout_blocks: [...] })` typechecks for free.)

- [ ] **Step 20.6: Commit**
  `git add apps/school/src/data/situs.ts apps/school/src/data/__tests__/situs-types.test.ts && git commit -m "feat(situs-cms): extend SitusDoc with hero2 fields + child-array row types"`

---

### Task 21: Generic `ChildArrayManager` component (add/edit/delete/reorder/save)

- [ ] **Step 21.1: Add the `ChildSchema` shape to `features/situs/schemas.ts`**
  These reuse the existing `KontenField`/`FieldType` shapes; a `ChildSchema` is just a label + ordered field list (no doctype, no status). Append to `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/features/situs/schemas.ts`:
  ```ts
  /** Schema for a Situs Sekolah child table (rows saved as an array, no own doctype CRUD). */
  export interface ChildSchema {
    /** snake_case parent field holding the rows (e.g. "keunggulan"). */
    field: string;
    /** Singular human label, e.g. "Keunggulan". */
    singular: string;
    /** Field shown as the row title in the list. */
    titleField: string;
    fields: KontenField[];
  }
  ```

- [ ] **Step 21.2: Write failing test for `ChildArrayManager`**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/features/situs/__tests__/ChildArrayManager.test.tsx`:
  ```tsx
  // ChildArrayManager: add/reorder/delete rows then save the whole array under `field`.
  import React from "react";
  import { afterEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

  const saveMock = vi.fn(async () => ({}));
  vi.mock("@sekolahpro/api-client", async () => {
    const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
    return { ...actual, frappeFetch: vi.fn((method: string, args: unknown) => saveMock(method, args)) };
  });

  import { ChildArrayManager } from "../ChildArrayManager";
  import type { ChildSchema } from "../schemas";
  import type { KeunggulanRow } from "../../../data/situs";

  const SCHEMA: ChildSchema = {
    field: "keunggulan",
    singular: "Keunggulan",
    titleField: "judul",
    fields: [
      { name: "ikon", label: "Ikon", type: "text" },
      { name: "judul", label: "Judul", type: "text", required: true, listColumn: true },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" },
    ],
  };

  afterEach(() => { cleanup(); saveMock.mockClear(); });

  function wrap(ui: React.ReactNode) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
  }

  const rows: KeunggulanRow[] = [
    { ikon: "a", judul: "Pertama", deskripsi: "x" },
    { ikon: "b", judul: "Kedua", deskripsi: "y" },
  ];

  describe("ChildArrayManager", () => {
    it("renders existing rows by title", () => {
      render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={rows} />));
      expect(screen.getByText("Pertama")).toBeInTheDocument();
      expect(screen.getByText("Kedua")).toBeInTheDocument();
    });

    it("reorder up sends the swapped order under the field key", async () => {
      render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={rows} />));
      // Naikkan baris kedua → menjadi urutan pertama.
      fireEvent.click(screen.getAllByRole("button", { name: /Naikkan/i })[1]);
      fireEvent.click(screen.getByRole("button", { name: /Simpan/i }));
      await waitFor(() => expect(saveMock).toHaveBeenCalled());
      const [method, args] = saveMock.mock.calls[0];
      expect(method).toBe("sekolahpro.api.situs_admin.save_situs");
      expect((args as { values: { keunggulan: KeunggulanRow[] } }).values.keunggulan.map((r) => r.judul))
        .toEqual(["Kedua", "Pertama"]);
    });

    it("delete removes the row from the saved payload", async () => {
      render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={rows} />));
      fireEvent.click(screen.getAllByRole("button", { name: /Hapus/i })[0]);
      fireEvent.click(screen.getByRole("button", { name: /Simpan/i }));
      await waitFor(() => expect(saveMock).toHaveBeenCalled());
      const [, args] = saveMock.mock.calls[0];
      expect((args as { values: { keunggulan: KeunggulanRow[] } }).values.keunggulan.map((r) => r.judul))
        .toEqual(["Kedua"]);
    });

    it("add row then save includes the new row's edited title", async () => {
      render(wrap(<ChildArrayManager sekolah="SMP Demo" schema={SCHEMA} rows={[]} />));
      fireEvent.click(screen.getByRole("button", { name: /Tambah Keunggulan/i }));
      const judul = await screen.findByLabelText("Judul");
      fireEvent.change(judul, { target: { value: "Baru" } });
      fireEvent.click(screen.getByRole("button", { name: /^Simpan baris$/i }));
      fireEvent.click(screen.getByRole("button", { name: /^Simpan$/i }));
      await waitFor(() => expect(saveMock).toHaveBeenCalled());
      const [, args] = saveMock.mock.calls[0];
      expect((args as { values: { keunggulan: KeunggulanRow[] } }).values.keunggulan[0].judul).toBe("Baru");
    });
  });
  ```

- [ ] **Step 21.3: Run it — fails (component missing)**
  `pnpm --filter @sekolahpro/app-school test -- src/features/situs/__tests__/ChildArrayManager.test.tsx`
  Expected: `FAIL ... Failed to resolve import "../ChildArrayManager"`.

- [ ] **Step 21.4: Implement `ChildArrayManager`**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/features/situs/ChildArrayManager.tsx`. Reuse the existing modal-editor shape from `KontenManager`; the only new behaviors are local row state, up/down reorder, and a single `save_situs` call with `{ [field]: rows }`. Each function stays under 40 lines.
  ```tsx
  import { useEffect, useState } from "react";
  import {
    Badge,
    Button,
    Card,
    EmptyState,
    FormField,
    Input,
    Modal,
    PageHeader,
    Select,
    Textarea,
  } from "@sekolahpro/ui";
  import { useSaveSitus } from "../../data/situs";
  import type { ChildSchema, KontenField } from "./schemas";

  type Row = Record<string, unknown>;

  function emptyRow(schema: ChildSchema): Row {
    const r: Row = {};
    for (const f of schema.fields) r[f.name] = f.type === "check" ? 0 : "";
    return r;
  }

  function move<T>(arr: T[], from: number, to: number): T[] {
    if (to < 0 || to >= arr.length) return arr;
    const next = arr.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  function RowFieldInput({ field, value, onChange }: { field: KontenField; value: unknown; onChange: (v: unknown) => void }) {
    const s = value == null ? "" : String(value);
    if (field.type === "select") {
      return (
        <Select value={s} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
      );
    }
    if (field.type === "textarea" || field.type === "richtext") {
      return <Textarea rows={field.type === "richtext" ? 6 : 3} value={s} onChange={(e) => onChange(e.target.value)} />;
    }
    if (field.type === "check") {
      return <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked ? 1 : 0)} className="h-5 w-5" />;
    }
    const t = field.type === "number" ? "number" : "text";
    return <Input type={t} value={s} onChange={(e) => onChange(e.target.value)} />;
  }

  /** Generic add/edit/delete/reorder for one Situs Sekolah child table; saves the whole array. */
  export function ChildArrayManager({ sekolah, schema, rows }: { sekolah: string; schema: ChildSchema; rows: Row[] }) {
    const save = useSaveSitus(sekolah);
    const [items, setItems] = useState<Row[]>(rows);
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [draft, setDraft] = useState<Row | null>(null);

    useEffect(() => setItems(rows), [rows]);

    const openNew = () => { setEditIdx(items.length); setDraft(emptyRow(schema)); };
    const openEdit = (i: number) => { setEditIdx(i); setDraft({ ...items[i] }); };
    const closeDraft = () => { setEditIdx(null); setDraft(null); };

    const commitDraft = () => {
      if (draft == null || editIdx == null) return;
      const next = items.slice();
      next[editIdx] = draft;
      setItems(next);
      closeDraft();
    };

    const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    const reorder = (i: number, dir: -1 | 1) => setItems(move(items, i, i + dir));

    return (
      <div className="space-y-4">
        <PageHeader
          title={schema.singular}
          description={`Kelola daftar ${schema.singular.toLowerCase()} pada situs sekolah.`}
          actions={
            <div className="flex gap-2">
              <Button variant="ghost" onClick={openNew}>+ Tambah {schema.singular}</Button>
              <Button onClick={() => save.mutate({ [schema.field]: items })} disabled={save.isPending}>
                {save.isPending ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          }
        />

        {items.length === 0 ? (
          <EmptyState title={`Belum ada ${schema.singular.toLowerCase()}`} description="Klik Tambah untuk membuat yang pertama." />
        ) : (
          <div className="space-y-2">
            {items.map((row, i) => (
              <Card key={i} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{String(row[schema.titleField] ?? "—")}</p>
                  <Badge tone="neutral">{`#${i + 1}`}</Badge>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" aria-label="Naikkan" disabled={i === 0} onClick={() => reorder(i, -1)}>↑</Button>
                  <Button variant="ghost" size="sm" aria-label="Turunkan" disabled={i === items.length - 1} onClick={() => reorder(i, 1)}>↓</Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(i)}>Ubah</Button>
                  <Button variant="ghost" size="sm" aria-label="Hapus" onClick={() => remove(i)}>Hapus</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          open={draft != null}
          onClose={closeDraft}
          title={editIdx != null && editIdx < items.length ? `Ubah ${schema.singular}` : `Tambah ${schema.singular}`}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeDraft}>Batal</Button>
              <Button onClick={commitDraft}>Simpan baris</Button>
            </div>
          }
        >
          {draft ? (
            <div className="grid gap-4">
              {schema.fields.map((field) => (
                <FormField key={field.name} label={field.label} required={field.required}>
                  <RowFieldInput field={field} value={draft[field.name]} onChange={(v) => setDraft({ ...draft, [field.name]: v })} />
                </FormField>
              ))}
            </div>
          ) : null}
        </Modal>

        {save.isError ? <p className="text-sm text-rose-600">Gagal menyimpan. Coba lagi.</p> : null}
      </div>
    );
  }
  ```

- [ ] **Step 21.5: Run it — passes**
  `pnpm --filter @sekolahpro/app-school test -- src/features/situs/__tests__/ChildArrayManager.test.tsx`
  Expected:
  ```
  ✓ src/features/situs/__tests__/ChildArrayManager.test.tsx (4)
    ✓ ChildArrayManager > renders existing rows by title
    ✓ ChildArrayManager > reorder up sends the swapped order under the field key
    ✓ ChildArrayManager > delete removes the row from the saved payload
    ✓ ChildArrayManager > add row then save includes the new row's edited title
  Test Files  1 passed (1)
  ```

- [ ] **Step 21.6: Commit**
  `git add apps/school/src/features/situs/ChildArrayManager.tsx apps/school/src/features/situs/schemas.ts apps/school/src/features/situs/__tests__/ChildArrayManager.test.tsx && git commit -m "feat(situs-cms): generic ChildArrayManager (add/edit/delete/reorder/save array)"`

---

### Task 22: Block + sorotan child schemas + block variant catalogue

- [ ] **Step 22.1: Write failing schema test**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/features/situs/__tests__/blockSchemas.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import {
    KEUNGGULAN_SCHEMA,
    STATISTIK_SCHEMA,
    TESTIMONI_SCHEMA,
    LAYOUT_BLOCK_FIELDS,
    BLOCK_TIPE_OPTIONS,
    BLOCK_VARIANTS,
  } from "../blockSchemas";

  describe("Phase-3 child + block schemas", () => {
    it("keunggulan/statistik/testimoni expose the contract fields", () => {
      expect(KEUNGGULAN_SCHEMA.field).toBe("keunggulan");
      expect(KEUNGGULAN_SCHEMA.fields.map((f) => f.name)).toEqual(["ikon", "judul", "deskripsi"]);
      expect(STATISTIK_SCHEMA.fields.map((f) => f.name)).toEqual(["label", "nilai", "satuan"]);
      expect(TESTIMONI_SCHEMA.fields.map((f) => f.name)).toEqual(["nama", "peran", "foto", "kutipan"]);
    });

    it("layout block fields cover judul/subjudul/cta/konten", () => {
      const names = LAYOUT_BLOCK_FIELDS.map((f) => f.name);
      expect(names).toEqual(["judul", "subjudul", "cta_label", "cta_url", "konten"]);
    });

    it("tipe options match the backend Select and each has a variant list", () => {
      expect(BLOCK_TIPE_OPTIONS).toContain("hero");
      expect(BLOCK_TIPE_OPTIONS).toContain("richtext");
      expect(BLOCK_TIPE_OPTIONS).toHaveLength(13);
      for (const t of BLOCK_TIPE_OPTIONS) {
        expect(BLOCK_VARIANTS[t].length).toBeGreaterThan(0);
      }
    });
  });
  ```

- [ ] **Step 22.2: Run it — fails (module missing)**
  `pnpm --filter @sekolahpro/app-school test -- src/features/situs/__tests__/blockSchemas.test.ts`
  Expected: `FAIL ... Failed to resolve import "../blockSchemas"`.

- [ ] **Step 22.3: Implement `blockSchemas.ts`**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/features/situs/blockSchemas.ts`. `BLOCK_TIPE_OPTIONS` mirrors the backend `Situs Layout Block.tipe` Select exactly; `BLOCK_VARIANTS` seeds the per-tipe variant dropdown (hero variants align with the SPA `Hero.tsx` template keys; the rest default to `default`).
  ```ts
  import type { BlockTipe } from "../../data/situs";
  import type { ChildSchema, KontenField } from "./schemas";

  /** Mirror of Situs Layout Block.tipe Select (backend). Order = palette order. */
  export const BLOCK_TIPE_OPTIONS: BlockTipe[] = [
    "hero", "keunggulan", "statistik", "testimoni", "profil",
    "berita", "agenda", "galeri", "prestasi", "ppdb",
    "cta", "kontak", "richtext",
  ];

  /** Human labels for the tipe picker. */
  export const BLOCK_TIPE_LABELS: Record<BlockTipe, string> = {
    hero: "Hero", keunggulan: "Keunggulan", statistik: "Statistik",
    testimoni: "Testimoni", profil: "Profil", berita: "Berita",
    agenda: "Agenda", galeri: "Galeri", prestasi: "Prestasi",
    ppdb: "PPDB", cta: "Ajakan (CTA)", kontak: "Kontak", richtext: "Teks Bebas",
  };

  /** Variant options per tipe — drives the per-block variant dropdown. */
  export const BLOCK_VARIANTS: Record<BlockTipe, string[]> = {
    hero: ["split", "center", "image-right", "minimal"],
    keunggulan: ["grid", "list"],
    statistik: ["bar", "cards"],
    testimoni: ["carousel", "grid"],
    profil: ["default", "compact"],
    berita: ["default", "list"],
    agenda: ["default", "timeline"],
    galeri: ["grid", "masonry"],
    prestasi: ["default", "cards"],
    ppdb: ["default", "banner"],
    cta: ["default", "boxed"],
    kontak: ["default", "map"],
    richtext: ["default"],
  };

  /** Editable text fields shared by every layout block (tipe/variant/aktif edited separately). */
  export const LAYOUT_BLOCK_FIELDS: KontenField[] = [
    { name: "judul", label: "Judul", type: "text" },
    { name: "subjudul", label: "Subjudul", type: "textarea" },
    { name: "cta_label", label: "Label Tombol", type: "text" },
    { name: "cta_url", label: "URL Tombol", type: "text" },
    { name: "konten", label: "Konten (HTML)", type: "richtext" },
  ];

  export const KEUNGGULAN_SCHEMA: ChildSchema = {
    field: "keunggulan",
    singular: "Keunggulan",
    titleField: "judul",
    fields: [
      { name: "ikon", label: "Ikon", type: "text" },
      { name: "judul", label: "Judul", type: "text", required: true, listColumn: true },
      { name: "deskripsi", label: "Deskripsi", type: "textarea" },
    ],
  };

  export const STATISTIK_SCHEMA: ChildSchema = {
    field: "statistik",
    singular: "Statistik",
    titleField: "label",
    fields: [
      { name: "label", label: "Label", type: "text", required: true, listColumn: true },
      { name: "nilai", label: "Nilai", type: "text", required: true },
      { name: "satuan", label: "Satuan", type: "text" },
    ],
  };

  export const TESTIMONI_SCHEMA: ChildSchema = {
    field: "testimoni",
    singular: "Testimoni",
    titleField: "nama",
    fields: [
      { name: "nama", label: "Nama", type: "text", required: true, listColumn: true },
      { name: "peran", label: "Peran", type: "text" },
      { name: "foto", label: "Foto (URL)", type: "image" },
      { name: "kutipan", label: "Kutipan", type: "textarea", required: true },
    ],
  };
  ```

- [ ] **Step 22.4: Run it — passes**
  `pnpm --filter @sekolahpro/app-school test -- src/features/situs/__tests__/blockSchemas.test.ts`
  Expected:
  ```
  ✓ src/features/situs/__tests__/blockSchemas.test.ts (3)
  Test Files  1 passed (1)
  ```

- [ ] **Step 22.5: Commit**
  `git add apps/school/src/features/situs/blockSchemas.ts apps/school/src/features/situs/__tests__/blockSchemas.test.ts && git commit -m "feat(situs-cms): block tipe/variant catalogue + sorotan child schemas"`

---

### Task 23: Route `sch.$sekolah.situs.sorotan.tsx` (Keunggulan / Statistik / Testimoni)

- [ ] **Step 23.1: Write failing route test**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/routes/__tests__/situs.sorotan.test.tsx`. Mirror the ppdb test: stub `@tanstack/react-router`, render the named `SorotanPage` directly, mock `frappeFetch` so `get_situs` returns child arrays. `globals: false` → include `afterEach(cleanup)`.
  ```tsx
  import React from "react";
  import { afterEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import type { ReactNode } from "react";

  vi.mock("@tanstack/react-router", () => ({
    createFileRoute: () => () => ({}),
    useParams: () => ({ sekolah: "smp-demo" }),
    Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  }));

  const saveMock = vi.fn(async () => ({}));
  vi.mock("@sekolahpro/api-client", async () => {
    const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
    return {
      ...actual,
      frappeFetch: vi.fn((method: string, args: unknown) => {
        if (method.endsWith("get_situs")) {
          return Promise.resolve({
            sekolah: "smp-demo",
            keunggulan: [{ ikon: "a", judul: "Aman", deskripsi: "x" }],
            statistik: [{ label: "Siswa", nilai: "1200", satuan: "anak" }],
            testimoni: [{ nama: "Budi", peran: "Wali", foto: "", kutipan: "Bagus" }],
          });
        }
        return saveMock(method, args);
      }),
    };
  });

  import { SorotanPage } from "../sch.$sekolah.situs.sorotan";

  afterEach(() => { cleanup(); saveMock.mockClear(); });

  function wrap(ui: React.ReactNode) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
  }

  describe("SorotanPage", () => {
    it("renders the three sub-sections and existing rows", async () => {
      render(wrap(<SorotanPage sekolah="smp-demo" />));
      await waitFor(() => expect(screen.getByText("Aman")).toBeInTheDocument());
      expect(screen.getByRole("button", { name: /Keunggulan/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Statistik/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Testimoni/i })).toBeInTheDocument();
    });

    it("saving the active section posts that field's array to save_situs", async () => {
      render(wrap(<SorotanPage sekolah="smp-demo" />));
      await waitFor(() => expect(screen.getByText("Aman")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /^Simpan$/i }));
      await waitFor(() => expect(saveMock).toHaveBeenCalled());
      const [method, args] = saveMock.mock.calls[0];
      expect(method).toBe("sekolahpro.api.situs_admin.save_situs");
      expect((args as { values: Record<string, unknown> }).values).toHaveProperty("keunggulan");
    });
  });
  ```

- [ ] **Step 23.2: Run it — fails (route missing)**
  `pnpm --filter @sekolahpro/app-school test -- src/routes/__tests__/situs.sorotan.test.tsx`
  Expected: `FAIL ... Failed to resolve import "../sch.$sekolah.situs.sorotan"`.

- [ ] **Step 23.3: Implement the route (Route → Page → ChildArrayManager)**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/routes/sch.$sekolah.situs.sorotan.tsx`. The `Route` component reads params and delegates to the exported `SorotanPage(sekolah)`; a small sub-section switch reuses `ChildArrayManager`.
  ```tsx
  import { useState } from "react";
  import { createFileRoute } from "@tanstack/react-router";
  import { Button } from "@sekolahpro/ui";
  import { useSitus } from "../data/situs";
  import { ChildArrayManager } from "../features/situs/ChildArrayManager";
  import type { ChildSchema } from "../features/situs/schemas";
  import {
    KEUNGGULAN_SCHEMA,
    STATISTIK_SCHEMA,
    TESTIMONI_SCHEMA,
  } from "../features/situs/blockSchemas";

  const SECTIONS: ChildSchema[] = [KEUNGGULAN_SCHEMA, STATISTIK_SCHEMA, TESTIMONI_SCHEMA];

  type Row = Record<string, unknown>;

  /** Sorotan editor: switch between Keunggulan / Statistik / Testimoni child arrays. */
  export function SorotanPage({ sekolah }: { sekolah: string }) {
    const { data } = useSitus(sekolah);
    const [active, setActive] = useState(0);
    const schema = SECTIONS[active];
    const rows = ((data as Record<string, unknown> | undefined)?.[schema.field] as Row[]) ?? [];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s, i) => (
            <Button
              key={s.field}
              variant={i === active ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActive(i)}
            >
              {s.singular}
            </Button>
          ))}
        </div>
        <ChildArrayManager key={schema.field} sekolah={sekolah} schema={schema} rows={rows} />
      </div>
    );
  }

  function SorotanRoute() {
    const { sekolah } = Route.useParams();
    return <SorotanPage sekolah={sekolah} />;
  }

  export const Route = createFileRoute("/sch/$sekolah/situs/sorotan")({ component: SorotanRoute });
  ```

- [ ] **Step 23.4: Run it — passes**
  `pnpm --filter @sekolahpro/app-school test -- src/routes/__tests__/situs.sorotan.test.tsx`
  Expected:
  ```
  ✓ src/routes/__tests__/situs.sorotan.test.tsx (2)
    ✓ SorotanPage > renders the three sub-sections and existing rows
    ✓ SorotanPage > saving the active section posts that field's array to save_situs
  Test Files  1 passed (1)
  ```

- [ ] **Step 23.5: Regenerate the route tree + commit**
  `pnpm --filter @sekolahpro/app-school build` (regenerates `routeTree.gen.ts` for the new route), then:
  `git add apps/school/src/routes/sch.\$sekolah.situs.sorotan.tsx apps/school/src/routes/__tests__/situs.sorotan.test.tsx apps/school/src/routeTree.gen.ts && git commit -m "feat(situs-cms): /situs/sorotan route — Keunggulan/Statistik/Testimoni editors"`

---

### Task 24: Route `sch.$sekolah.situs.tataletak.tsx` (layout builder)

- [ ] **Step 24.1: Write failing route test**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/routes/__tests__/situs.tataletak.test.tsx`:
  ```tsx
  import React from "react";
  import { afterEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render, screen, fireEvent, waitFor, within } from "@testing-library/react";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import type { ReactNode } from "react";

  vi.mock("@tanstack/react-router", () => ({
    createFileRoute: () => () => ({}),
    useParams: () => ({ sekolah: "smp-demo" }),
    Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  }));

  const saveMock = vi.fn(async () => ({}));
  vi.mock("@sekolahpro/api-client", async () => {
    const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
    return {
      ...actual,
      frappeFetch: vi.fn((method: string, args: unknown) => {
        if (method.endsWith("get_situs")) {
          return Promise.resolve({
            sekolah: "smp-demo",
            layout_blocks: [
              { tipe: "hero", variant: "split", aktif: 1, judul: "Selamat Datang" },
              { tipe: "berita", variant: "default", aktif: 1, judul: "Kabar" },
            ],
          });
        }
        return saveMock(method, args);
      }),
    };
  });

  import { TataLetakPage } from "../sch.$sekolah.situs.tataletak";
  import type { LayoutBlockRow } from "../../data/situs";

  afterEach(() => { cleanup(); saveMock.mockClear(); });

  function wrap(ui: React.ReactNode) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
  }

  function saved(): LayoutBlockRow[] {
    const [, args] = saveMock.mock.calls[0];
    return (args as { values: { layout_blocks: LayoutBlockRow[] } }).values.layout_blocks;
  }

  describe("TataLetakPage", () => {
    it("lists current blocks in order", async () => {
      render(wrap(<TataLetakPage sekolah="smp-demo" />));
      await waitFor(() => expect(screen.getByDisplayValue("Selamat Datang")).toBeInTheDocument());
      expect(screen.getByDisplayValue("Kabar")).toBeInTheDocument();
    });

    it("reorder down then save swaps block order", async () => {
      render(wrap(<TataLetakPage sekolah="smp-demo" />));
      await waitFor(() => expect(screen.getByDisplayValue("Selamat Datang")).toBeInTheDocument());
      fireEvent.click(screen.getAllByRole("button", { name: /Turunkan/i })[0]);
      fireEvent.click(screen.getByRole("button", { name: /^Simpan Tata Letak$/i }));
      await waitFor(() => expect(saveMock).toHaveBeenCalled());
      expect(saved().map((b) => b.tipe)).toEqual(["berita", "hero"]);
    });

    it("toggling aktif flips the saved flag", async () => {
      render(wrap(<TataLetakPage sekolah="smp-demo" />));
      await waitFor(() => expect(screen.getByDisplayValue("Selamat Datang")).toBeInTheDocument());
      fireEvent.click(screen.getAllByRole("checkbox")[0]);
      fireEvent.click(screen.getByRole("button", { name: /^Simpan Tata Letak$/i }));
      await waitFor(() => expect(saveMock).toHaveBeenCalled());
      expect(saved()[0].aktif).toBe(0);
    });

    it("adding a block appends the chosen tipe", async () => {
      render(wrap(<TataLetakPage sekolah="smp-demo" />));
      await waitFor(() => expect(screen.getByDisplayValue("Selamat Datang")).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText("Tambah blok"), { target: { value: "kontak" } });
      fireEvent.click(screen.getByRole("button", { name: /^\+ Tambah Blok$/i }));
      fireEvent.click(screen.getByRole("button", { name: /^Simpan Tata Letak$/i }));
      await waitFor(() => expect(saveMock).toHaveBeenCalled());
      expect(saved().map((b) => b.tipe)).toEqual(["hero", "berita", "kontak"]);
    });
  });
  ```

- [ ] **Step 24.2: Run it — fails (route missing)**
  `pnpm --filter @sekolahpro/app-school test -- src/routes/__tests__/situs.tataletak.test.tsx`
  Expected: `FAIL ... Failed to resolve import "../sch.$sekolah.situs.tataletak"`.

- [ ] **Step 24.3: Implement the layout builder route**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/routes/sch.$sekolah.situs.tataletak.tsx`. Each block card edits tipe/variant/aktif inline plus the shared text fields from `LAYOUT_BLOCK_FIELDS`; reuse the `move` reorder helper inline (kept under 40 lines per function). Inputs for `judul/subjudul/cta_label/cta_url/konten` write straight onto the block row so the test can read them via `getByDisplayValue`.
  ```tsx
  import { useEffect, useState } from "react";
  import { createFileRoute } from "@tanstack/react-router";
  import {
    Button,
    Card,
    EmptyState,
    FormField,
    Input,
    PageHeader,
    Select,
    Switch,
    Textarea,
  } from "@sekolahpro/ui";
  import { useSitus, useSaveSitus, type BlockTipe, type LayoutBlockRow } from "../data/situs";
  import {
    BLOCK_TIPE_OPTIONS,
    BLOCK_TIPE_LABELS,
    BLOCK_VARIANTS,
    LAYOUT_BLOCK_FIELDS,
  } from "../features/situs/blockSchemas";

  function move<T>(arr: T[], from: number, to: number): T[] {
    if (to < 0 || to >= arr.length) return arr;
    const next = arr.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  function newBlock(tipe: BlockTipe): LayoutBlockRow {
    return { tipe, variant: BLOCK_VARIANTS[tipe][0] ?? "default", aktif: 1 };
  }

  function BlockEditor({ block, onChange }: { block: LayoutBlockRow; onChange: (b: LayoutBlockRow) => void }) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Varian">
          <Select value={block.variant} onChange={(e) => onChange({ ...block, variant: e.target.value })}>
            {BLOCK_VARIANTS[block.tipe].map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </FormField>
        {LAYOUT_BLOCK_FIELDS.map((f) => {
          const value = String((block as Record<string, unknown>)[f.name] ?? "");
          const set = (v: string) => onChange({ ...block, [f.name]: v });
          return (
            <FormField key={f.name} label={f.label}>
              {f.type === "textarea" || f.type === "richtext" ? (
                <Textarea rows={f.type === "richtext" ? 4 : 2} value={value} onChange={(e) => set(e.target.value)} />
              ) : (
                <Input value={value} onChange={(e) => set(e.target.value)} />
              )}
            </FormField>
          );
        })}
      </div>
    );
  }

  /** Layout builder: order/toggle/configure the situs section blocks. */
  export function TataLetakPage({ sekolah }: { sekolah: string }) {
    const { data } = useSitus(sekolah);
    const save = useSaveSitus(sekolah);
    const [blocks, setBlocks] = useState<LayoutBlockRow[]>([]);
    const [pick, setPick] = useState<BlockTipe>(BLOCK_TIPE_OPTIONS[0]);

    useEffect(() => { if (data?.layout_blocks) setBlocks(data.layout_blocks); }, [data]);

    const patch = (i: number, b: LayoutBlockRow) => setBlocks(blocks.map((x, idx) => (idx === i ? b : x)));
    const reorder = (i: number, dir: -1 | 1) => setBlocks(move(blocks, i, i + dir));
    const remove = (i: number) => setBlocks(blocks.filter((_, idx) => idx !== i));
    const add = () => setBlocks([...blocks, newBlock(pick)]);

    return (
      <div className="space-y-4">
        <PageHeader
          title="Tata Letak"
          description="Susun urutan, aktif/nonaktif, dan varian tiap bagian beranda situs."
          actions={
            <Button onClick={() => save.mutate({ layout_blocks: blocks })} disabled={save.isPending}>
              {save.isPending ? "Menyimpan…" : "Simpan Tata Letak"}
            </Button>
          }
        />

        <Card className="flex flex-wrap items-end gap-3 p-4">
          <FormField label="Tambah blok">
            <Select value={pick} onChange={(e) => setPick(e.target.value as BlockTipe)}>
              {BLOCK_TIPE_OPTIONS.map((t) => <option key={t} value={t}>{BLOCK_TIPE_LABELS[t]}</option>)}
            </Select>
          </FormField>
          <Button variant="ghost" onClick={add}>+ Tambah Blok</Button>
        </Card>

        {blocks.length === 0 ? (
          <EmptyState title="Belum ada blok" description="Tambahkan blok lalu simpan tata letak." />
        ) : (
          <div className="space-y-3">
            {blocks.map((block, i) => (
              <Card key={i} className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-800">{`#${i + 1} · ${BLOCK_TIPE_LABELS[block.tipe]}`}</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={Boolean(block.aktif)} onChange={(next) => patch(i, { ...block, aktif: next ? 1 : 0 })} label="Aktif" />
                    <Button variant="ghost" size="sm" aria-label="Naikkan" disabled={i === 0} onClick={() => reorder(i, -1)}>↑</Button>
                    <Button variant="ghost" size="sm" aria-label="Turunkan" disabled={i === blocks.length - 1} onClick={() => reorder(i, 1)}>↓</Button>
                    <Button variant="ghost" size="sm" aria-label="Hapus" onClick={() => remove(i)}>Hapus</Button>
                  </div>
                </div>
                <BlockEditor block={block} onChange={(b) => patch(i, b)} />
              </Card>
            ))}
          </div>
        )}

        {save.isError ? <p className="text-sm text-rose-600">Gagal menyimpan tata letak.</p> : null}
      </div>
    );
  }

  function TataLetakRoute() {
    const { sekolah } = Route.useParams();
    return <TataLetakPage sekolah={sekolah} />;
  }

  export const Route = createFileRoute("/sch/$sekolah/situs/tataletak")({ component: TataLetakRoute });
  ```
  Note: the `aktif` toggle test clicks `getAllByRole("checkbox")[0]` — confirm `@sekolahpro/ui` `Switch` renders an `<input type="checkbox">` (it does, per existing tampilan usage). If `Switch` renders a `role="switch"` element instead, change the test to `getAllByRole("switch")[0]` in Step 24.1 before running.

- [ ] **Step 24.4: Run it — passes**
  `pnpm --filter @sekolahpro/app-school test -- src/routes/__tests__/situs.tataletak.test.tsx`
  Expected:
  ```
  ✓ src/routes/__tests__/situs.tataletak.test.tsx (4)
    ✓ TataLetakPage > lists current blocks in order
    ✓ TataLetakPage > reorder down then save swaps block order
    ✓ TataLetakPage > toggling aktif flips the saved flag
    ✓ TataLetakPage > adding a block appends the chosen tipe
  Test Files  1 passed (1)
  ```

- [ ] **Step 24.5: Regenerate route tree + commit**
  `pnpm --filter @sekolahpro/app-school build`, then:
  `git add apps/school/src/routes/sch.\$sekolah.situs.tataletak.tsx apps/school/src/routes/__tests__/situs.tataletak.test.tsx apps/school/src/routeTree.gen.ts && git commit -m "feat(situs-cms): /situs/tataletak layout builder (order/toggle/variant/add)"`

---

### Task 25: Enrich `sch.$sekolah.situs.tampilan.tsx` (hero secondary fields + template token preview)

- [ ] **Step 25.1: Extend `SitusTemplate` with the theme tokens the picker previews**
  The template picker needs `radius`/`font_heading`/`shadow` to show a preview chip. Add these to `SitusTemplate` in `data/situs.ts` (the backend `list_template` already returns Template Situs records; these fields are optional on the wire). After `aksen_default: string | null;` add:
  ```ts
    hero_variant?: string | null;
    radius?: string | null;
    font_heading?: string | null;
    font_body?: string | null;
    shadow?: string | null;
    section_style?: string | null;
  ```

- [ ] **Step 25.2: Write failing test for the enriched tampilan page**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/routes/__tests__/situs.tampilan.test.tsx`. Render the (to-be-extracted) `TampilanPage(sekolah)` directly.
  ```tsx
  import React from "react";
  import { afterEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import type { ReactNode } from "react";

  vi.mock("@tanstack/react-router", () => ({
    createFileRoute: () => () => ({}),
    useParams: () => ({ sekolah: "smp-demo" }),
    Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  }));

  const saveMock = vi.fn(async () => ({}));
  vi.mock("@sekolahpro/api-client", async () => {
    const actual = await vi.importActual<typeof import("@sekolahpro/api-client")>("@sekolahpro/api-client");
    return {
      ...actual,
      frappeFetch: vi.fn((method: string, args: unknown) => {
        if (method.endsWith("get_situs")) {
          return Promise.resolve({ sekolah: "smp-demo", template: "klasik", hero_eyebrow: "Halo" });
        }
        if (method.endsWith("list_template")) {
          return Promise.resolve([
            { key: "klasik", nama: "Klasik", deskripsi: "Resmi", radius: "8px", font_heading: "Merriweather", shadow: "sm" },
          ]);
        }
        return saveMock(method, args);
      }),
    };
  });

  import { TampilanPage } from "../sch.$sekolah.situs.tampilan";

  afterEach(() => { cleanup(); saveMock.mockClear(); });

  function wrap(ui: React.ReactNode) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
  }

  describe("TampilanPage Phase-3", () => {
    it("renders the hero secondary inputs prefilled from data", async () => {
      render(wrap(<TampilanPage sekolah="smp-demo" />));
      await waitFor(() => expect(screen.getByDisplayValue("Halo")).toBeInTheDocument());
      expect(screen.getByText("Eyebrow Hero")).toBeInTheDocument();
      expect(screen.getByText("Label Tombol Kedua")).toBeInTheDocument();
      expect(screen.getByText("URL Tombol Kedua")).toBeInTheDocument();
    });

    it("shows template token preview on the card", async () => {
      render(wrap(<TampilanPage sekolah="smp-demo" />));
      await waitFor(() => expect(screen.getByText("Klasik")).toBeInTheDocument());
      expect(screen.getByText(/Merriweather/)).toBeInTheDocument();
      expect(screen.getByText(/8px/)).toBeInTheDocument();
    });

    it("persists the secondary hero fields on save", async () => {
      render(wrap(<TampilanPage sekolah="smp-demo" />));
      await waitFor(() => expect(screen.getByDisplayValue("Halo")).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText("Label Tombol Kedua"), { target: { value: "Hubungi" } });
      fireEvent.click(screen.getByRole("button", { name: /Simpan Perubahan/i }));
      await waitFor(() => expect(saveMock).toHaveBeenCalled());
      const [, args] = saveMock.mock.calls[0];
      expect((args as { values: Record<string, unknown> }).values.hero_cta2_label).toBe("Hubungi");
    });
  });
  ```

- [ ] **Step 25.3: Run it — fails (no `TampilanPage` export + fields missing)**
  `pnpm --filter @sekolahpro/app-school test -- src/routes/__tests__/situs.tampilan.test.tsx`
  Expected: `FAIL ... has no exported member 'TampilanPage'`.

- [ ] **Step 25.4: Refactor `tampilan.tsx` to Route → Page and add the new fields**
  Edit `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/routes/sch.$sekolah.situs.tampilan.tsx`.
  Change the component signature so the page takes `sekolah` as a prop and the route delegates. Replace the `TampilanCms()` declaration line:
  ```tsx
  function TampilanCms() {
    const { sekolah } = Route.useParams();
  ```
  with:
  ```tsx
  export function TampilanPage({ sekolah }: { sekolah: string }) {
  ```
  and add a thin route wrapper just above the existing `export const Route` line:
  ```tsx
  function TampilanCms() {
    const { sekolah } = Route.useParams();
    return <TampilanPage sekolah={sekolah} />;
  }
  ```
  Add the secondary hero fields: inside the "Konten Beranda" `Card`, immediately after the `Subjudul Hero` `FormField` (the `hero_subjudul` Textarea block), insert:
  ```tsx
          <FormField label="Eyebrow Hero">
            <Input value={str("hero_eyebrow")} onChange={(e) => set("hero_eyebrow", e.target.value)} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Label Tombol Kedua">
              <Input value={str("hero_cta2_label")} onChange={(e) => set("hero_cta2_label", e.target.value)} />
            </FormField>
            <FormField label="URL Tombol Kedua">
              <Input value={str("hero_cta2_url")} onChange={(e) => set("hero_cta2_url", e.target.value)} />
            </FormField>
          </div>
  ```
  Add the token preview inside the template `<button>` card, right after the `<p className="mt-1 text-xs text-slate-500">{t.deskripsi}</p>` line:
  ```tsx
                {(t.font_heading || t.radius || t.shadow) ? (
                  <p className="mt-2 text-[11px] text-slate-400">
                    {[t.font_heading, t.radius ? `radius ${t.radius}` : null, t.shadow ? `shadow ${t.shadow}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
  ```

- [ ] **Step 25.5: Run it — passes**
  `pnpm --filter @sekolahpro/app-school test -- src/routes/__tests__/situs.tampilan.test.tsx`
  Expected:
  ```
  ✓ src/routes/__tests__/situs.tampilan.test.tsx (3)
    ✓ TampilanPage Phase-3 > renders the hero secondary inputs prefilled from data
    ✓ TampilanPage Phase-3 > shows template token preview on the card
    ✓ TampilanPage Phase-3 > persists the secondary hero fields on save
  Test Files  1 passed (1)
  ```

- [ ] **Step 25.6: Commit**
  `git add apps/school/src/data/situs.ts apps/school/src/routes/sch.\$sekolah.situs.tampilan.tsx apps/school/src/routes/__tests__/situs.tampilan.test.tsx && git commit -m "feat(situs-cms): tampilan — hero2 fields + template token preview, extract TampilanPage"`

---

### Task 26: Register `Tata Letak` + `Sorotan` tabs in `sch.$sekolah.situs.tsx`

- [ ] **Step 26.1: Write failing tab-presence test**
  Create `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/routes/__tests__/situs.tabs.test.tsx`. The layout uses `Outlet` + `useRouterState`; stub the router so the layout renders its `Tabs` and we assert the two new labels appear. Export the `SitusLayout` component (Step 26.2 adds the export).
  ```tsx
  import React from "react";
  import { afterEach, describe, expect, it, vi } from "vitest";
  import { cleanup, render, screen } from "@testing-library/react";
  import type { ReactNode } from "react";

  vi.mock("@tanstack/react-router", () => ({
    createFileRoute: () => () => ({}),
    useRouterState: () => "/sch/smp-demo/situs",
    Outlet: () => <div data-testid="outlet" />,
    Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  }));

  import { SitusLayout } from "../sch.$sekolah.situs";

  afterEach(() => cleanup());

  describe("Situs tabs", () => {
    it("includes the Phase-3 Tata Letak and Sorotan tabs", () => {
      render(<SitusLayout />);
      expect(screen.getByText("Tata Letak")).toBeInTheDocument();
      expect(screen.getByText("Sorotan")).toBeInTheDocument();
      // Existing tabs remain.
      expect(screen.getByText("Tampilan")).toBeInTheDocument();
      expect(screen.getByText("Domain")).toBeInTheDocument();
    });
  });
  ```
  Note: `useRouterState` in the real layout is called with a `{ select }` arg returning a pathname string; the stub above ignores the selector and returns the pathname directly, which matches the layout's usage (`pathname` is the return value).

- [ ] **Step 26.2: Run it — fails (`SitusLayout` not exported + tabs absent)**
  `pnpm --filter @sekolahpro/app-school test -- src/routes/__tests__/situs.tabs.test.tsx`
  Expected: `FAIL ... has no exported member 'SitusLayout'`.

- [ ] **Step 26.3: Export `SitusLayout`, import the icons, and add the two tabs**
  Edit `/Users/erickmo/Desktop/Project/frappe/apps/sekolahpro-web/apps/school/src/routes/sch.$sekolah.situs.tsx`.
  Add `IconColumns` and `IconStar` to the `@sekolahpro/ui` import list (verify these icon names exist in `@sekolahpro/ui`; if not, reuse already-imported `IconLayers` for Tata Letak and `IconFlag` for Sorotan — do NOT invent icon names). Change:
  ```tsx
    IconFlag,
    IconMapPin,
  } from "@sekolahpro/ui";
  ```
  to (only if the icons exist):
  ```tsx
    IconFlag,
    IconMapPin,
    IconColumns,
    IconStar,
  } from "@sekolahpro/ui";
  ```
  Add the two entries to `TABS`, placed right after the `Tampilan` entry so the layout/content tabs group together:
  ```tsx
    { to: "/sch/$sekolah/situs/tampilan", label: "Tampilan", icon: <IconSettings /> },
    { to: "/sch/$sekolah/situs/tataletak", label: "Tata Letak", icon: <IconColumns /> },
    { to: "/sch/$sekolah/situs/sorotan", label: "Sorotan", icon: <IconStar /> },
  ```
  Export the layout component — change `function SitusLayout() {` to `export function SitusLayout() {`.

- [ ] **Step 26.4: Run it — passes**
  `pnpm --filter @sekolahpro/app-school test -- src/routes/__tests__/situs.tabs.test.tsx`
  Expected:
  ```
  ✓ src/routes/__tests__/situs.tabs.test.tsx (1)
    ✓ Situs tabs > includes the Phase-3 Tata Letak and Sorotan tabs
  Test Files  1 passed (1)
  ```
  Role gating is unchanged: `ROLE_MENU_MAP` in `__root.tsx` already grants `/situs`, and these are sub-routes under it — no `__root.tsx` edit needed.

- [ ] **Step 26.5: Commit**
  `git add apps/school/src/routes/sch.\$sekolah.situs.tsx apps/school/src/routes/__tests__/situs.tabs.test.tsx && git commit -m "feat(situs-cms): register Tata Letak + Sorotan tabs in situs layout"`

---

### Task 27: Phase-3 CMS verification gate (full suite + typecheck + build)

- [ ] **Step 27.1: Run the whole app-school test suite**
  `pnpm --filter @sekolahpro/app-school test`
  Expected: all suites green including the 6 new Phase-3 files (`situs-types`, `ChildArrayManager`, `blockSchemas`, `situs.sorotan`, `situs.tataletak`, `situs.tampilan`, `situs.tabs`) plus the pre-existing `KontenManager` 2 tests still passing. Confirm no `Found multiple elements` leak (every new RTL file has `afterEach(cleanup)` — `globals: false` requires it).

- [ ] **Step 27.2: Typecheck**
  `pnpm --filter @sekolahpro/app-school typecheck`
  Expected: exit 0. If `routeTree.gen.ts` shows phantom errors for the new routes, run `pnpm --filter @sekolahpro/app-school build` first to regenerate it, then re-run typecheck.

- [ ] **Step 27.3: Lint**
  `pnpm --filter @sekolahpro/app-school lint`
  Expected: 0 errors. Fix any unused-import warnings (e.g. drop an icon import if you fell back to `IconLayers`/`IconFlag` in Task 26).

- [ ] **Step 27.4: Final Phase-3-CMS commit (if any lint/format fixes)**
  `git add -A && git commit -m "chore(situs-cms): phase-3 CMS green — full suite + typecheck + lint"`
