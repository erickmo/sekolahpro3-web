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
 * Top-level layout route for an org-level Koperasi (`/$koperasi`).
 *
 * Mirrors the `$sekolah.tsx` tenant guard so a selected Koperasi has its own
 * bookmarkable URL not bound to first picking a school. The `koperasi` param is
 * the Koperasi slug (= sekolah_utama `kode_pendek`). We resolve it against the
 * user's accessible koperasi list, set the active sekolah (the anchor school the
 * session is scoped to), 404 when there is no match, and gate the Outlet until
 * the store reflects the matched school. A `TenantMismatchError` surfaced from a
 * cross-tenant deep link renders the same 404 so we never leak another tenant's
 * data.
 */
function KoperasiTenantLayout() {
  const { koperasi } = useParams({ from: "/$koperasi" });
  const active = useSessionStore((s) => s.activeSekolah);
  const setActiveSekolah = useSessionStore((s) => s.setActiveSekolah);
  const { data, isLoading } = useMySchools();

  const match = findKoperasiBySlug(data?.koperasi, koperasi);

  useEffect(() => {
    if (!match) return;
    if (active?.slug === match.slug) return;
    // The koperasi card carries no `name`/`subdomain` for the anchor school; the
    // slug is the anchor school's kode_pendek, so we scope the session to it.
    setActiveSekolah({
      name: match.koperasi,
      nama: match.nama,
      subdomain: null,
      slug: match.slug,
    });
  }, [match, active, setActiveSekolah]);

  if (data && !match) throw notFound();

  if (active?.slug === koperasi) return <Outlet />;

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-fg text-sm">
      {isLoading ? "Memuat koperasi..." : "Menyiapkan..."}
    </div>
  );
}

function KoperasiNotFound() {
  const { koperasi } = useParams({ strict: false }) as { koperasi?: string };
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="max-w-md w-full text-center px-6 py-12">
        <div className="text-6xl font-bold text-muted-fg mb-3">404</div>
        <h1 className="text-xl font-semibold text-fg mb-2">Koperasi tidak ditemukan</h1>
        <p className="text-sm text-muted-fg mb-6">
          {koperasi ? (
            <>
              Akun Anda tidak memiliki akses ke koperasi{" "}
              <code className="px-1.5 py-0.5 rounded bg-muted text-fg">{koperasi}</code>{" "}
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
  // Cross-tenant deep links surface as TenantMismatchError from the api-client
  // when a fetched doc's tenant doesn't match the active scope. Render the same
  // 404 page so we don't leak the existence of another tenant's data.
  if (error instanceof TenantMismatchError) return <KoperasiNotFound />;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-fg">
      <div className="text-2xl font-semibold">Terjadi kesalahan</div>
      <div className="text-muted-fg text-sm">{error.message}</div>
    </div>
  );
}

export const Route = createFileRoute("/$koperasi")({
  component: KoperasiTenantLayout,
  notFoundComponent: KoperasiNotFound,
  errorComponent: KoperasiErrorBoundary,
});
