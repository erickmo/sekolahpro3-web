# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-29

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** @sekolahpro/app-school

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

## Do-Not-Repeat (2026-05-30)
- Infrastruktur form-modals SUDAH ADA di `apps/school/src/components/infrastruktur/`:
  GedungFormModal, LantaiFormModal, RuanganFormModal, FasilitasRuanganFormModal,
  UtilitasGedungFormModal (semua create-only, prop defaultGedung/defaultLantai/
  defaultRuangan + onCreated). JANGAN bikin ulang — extend (editName + useResourceDoc
  + useResourceUpdate) untuk edit. Subagent investigator awal cuma lapor GedungFormModal
  → SELALU verifikasi daftar komponen dgn `find -iname "*Modal*"` sebelum bikin baru.
- Fasilitas Ruangan = child doctype; modal create-nya pakai parent/parenttype/
  parentfield reference (BUKAN grid child-table dalam modal induk).
- vitest school: `vitest.config.ts` set `globals:false` → WAJIB import {describe,it,expect,vi}
  dari "vitest". Run per file: `pnpm --filter @sekolahpro/app-school test -- <file>`.
- Detail Gedung doctype perm = System Manager only → CRUD via REST 403 utk role sekolah.

## Do-Not-Repeat (2026-05-30) — inline toggle
- `InlineToggle.tsx` SUDAH ADA di `src/components/master/` (optimistic boolean toggle: useResourceUpdate + invalidate list + stopPropagation). JANGAN bikin ToggleCell/duplicate — extend/reuse. Awalnya gw bikin ToggleCell duplikat, anatomy.md ungkap InlineToggle existing → konsolidasi. SELALU cek anatomy.md `## src/components/master/` sebelum bikin komponen master baru.
- UI lib `@sekolahpro/ui` TADINYA tak punya Switch — gw tambah `primitives/switch.tsx` (role=switch button, onChange(next:boolean)). Pakai ini utk toggle, bukan checkbox.
- vitest: window.alert di jsdom lempar "not implemented" → `vi.spyOn(window,"alert").mockImplementation(()=>{})` di test yg trigger error path.
