import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — /kelas moved under /akademik/$ta/kelas (spec §1.6). */
export const Route = createFileRoute("/sch/$sekolah/kelas/")({
  beforeLoad: workspaceStubBeforeLoad("kelas"),
});
