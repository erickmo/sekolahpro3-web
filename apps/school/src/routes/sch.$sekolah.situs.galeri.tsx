import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { GALERI_SCHEMA } from "../features/situs/schemas";

function GaleriCms() {
  const { sekolah } = Route.useParams();
  return <KontenManager sekolah={sekolah} schema={GALERI_SCHEMA} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/galeri")({ component: GaleriCms });
