import { createFileRoute } from "@tanstack/react-router";
import { workspaceStubBeforeLoad } from "../lib/legacyRedirects";

/** Splat stub: deep links like /ekstrakurikuler/program keep working after the move. */
export const Route = createFileRoute("/sch/$sekolah/ekstrakurikuler/$")({
  beforeLoad: workspaceStubBeforeLoad("ekskul"),
});
