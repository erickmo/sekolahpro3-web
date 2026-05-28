import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@sekolahpro/ui";

export const Route = createFileRoute("/tugas")({
  component: () => (
    <PlaceholderPage
      eyebrow="Belajar"
      title="Tugas"
      description="Daftar tugas dan PR yang harus dikumpulkan."
    />
  ),
});
