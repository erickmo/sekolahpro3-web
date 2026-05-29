export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div role="status" className="bg-amber-500 text-white text-sm text-center py-2">
      Offline — transaksi tap kartu dinonaktifkan sampai koneksi pulih.
    </div>
  );
}
