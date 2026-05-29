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
    <div className="p-4 flex flex-col gap-2">
      <div className="text-2xl text-emerald-600 font-semibold">✓ Berhasil</div>
      <div className="text-sm text-muted-fg">{txnId}</div>
      <div className="text-lg">{namaSiswa}</div>
      <div className="text-3xl tabular-nums">{formatRp(nominal)}</div>
      <div className="text-sm">
        Sisa saldo: <span className="tabular-nums">{formatRp(balanceAfter)}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={onClose}>Selesai</Button>
        {canVoid && onVoid && (
          <Button variant="ghost" onClick={onVoid}>
            Batalkan
          </Button>
        )}
      </div>
    </div>
  );
}
