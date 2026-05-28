import { createFileRoute, Outlet, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSessionStore } from "@sekolahpro/auth";

function SekolahLayout() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const navigate = useNavigate();
  const active = useSessionStore((s) => s.activeSekolah);

  // If the URL slug doesn't match the active sekolah (or none active),
  // bounce to /pilih-sekolah so the user re-selects. This guards against
  // typing a foreign slug into the URL bar or copy-pasted links.
  useEffect(() => {
    if (!active || active.slug !== sekolah) {
      navigate({ to: "/pilih-sekolah" });
    }
  }, [active, sekolah, navigate]);

  if (!active || active.slug !== sekolah) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-fg">
        Mengarahkan...
      </div>
    );
  }

  return <Outlet />;
}

export const Route = createFileRoute("/$sekolah")({
  component: SekolahLayout,
});
