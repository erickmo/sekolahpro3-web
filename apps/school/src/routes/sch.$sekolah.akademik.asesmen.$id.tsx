import { createFileRoute, useParams } from "@tanstack/react-router";
import { AsesmenInput } from "../components/akademik/AsesmenInput";

function AsesmenInputPage() {
  const { sekolah, id } = useParams({ from: "/sch/$sekolah/akademik/asesmen/$id" });
  return <AsesmenInput asesmenId={id} sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/akademik/asesmen/$id")({
  component: AsesmenInputPage,
});
