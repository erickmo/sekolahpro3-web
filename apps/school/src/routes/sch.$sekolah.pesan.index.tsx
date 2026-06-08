/**
 * Pesan module index — a THIN role switch (edited once; persona phases add components,
 * never re-touch this file). Renders a different surface per the session's primary pesan
 * role:
 *   kepsek → PanelKepsek (zero-click oversight cockpit)
 *   guru   → redirect to the roster-born "Pesan Wali" surface (/saya)
 *   tu     → MasukDesk (the public-contact inbox, the permissive default)
 *
 * The decision is driven entirely by the tested {@link usePesanRole}; all data-fetching
 * and rendering live in the surface components.
 */
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { usePesanRole } from "../lib/pesanRole";
import { MasukDesk } from "../components/pesan/MasukDesk";
import { PanelKepsek } from "../components/pesan/PanelKepsek";

function PesanIndexPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const { primary } = usePesanRole();

  if (primary === "kepsek") return <PanelKepsek />;
  if (primary === "guru") {
    return <Navigate to="/sch/$sekolah/pesan/saya" params={{ sekolah }} />;
  }
  return <MasukDesk />;
}

export const Route = createFileRoute("/sch/$sekolah/pesan/")({ component: PesanIndexPage });
