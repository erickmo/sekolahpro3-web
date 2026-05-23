import { Outlet } from "react-router-dom";
import { Button } from "@sekolahpro/ui";

export function Home() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-5xl font-semibold text-fg">SekolahPro</h1>
      <p className="text-lg text-muted-fg mt-4 max-w-2xl">
        Platform manajemen sekolah modern untuk SD, SMP, SMA — akademik, keuangan, PPDB, koperasi.
      </p>
      <div className="mt-8 flex gap-3">
        <Button>Coba gratis</Button>
        <Button variant="outline">Lihat fitur</Button>
      </div>
    </main>
  );
}

export function Fitur() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-semibold text-fg">Fitur</h1>
      <p className="text-muted-fg mt-2">Daftar fitur akan diisi pada spec berikutnya.</p>
    </main>
  );
}

export function App() {
  return <Outlet />;
}
