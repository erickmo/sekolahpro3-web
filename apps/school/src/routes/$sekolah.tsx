import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useSessionStore } from "@sekolahpro/auth";
import { useMySchools, useSelectSchool } from "../data/sekolah";

function SekolahLayout() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const navigate = useNavigate();
  const active = useSessionStore((s) => s.activeSekolah);
  const setActiveSekolah = useSessionStore((s) => s.setActiveSekolah);
  const { data } = useMySchools();
  const select = useSelectSchool();
  const reconciling = useRef(false);

  // Reconcile URL slug ↔ session store.
  // Scenarios:
  //   (a) active.slug === sekolah → render dashboard. ✅
  //   (b) URL slug is in user's school list but active doesn't match
  //       (e.g. deep link, hard refresh after persist hydrate) → silently
  //       call select_sekolah for that slug and update the store.
  //   (c) URL slug is NOT in user's school list → bounce to /pilih-sekolah.
  //   (d) Schools list not loaded yet → wait one render.
  useEffect(() => {
    if (active?.slug === sekolah) return;
    if (!data) return; // wait for list
    if (reconciling.current) return;

    const match = data.groups
      .flatMap((g) => g.schools)
      .find((s) => s.slug === sekolah);

    if (!match) {
      navigate({ to: "/pilih-sekolah" });
      return;
    }

    reconciling.current = true;
    select.mutate(
      { name: match.sekolah },
      {
        onSuccess: (resp) => {
          setActiveSekolah({
            name: resp.sekolah,
            nama: resp.nama,
            subdomain: resp.subdomain,
            slug: resp.slug,
          });
          reconciling.current = false;
        },
        onError: () => {
          reconciling.current = false;
          navigate({ to: "/pilih-sekolah" });
        },
      },
    );
  }, [active, sekolah, data, select, setActiveSekolah, navigate]);

  if (active?.slug === sekolah) return <Outlet />;

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-fg">
      Mengarahkan...
    </div>
  );
}

export const Route = createFileRoute("/$sekolah")({
  component: SekolahLayout,
});
