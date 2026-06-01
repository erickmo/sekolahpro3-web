import { createFileRoute, useParams } from "@tanstack/react-router";
import { AsesmenInput } from "../components/akademik/AsesmenInput";

/**
 * Thin route wrapper: all page UI — including the PageGuide — lives inside
 * `AsesmenInput`, which owns the grid and its surrounding chrome. Rendering a
 * second PageGuide here would duplicate it, so the route only resolves params.
 */
function AsesmenInputPage() {
  const { sekolah, id } = useParams({ from: "/sch/$sekolah/akademik/asesmen/$id" });
  return <AsesmenInput asesmenId={id} sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/akademik/asesmen/$id")({
  component: AsesmenInputPage,
});
