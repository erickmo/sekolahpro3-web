import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@sekolahpro/ui";

export const Route = createFileRoute("/pesan")({
  component: () => (
    <PlaceholderPage
      eyebrow="Komunikasi"
      title="Pesan"
      description="Pesan dengan wali kelas dan teman."
    />
  ),
});
