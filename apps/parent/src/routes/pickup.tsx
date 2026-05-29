import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@sekolahpro/auth";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { useActiveChild } from "../lib/activeChild";
import {
  useListPickupPersons,
  useCreatePickupPerson,
  useUpdatePickupPerson,
  useRevokePickupPerson,
  useIssuePickupToken,
  useListPickupEvents,
  useParentRespondPickup,
} from "../data/pickup";
import type { PickupPerson } from "../data/pickup-types";
import { QRCountdown } from "../components/QRCountdown";
import { PickupPersonForm, type PickupPersonFormValues } from "../components/PickupPersonForm";
import { PickupPersonList } from "../components/PickupPersonList";
import { PickupEventBanner } from "../components/PickupEventBanner";

type Tab = "qr" | "list";

function PickupPage() {
  const { activeNis, children } = useActiveChild();
  const active = children.find((c) => c.nis === activeNis);
  const [tab, setTab] = useState<Tab>("qr");
  const [editing, setEditing] = useState<PickupPerson | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const persons = useListPickupPersons(activeNis);
  const activePersons = useMemo(() => (persons.data ?? []).filter((p) => p.isActive), [persons.data]);

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedPersonId && activePersons.length > 0) setSelectedPersonId(activePersons[0]!.id);
  }, [activePersons, selectedPersonId]);

  const issue = useIssuePickupToken();
  const [token, setToken] = useState<{ token: string; expIso: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!activeNis || !selectedPersonId) return;
    const t = await issue.mutateAsync({ nis: activeNis, pickupPersonId: selectedPersonId });
    setToken(t);
  }, [activeNis, selectedPersonId, issue]);

  useEffect(() => { void refresh(); }, [refresh]);

  const events = useListPickupEvents(activeNis);
  const pending = (events.data ?? []).find((e) => e.status === "pending");
  const respond = useParentRespondPickup();

  const create = useCreatePickupPerson();
  const update = useUpdatePickupPerson();
  const revoke = useRevokePickupPerson();

  function handleCreate(v: PickupPersonFormValues) {
    if (!activeNis) return;
    create.mutate({ nis: activeNis, ...v, photoUrl: v.photoUrl }, { onSuccess: () => setShowAdd(false) });
  }

  function handleUpdate(v: PickupPersonFormValues) {
    if (!editing) return;
    update.mutate({ id: editing.id, nis: editing.nis, ...v }, { onSuccess: () => setEditing(null) });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Penjemputan" description={active ? `${active.nama} · ${active.kelas}` : ""} />

      {pending ? (
        <PickupEventBanner
          event={pending}
          responding={respond.isPending}
          onApprove={() => respond.mutate({ eventId: pending.id, nis: pending.nis, decision: "approve" })}
          onDecline={() => respond.mutate({ eventId: pending.id, nis: pending.nis, decision: "decline" })}
        />
      ) : null}

      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("qr")}
          className={`px-3 py-2 text-sm ${tab === "qr" ? "border-b-2 border-brand font-medium text-fg" : "text-muted-fg"}`}
        >QR</button>
        <button
          type="button"
          onClick={() => setTab("list")}
          className={`px-3 py-2 text-sm ${tab === "list" ? "border-b-2 border-brand font-medium text-fg" : "text-muted-fg"}`}
        >Daftar Penjemput</button>
      </div>

      {tab === "qr" ? (
        <SectionCard title="Tunjukkan QR ke petugas">
          {activePersons.length === 0 ? (
            <div className="text-sm text-muted-fg">Belum ada penjemput aktif. Tambah di tab Daftar Penjemput.</div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5 max-w-xs">
                <label htmlFor="pp-select" className="text-sm font-medium text-fg">Penjemput</label>
                <select
                  id="pp-select"
                  value={selectedPersonId ?? ""}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full rounded-md border border-border bg-bg px-2 py-1.5 text-sm"
                >
                  {activePersons.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama} · {p.hubungan}</option>
                  ))}
                </select>
              </div>
              {token ? (
                <QRCountdown token={token.token} expIso={token.expIso} onRefreshNeeded={() => void refresh()} />
              ) : (
                <div className="text-sm text-muted-fg">Memuat QR…</div>
              )}
            </div>
          )}
        </SectionCard>
      ) : (
        <SectionCard
          title="Daftar penjemput"
          action={
            <button type="button" onClick={() => setShowAdd(true)} className="text-xs text-brand hover:underline">+ Tambah</button>
          }
        >
          {persons.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat…</div>
          ) : (
            <PickupPersonList
              persons={persons.data ?? []}
              onIssueToken={(p) => {
                setSelectedPersonId(p.id);
                setTab("qr");
              }}
              onEdit={(p) => setEditing(p)}
              onRevoke={(p) => revoke.mutate({ id: p.id, nis: p.nis })}
            />
          )}
        </SectionCard>
      )}

      {showAdd ? (
        <SectionCard title="Tambah penjemput">
          <PickupPersonForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} />
        </SectionCard>
      ) : null}

      {editing ? (
        <SectionCard title={`Edit ${editing.nama}`}>
          <PickupPersonForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </SectionCard>
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/pickup")({
  component: () => (<RequireAuth><PickupPage /></RequireAuth>),
});
