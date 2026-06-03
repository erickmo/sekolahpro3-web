import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { PRESTASI_SCHEMA } from "../features/situs/schemas";

export function PrestasiPage({ sekolah }: { sekolah: string }) {
  return <KontenManager sekolah={sekolah} schema={PRESTASI_SCHEMA} />;
}

function PrestasiCms() {
  const { sekolah } = Route.useParams();
  return <PrestasiPage sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/prestasi")({ component: PrestasiCms });
