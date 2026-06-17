export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div role="status" className="bg-warning px-3 py-2 text-center text-sm font-medium text-white">
      Offline — transaksi tap kartu dinonaktifkan sampai koneksi pulih.
    </div>
  );
}
