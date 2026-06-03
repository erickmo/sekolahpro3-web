import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { GALERI_SCHEMA } from "../features/situs/schemas";

export function GaleriPage({ sekolah }: { sekolah: string }) {
  return <KontenManager sekolah={sekolah} schema={GALERI_SCHEMA} guideId="galeri" />;
}

function GaleriCms() {
  const { sekolah } = Route.useParams();
  return <GaleriPage sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/galeri")({ component: GaleriCms });
