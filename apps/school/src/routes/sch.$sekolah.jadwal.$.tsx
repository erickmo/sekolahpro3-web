import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Splat stub: deep links like /jadwal/papan keep working after the move. */
export const Route = createFileRoute("/sch/$sekolah/jadwal/$")({
  beforeLoad: workspaceStubBeforeLoad("jadwal"),
});
