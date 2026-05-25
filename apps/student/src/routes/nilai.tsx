import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@sekolahpro/ui";

export const Route = createFileRoute("/nilai")({
  component: () => (
    <PlaceholderPage
      eyebrow="Akademik"
      title="Nilai"
      description="Rekap nilai per mata pelajaran dan semester."
    />
  ),
});
