import { Button } from "@sekolahpro/ui";
import type { PickupEvent } from "../data/pickup-types";

interface Props {
  event: PickupEvent;
  responding?: boolean;
  onApprove: (event: PickupEvent) => void;
  onDecline: (event: PickupEvent) => void;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PickupEventBanner({ event, responding = false, onApprove, onDecline }: Props) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-warning/40 bg-warning/10 p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-fg">
            Permintaan penjemputan menunggu konfirmasi
          </div>
          <div className="text-xs text-muted-fg">
            <span className="font-medium text-fg">{event.pickupPersonNama}</span>
            {" "}({event.pickupPersonHubungan}) · {event.method === "qr" ? "QR" : "PIN"}
            {" "}· diminta {formatTime(event.requestedAt)}
            {event.gate ? ` · ${event.gate}` : ""}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            disabled={responding}
            onClick={() => onDecline(event)}
          >
            Tolak
          </Button>
          <Button size="sm" disabled={responding} onClick={() => onApprove(event)}>
            {responding ? "Memproses..." : "Setujui"}
          </Button>
        </div>
      </div>
    </div>
  );
}
