import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { PRESTASI_SCHEMA } from "../features/situs/schemas";

function PrestasiCms() {
  const { sekolah } = Route.useParams();
  return <KontenManager sekolah={sekolah} schema={PRESTASI_SCHEMA} guideId="prestasi" />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/prestasi")({ component: PrestasiCms });
