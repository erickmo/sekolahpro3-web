import { useState } from "react";
import { Button, Input } from "@sekolahpro/ui";
import { useStaffListPersonsForNis } from "../data/pickup";

export interface PinFallbackValues {
  nis: string;
  pickupPersonId: string;
  pin: string;
  gate: string | null;
}

interface Props {
  gate: string | null;
  onSubmit: (v: PinFallbackValues) => void;
}

export function PinFallbackForm({ gate, onSubmit }: Props) {
  const [nis, setNis] = useState("");
  const [submittedNis, setSubmittedNis] = useState<string | null>(null);
  const persons = useStaffListPersonsForNis(submittedNis);
  const [personId, setPersonId] = useState("");
  const [pin, setPin] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="pin-nis" className="text-sm font-medium text-fg">NIS</label>
          <Input id="pin-nis" value={nis} onChange={(e) => setNis(e.target.value)} />
        </div>
        <div className="self-end">
          <Button type="button" onClick={() => setSubmittedNis(nis.trim() || null)}>Cari</Button>
        </div>
      </div>

      {submittedNis ? (
        persons.isLoading ? (
          <div className="text-sm text-muted-fg">Memuat penjemput…</div>
        ) : (persons.data ?? []).length === 0 ? (
          <div className="text-sm text-danger">Tidak ada penjemput terdaftar untuk NIS ini.</div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label htmlFor="pin-person" className="text-sm font-medium text-fg">Penjemput</label>
              <select
                id="pin-person"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-sm"
              >
                <option value="">Pilih penjemput</option>
                {(persons.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.nama} · {p.hubungan}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pin-pin" className="text-sm font-medium text-fg">PIN</label>
              <Input id="pin-pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} />
            </div>
            <Button
              type="button"
              disabled={!personId || pin.length !== 6}
              onClick={() => onSubmit({ nis: submittedNis, pickupPersonId: personId, pin, gate })}
            >Verifikasi</Button>
          </>
        )
      ) : null}
    </div>
  );
}
