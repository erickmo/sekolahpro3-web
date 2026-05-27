import { Link, useSearchParams } from "react-router-dom";

export function PpdbSukses() {
  const [params] = useSearchParams();
  const no = params.get("no") ?? "-";
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
        ✓
      </div>
      <h1 className="text-3xl font-bold">Pendaftaran Diterima</h1>
      <p className="mt-3 text-gray-600">
        Nomor pendaftaran Anda:{" "}
        <span className="font-mono font-semibold">{no}</span>
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Simpan nomor di atas. Panitia akan menghubungi Anda via WhatsApp/email
        setelah verifikasi dokumen (1–3 hari kerja).
      </p>
      <Link to="/" className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 text-white">
        Kembali ke Beranda
      </Link>
    </main>
  );
}
