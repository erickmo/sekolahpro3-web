import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import {
  useStaffScanToken,
  useStaffVerifyPin,
  useStaffCompletePickup,
  useStaffDeclinePickup,
  useStaffWatchEvent,
} from "../data/pickup";
import type { PickupEvent, PickupError } from "../data/pickup-types";
import { QrScanner } from "../components/QrScanner";
import { PinFallbackForm } from "../components/PinFallbackForm";
import { PickupReleaseCard } from "../components/PickupReleaseCard";

const GATES = ["Gerbang Utama", "Gerbang Belakang", "Lobi"];

function PickupVerifyPage() {
  const [gate, setGate] = useState<string>(GATES[0]!);
  const [event, setEvent] = useState<PickupEvent | null>(null);
  const [error, setError] = useState<PickupError | null>(null);

  const scan = useStaffScanToken();
  const pinVerify = useStaffVerifyPin();
  const complete = useStaffCompletePickup();
  const decline = useStaffDeclinePickup();

  const watch = useStaffWatchEvent(event?.status === "pending" ? event.id : null);
  const liveStatus = watch.data?.status ?? event?.status ?? null;
  const isWaitingParent = liveStatus === "pending";

  function reset() {
    setEvent(null);
    setError(null);
  }

  async function handleScanText(token: string) {
    setError(null);
    try {
      const ev = await scan.mutateAsync({ token, gate });
      setEvent(ev);
    } catch (e) {
      setError(e as PickupError);
    }
  }

  async function handlePinSubmit(v: { nis: string; pickupPersonId: string; pin: string; gate: string | null }) {
    setError(null);
    try {
      const ev = await pinVerify.mutateAsync(v);
      setEvent(ev);
    } catch (e) {
      setError(e as PickupError);
    }
  }

  async function handleComplete() {
    if (!event) return;
    await complete.mutateAsync({ eventId: event.id });
    setTimeout(reset, 3000);
  }

  async function handleDecline(note: string) {
    if (!event) return;
    await decline.mutateAsync({ eventId: event.id, note });
    setTimeout(reset, 3000);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Verifikasi Penjemputan" description="Scan QR atau gunakan PIN" />

      <div className="flex items-center gap-2 text-sm">
        <label className="text-muted-fg">Gerbang:</label>
        <select
          value={gate}
          onChange={(e) => setGate(e.target.value)}
          className="rounded-md border border-border bg-bg px-2 py-1 text-sm"
        >
          {GATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {error ? (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          [{error.errorCode}] {error.message}
        </div>
      ) : null}

      {event ? (
        <PickupReleaseCard
          event={event}
          isWaitingParent={isWaitingParent}
          isCompleting={complete.isPending}
          isDeclining={decline.isPending}
          onComplete={handleComplete}
          onDecline={handleDecline}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Scan QR">
            <QrScanner onDecode={handleScanText} />
          </SectionCard>
          <SectionCard title="Fallback PIN">
            <PinFallbackForm gate={gate} onSubmit={handlePinSubmit} />
          </SectionCard>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/pickup-verify")({
  component: PickupVerifyPage,
});
