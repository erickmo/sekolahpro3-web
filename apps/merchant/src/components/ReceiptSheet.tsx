import { Button } from "@sekolahpro/ui";

interface Props {
  txnId: string;
  namaSiswa: string;
  nominal: number;
  balanceAfter: number;
  voidDeadlineIso: string;
  onClose: () => void;
  onVoid?: () => void;
}

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function ReceiptSheet({
  txnId,
  namaSiswa,
  nominal,
  balanceAfter,
  voidDeadlineIso,
  onClose,
  onVoid,
}: Props) {
  const canVoid = new Date(voidDeadlineIso).getTime() > Date.now();
  return (
    <div className="flex flex-col items-center gap-1 p-6 text-center">
      <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-3xl text-brand">
        ✓
      </div>
      <div className="text-xl font-semibold text-fg">Pembayaran berhasil</div>
      <div className="text-xs text-muted-fg">{txnId}</div>
      <div className="mt-2 text-sm font-medium text-fg">{namaSiswa}</div>
      <div className="text-4xl font-bold tabular-nums text-fg">{formatRp(nominal)}</div>
      <div className="mt-1 text-sm text-muted-fg">
        Sisa saldo: <span className="tabular-nums text-fg">{formatRp(balanceAfter)}</span>
      </div>
      <div className="mt-5 flex w-full gap-2">
        <Button onClick={onClose} className="h-12 flex-1">Selesai</Button>
        {canVoid && onVoid && (
          <Button variant="ghost" onClick={onVoid} className="h-12">
            Batalkan
          </Button>
        )}
      </div>
    </div>
  );
}
