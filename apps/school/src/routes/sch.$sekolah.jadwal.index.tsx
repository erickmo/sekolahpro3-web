import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — /jadwal moved under /akademik/$ta/jadwal (spec §1.6). */
export const Route = createFileRoute("/sch/$sekolah/jadwal/")({
  beforeLoad: workspaceStubBeforeLoad("jadwal"),
});
