import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { HALAMAN_SCHEMA } from "../features/situs/schemas";

export function HalamanPage({ sekolah }: { sekolah: string }) {
  return <KontenManager sekolah={sekolah} schema={HALAMAN_SCHEMA} guideId="halaman" />;
}

function HalamanCms() {
  const { sekolah } = Route.useParams();
  return <HalamanPage sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/halaman")({ component: HalamanCms });
