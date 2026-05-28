import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useSessionStore } from "@sekolahpro/auth";
import { useMySchools } from "../data/sekolah";

function SekolahLayout() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const navigate = useNavigate();
  const active = useSessionStore((s) => s.activeSekolah);
  const setActiveSekolah = useSessionStore((s) => s.setActiveSekolah);
  const { data, isLoading } = useMySchools();

  // Trust the URL: derive activeSekolah directly from the cached schools
  // list. Avoids the chooser→navigate race and makes deep links work.
  useEffect(() => {
    if (active?.slug === sekolah) return;
    if (!data) return;
    const match = data.groups
      .flatMap((g) => g.schools)
      .find((s) => s.slug === sekolah);
    if (!match) {
      navigate({ to: "/pilih-sekolah" });
      return;
    }
    setActiveSekolah({
      name: match.sekolah,
      nama: match.nama,
      subdomain: match.subdomain,
      slug: match.slug,
    });
  }, [active, sekolah, data, setActiveSekolah, navigate]);

  if (active?.slug === sekolah) return <Outlet />;

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-fg text-sm">
      {isLoading ? "Memuat sekolah..." : "Mengarahkan..."}
    </div>
  );
}

export const Route = createFileRoute("/$sekolah")({
  component: SekolahLayout,
});
