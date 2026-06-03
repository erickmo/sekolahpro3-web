import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { HALAMAN_SCHEMA } from "../features/situs/schemas";

function HalamanCms() {
  const { sekolah } = Route.useParams();
  return <KontenManager sekolah={sekolah} schema={HALAMAN_SCHEMA} guideId="halaman" />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/halaman")({ component: HalamanCms });
