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
import { findKoperasiBySlug } from "../lib/koperasi/resolveKoperasi";

/**
 * Top-level layout route for an org-level Koperasi (`/koperasi/$id`).
 *
 * Uses a LITERAL `/koperasi/` prefix (not a bare `$koperasi` param) so it does
 * not collide with the bare `$sekolah` route — both would otherwise match the
 * same `/<slug>` URL and `$sekolah` would shadow it. The `id` param is the
 * Koperasi slug (= sekolah_utama `kode_pendek`). We resolve it against the
 * user's accessible koperasi list, anchor the session to that school, 404 when
 * there is no match, and gate the Outlet until the store reflects it. A
 * `TenantMismatchError` renders the same 404 so we never leak another tenant's
 * data.
 */
function KoperasiTenantLayout() {
  const { id } = useParams({ from: "/koperasi/$id" });
  const active = useSessionStore((s) => s.activeSekolah);
  const setActiveSekolah = useSessionStore((s) => s.setActiveSekolah);
  const { data, isLoading } = useMySchools();

  const match = findKoperasiBySlug(data?.koperasi, id);

  useEffect(() => {
    if (!match) return;
    if (active?.slug === match.slug) return;
    setActiveSekolah({
      name: match.koperasi,
      nama: match.nama,
      subdomain: null,
      slug: match.slug,
    });
  }, [match, active, setActiveSekolah]);

  if (data && !match) throw notFound();

  if (active?.slug === id) return <Outlet />;

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-fg text-sm">
      {isLoading ? "Memuat koperasi..." : "Menyiapkan..."}
    </div>
  );
}

function KoperasiNotFound() {
  const { id } = useParams({ strict: false }) as { id?: string };
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="max-w-md w-full text-center px-6 py-12">
        <div className="text-6xl font-bold text-muted-fg mb-3">404</div>
        <h1 className="text-xl font-semibold text-fg mb-2">Koperasi tidak ditemukan</h1>
        <p className="text-sm text-muted-fg mb-6">
          {id ? (
            <>
              Akun Anda tidak memiliki akses ke koperasi{" "}
              <code className="px-1.5 py-0.5 rounded bg-muted text-fg">{id}</code>{" "}
              atau koperasi tersebut tidak ada.
            </>
          ) : (
            "Sumber daya yang diminta tidak tersedia di koperasi ini."
          )}
        </p>
        <Link
          to="/pilih-sekolah"
          className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-brand text-white text-sm font-medium hover:bg-brand/90"
        >
          Pilih koperasi lain
        </Link>
      </div>
    </div>
  );
}

function KoperasiErrorBoundary({ error }: ErrorComponentProps) {
  if (error instanceof TenantMismatchError) return <KoperasiNotFound />;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-fg">
      <div className="text-2xl font-semibold">Terjadi kesalahan</div>
      <div className="text-muted-fg text-sm">{error.message}</div>
    </div>
  );
}

export const Route = createFileRoute("/koperasi/$id")({
  component: KoperasiTenantLayout,
  notFoundComponent: KoperasiNotFound,
  errorComponent: KoperasiErrorBoundary,
});
