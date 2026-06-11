import { createFileRoute } from "@tanstack/react-router";
import { directStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — /ppdb moved to /akademik/ppdb (spec §1.4). */
export const Route = createFileRoute("/sch/$sekolah/ppdb/")({
  beforeLoad: directStubBeforeLoad("akademik/ppdb"),
});
