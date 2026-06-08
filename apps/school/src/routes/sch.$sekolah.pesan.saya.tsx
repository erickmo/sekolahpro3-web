/**
 * Pesan "Saya" route — the Guru's roster-born "Pesan Wali" surface. The redirect target
 * for primary role `guru` from the Pesan index. Thin: all content is in PesanWaliSaya.
 */
import { createFileRoute } from "@tanstack/react-router";
import { PesanWaliSaya } from "../components/pesan/PesanWaliSaya";

export const Route = createFileRoute("/sch/$sekolah/pesan/saya")({ component: PesanWaliSaya });
