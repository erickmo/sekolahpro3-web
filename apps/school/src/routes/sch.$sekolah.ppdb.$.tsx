import { createFileRoute } from "@tanstack/react-router";
import { directStubBeforeLoad } from "../lib/legacyRedirects";

/** Splat stub: PPDB deep links (incl. $noPendaftaran detail + query params) keep working. */
export const Route = createFileRoute("/sch/$sekolah/ppdb/$")({
  beforeLoad: directStubBeforeLoad("akademik/ppdb"),
});
