import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Permanent redirect stub — /ekstrakurikuler moved under /akademik/$ta/ekskul (spec §1.6). */
export const Route = createFileRoute("/sch/$sekolah/ekstrakurikuler/")({
  beforeLoad: workspaceStubBeforeLoad("ekskul"),
});
