import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNfcReader, type CardToken } from "@sekolahpro/card";
import { merchantApi, type CatalogItem } from "../lib/merchant-api";
import { CatalogGrid } from "../components/CatalogGrid";
import { Cart, type CartLine } from "../components/Cart";
import { CardReaderSheet } from "../components/CardReaderSheet";
import { QuickAmountPad } from "../components/QuickAmountPad";
import { useMerchantContext } from "../lib/merchant-session";
import { useConnectivity } from "../lib/connectivity";
import { tapPay } from "../lib/tap-pay";
import { chargeErrorMessage } from "../lib/error-codes";
import { AdBanner } from "@sekolahpro/ads";

function pingFn() {
  return fetch("/api/method/ping")
    .then((r) => r.ok)
    .catch(() => false);
}

function PosPage() {
  const nav = useNavigate();
  const ctx = useMerchantContext();
  const { online } = useConnectivity({ pingFn, intervalMs: 10000 });
  const { supported: nfcSupported } = useNfcReader({ enabled: false });
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: merchantApi.getCatalog });
  const [lines, setLines] = useState<CartLine[]>([]);
  const [kategori, setKategori] = useState("ALL");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const addItem = (it: CatalogItem) => {
    setLines((prev) => {
      const exist = prev.find((l) => l.item.name === it.name);
      if (exist)
        return prev.map((l) =>
          l.item.name === it.name ? { ...l, qty: l.qty + 1 } : l,
        );
      return [
        ...prev,
        { item: { name: it.name, nama: it.nama, harga: it.harga }, qty: 1 },
      ];
    });
  };
  const changeQty = (n: string, q: number) =>
    setLines((p) =>
      q === 0
        ? p.filter((l) => l.item.name !== n)
        : p.map((l) => (l.item.name === n ? { ...l, qty: q } : l)),
    );
  const remove = (n: string) => setLines((p) => p.filter((l) => l.item.name !== n));

  const total =
    pendingAmount ?? lines.reduce((a, l) => a + l.item.harga * l.qty, 0);

  const onTap = () => {
    setErr(null);
    setSheetOpen(true);
  };

  const handleToken = async (token: CardToken) => {
    if (busy) return;
    setBusy(true);
    const result = await tapPay({
      api: merchantApi,
      idempotency: { next: () => crypto.randomUUID() },
      input: {
        terminal_id: ctx.terminalId,
        card_token: token.raw,
        items: lines.map((l) => ({ name: l.item.name, qty: l.qty })),
        amount: total,
      },
    });
    setBusy(false);
    setSheetOpen(false);
    if (result.kind === "ok") {
      setLines([]);
      setPendingAmount(null);
      nav({
        to: "/pos/confirm/$txnId",
        params: { txnId: result.receipt.txn_name },
      });
    } else {
      setErr(chargeErrorMessage(result.code));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <AdBanner slot="merchant-dashboard-top" className="mb-4 w-full" />
        {catalog.data && (
          <CatalogGrid
            items={catalog.data}
            kategoriFilter={kategori}
            onKategoriChange={setKategori}
            onAdd={addItem}
          />
        )}
        <button
          className="mx-3 my-2 px-3 py-2 border rounded"
          onClick={() => setQuickOpen(true)}
        >
          Manual amount
        </button>
      </div>
      <Cart
        lines={lines}
        disabled={!online || busy}
        onChangeQty={changeQty}
        onRemove={remove}
        onTap={onTap}
      />
      {err && (
        <div role="alert" className="text-red-600 text-sm p-2">
          {err}
        </div>
      )}
      <CardReaderSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onToken={handleToken}
        nfcSupported={nfcSupported}
      />
      {quickOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end">
          <div className="w-full bg-bg rounded-t-xl">
            <QuickAmountPad
              onCancel={() => setQuickOpen(false)}
              onConfirm={(amt) => {
                setPendingAmount(amt);
                setLines([]);
                setQuickOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_app/pos/")({ component: PosPage });
