import { createFileRoute } from "@tanstack/react-router";
import { KontenManager } from "../features/situs/KontenManager";
import { AGENDA_SCHEMA } from "../features/situs/schemas";

function AgendaCms() {
  const { sekolah } = Route.useParams();
  return <KontenManager sekolah={sekolah} schema={AGENDA_SCHEMA} guideId="agenda" />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/agenda")({ component: AgendaCms });
