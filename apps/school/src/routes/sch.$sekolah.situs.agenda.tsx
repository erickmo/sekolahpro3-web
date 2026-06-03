import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { AGENDA_SCHEMA } from "../features/situs/schemas";

export function AgendaPage({ sekolah }: { sekolah: string }) {
  return <KontenManager sekolah={sekolah} schema={AGENDA_SCHEMA} guideId="agenda" />;
}

function AgendaCms() {
  const { sekolah } = Route.useParams();
  return <AgendaPage sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/agenda")({ component: AgendaCms });
