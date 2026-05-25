import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@sekolahpro/ui";

export const Route = createFileRoute("/absensi")({
  component: () => (
    <PlaceholderPage
      eyebrow="Akademik"
      title="Absensi"
      description="Rekap kehadiran kamu."
    />
  ),
});
