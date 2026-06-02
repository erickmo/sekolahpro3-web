// Section adapters — thin block renderers that wrap the Phase 1 section
// components so the existing Berita/Agenda/Galeri/Prestasi/Profil/Ppdb/Kontak
// markup renders inside the block engine WITHOUT duplicating their layout or
// data-fetch hooks. Each section already pulls its own data (useBeritaList etc.)
// and reads brand vars from context, so the adapter is a pure pass-through. The
// `block` arg is reserved for future per-block overrides (heading, limit).

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
