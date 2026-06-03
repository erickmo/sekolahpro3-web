import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { BERITA_SCHEMA } from "../features/situs/schemas";

function BeritaCms() {
  const { sekolah } = Route.useParams();
  return <KontenManager sekolah={sekolah} schema={BERITA_SCHEMA} guideId="berita" />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/berita")({ component: BeritaCms });
