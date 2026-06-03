import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { BERITA_SCHEMA } from "../features/situs/schemas";

export function BeritaPage({ sekolah }: { sekolah: string }) {
  return <KontenManager sekolah={sekolah} schema={BERITA_SCHEMA} guideId="berita" />;
}

function BeritaCms() {
  const { sekolah } = Route.useParams();
  return <BeritaPage sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/berita")({ component: BeritaCms });
