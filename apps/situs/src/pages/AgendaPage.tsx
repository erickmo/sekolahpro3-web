import { AgendaPreview } from "../sections/AgendaPreview";

/** Full agenda listing. */
export function AgendaPage() {
  return <AgendaPreview limit={100} />;
}
