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
import { SesiKasBanner } from "../components/koperasi/SesiKasBanner";

/**
 * Layout top-level shell Koperasi (`/kop/$sekolah`).
 *
 * Menggabungkan dua peran: (1) resolver tenant — mencocokkan slug ke daftar
 * koperasi yang bisa diakses, meng-anchor session, 404 bila tak cocok; dan
 * (2) shell konten koperasi (banner sesi kas + Outlet). Navigasi modul
 * koperasi kini hidup di SIDEBAR (root layout, lihat KOPERASI_NAV) sehingga
 * shell ini hanya koperasi-only — terpisah dari menu sekolah.
 *
 * Param bernama `sekolah` (= kode_pendek) dipakai bersama tree `/sch`, tapi
 * resolusinya berbeda: di sini dicocokkan ke `data.koperasi`, bukan `schools`.
 */
function KoperasiTenantLayout() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const active = useSessionStore((s) => s.activeSekolah);
  const setActiveSekolah = useSessionStore((s) => s.setActiveSekolah);
  const { data, isLoading } = useMySchools();

  const match = findKoperasiBySlug(data?.koperasi, sekolah);

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

  if (active?.slug !== sekolah) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-fg text-sm">
        {isLoading ? "Memuat koperasi..." : "Menyiapkan..."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SesiKasBanner />
      <Outlet />
    </div>
  );
}

function KoperasiNotFound() {
  const { sekolah } = useParams({ strict: false }) as { sekolah?: string };
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="max-w-md w-full text-center px-6 py-12">
        <div className="text-6xl font-bold text-muted-fg mb-3">404</div>
        <h1 className="text-xl font-semibold text-fg mb-2">Koperasi tidak ditemukan</h1>
        <p className="text-sm text-muted-fg mb-6">
          {sekolah ? (
            <>
              Akun Anda tidak memiliki akses ke koperasi{" "}
              <code className="px-1.5 py-0.5 rounded bg-muted text-fg">{sekolah}</code>{" "}
              atau koperasi tersebut tidak ada.
            </>
          ) : (
            "Sumber daya yang diminta tidak tersedia di koperasi ini."
          )}
        </p>
        <Link
          to="/pilih"
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

export const Route = createFileRoute("/kop/$sekolah")({
  component: KoperasiTenantLayout,
  notFoundComponent: KoperasiNotFound,
  errorComponent: KoperasiErrorBoundary,
});
