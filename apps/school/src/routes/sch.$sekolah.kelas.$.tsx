import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Splat stub: deep links like /kelas/rombel keep working after the move. */
export const Route = createFileRoute("/sch/$sekolah/kelas/$")({
  beforeLoad: workspaceStubBeforeLoad("kelas"),
});
