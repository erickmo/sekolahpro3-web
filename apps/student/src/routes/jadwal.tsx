import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@sekolahpro/ui";

export const Route = createFileRoute("/jadwal")({
  component: () => (
    <PlaceholderPage
      eyebrow="Akademik"
      title="Jadwal"
      description="Jadwal pelajaran mingguan."
    />
  ),
});
