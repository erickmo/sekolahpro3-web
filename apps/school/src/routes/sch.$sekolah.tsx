import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSessionStore } from "@sekolahpro/auth";
import { TenantMismatchError } from "@sekolahpro/api-client";
import { useMySchools } from "../data/sekolah";

function SekolahLayout() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const active = useSessionStore((s) => s.activeSekolah);
  const setActiveSekolah = useSessionStore((s) => s.setActiveSekolah);
  const { data, isLoading } = useMySchools();

  const match = data?.groups
    .flatMap((g) => g.schools)
    .find((s) => s.slug === sekolah);

  useEffect(() => {
    if (!match) return;
    if (active?.slug === match.slug) return;
    setActiveSekolah({
      name: match.sekolah,
      nama: match.nama,
      subdomain: match.subdomain,
      slug: match.slug,
    });
  }, [match, active, setActiveSekolah]);

  if (data && !match) throw notFound();

  if (active?.slug === sekolah) return <Outlet />;

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-fg text-sm">
      {isLoading ? "Memuat sekolah..." : "Menyiapkan..."}
    </div>
  );
}

function SekolahNotFound() {
  const { sekolah } = useParams({ strict: false }) as { sekolah?: string };
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="max-w-md w-full text-center px-6 py-12">
        <div className="text-6xl font-bold text-muted-fg mb-3">404</div>
        <h1 className="text-xl font-semibold text-fg mb-2">Sekolah tidak ditemukan</h1>
        <p className="text-sm text-muted-fg mb-6">
          {sekolah ? (
            <>
              Akun Anda tidak memiliki akses ke sekolah{" "}
              <code className="px-1.5 py-0.5 rounded bg-muted text-fg">{sekolah}</code>{" "}
              atau sekolah tersebut tidak ada.
            </>
          ) : (
            "Sumber daya yang diminta tidak tersedia di sekolah ini."
          )}
        </p>
        <Link
          to="/pilih"
          className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-brand text-white text-sm font-medium hover:bg-brand/90"
        >
          Pilih sekolah lain
        </Link>
      </div>
    </div>
  );
}

function SekolahErrorBoundary({ error }: ErrorComponentProps) {
  // Cross-tenant deep links surface as TenantMismatchError from the api-client
  // when a fetched doc's `sekolah` doesn't match the active school. Render
  // the same 404 page so we don't leak the existence of another school's data.
  if (error instanceof TenantMismatchError) return <SekolahNotFound />;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-fg">
      <div className="text-2xl font-semibold">Terjadi kesalahan</div>
      <div className="text-muted-fg text-sm">{error.message}</div>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah")({
  component: SekolahLayout,
  notFoundComponent: SekolahNotFound,
  errorComponent: SekolahErrorBoundary,
});
