import { Button } from "@sekolahpro/ui";

/**
 * In-table empty/error message shown by ResourceListPage's DataTable when the
 * CURRENT query (filtered or searched) returns no rows, or failed. This is the
 * "filter matched nothing" / load-error case — distinct from the first-run
 * onboarding empty-state, which the page renders instead of the table entirely.
 * @param isError whether the list query failed
 * @param errorMessage message to surface when isError is true
 * @param onRetry refetch callback wired to the "Coba lagi" button on error
 */
export function ListTableEmpty({
  isError,
  errorMessage,
  onRetry,
}: {
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}) {
  return (
    <div>
      <div className="font-medium text-fg">
        {isError ? "Gagal memuat data" : "Belum ada data"}
      </div>
      <div className="text-xs mt-1">
        {isError ? errorMessage : "Coba ubah filter atau buat data baru."}
      </div>
      {isError ? (
        <div className="mt-3">
          <Button variant="outline" onClick={onRetry}>
            Coba lagi
          </Button>
        </div>
      ) : null}
    </div>
  );
}
