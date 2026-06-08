/**
 * MasukDesk — the TU / default "Masuk" inbox lane (public-contact triage).
 *
 * This is the original sch.$sekolah.pesan.tsx split-pane, moved into a component
 * unchanged in behavior, now decomposed into InboxList + ConversationView + a stats
 * strip so no single file is a god-component. The Outbox dispatch envelope is built by
 * lib/pesan/compose (single source) instead of being inlined here.
 *
 * Mounted by the Pesan index for primary role `tu` AND as the permissive fallback, so an
 * unrecognized session always lands on today's working inbox (zero regression).
 */
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  IconChat,
  IconPlus,
  IconAlert,
  IconCheck,
  IconFile,
  IconPrint,
  ModuleFlow,
  type ModuleFlowStep,
} from "@sekolahpro/ui";
import { useResourceList, useResourceCreate, useResourceUpdate } from "@sekolahpro/api-client";
import { PesanComposeModal } from "./PesanComposeModal";
import { InboxList } from "./InboxList";
import { ConversationView } from "./ConversationView";
import { PageGuide } from "../guide";
import { MISC_PAGE_GUIDES } from "../guide/miscPageGuides";
import { SCHOOL_ROLE_LABEL } from "../../lib/schoolGuideRole";
import {
  INBOX_DOCTYPE,
  OUTBOX_DOCTYPE,
  computeInboxStats,
  filterInbox,
  type FilterKey,
  type InboxRow,
} from "../../lib/pesan/inbox";
import { buildReplyPayload, newIdempotencyKey } from "../../lib/pesan/compose";

const INBOX_FIELDS = ["name", "nama", "email", "telepon", "pesan", "status", "submitted_at", "creation"];
const INBOX_LIMIT = 100;
const STATUS_BARU = "Baru";
const STATUS_DIBALAS = "Dibalas";
const STATUS_SELESAI = "Selesai";

const PESAN_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "inbox", label: "Cek Inbox", hint: "Pesan masuk publik" },
  { key: "respond", label: "Balas Pesan", hint: "Jawab via inline reply" },
  { key: "compose", label: "Catat Pesan", hint: "Walk-in / telepon / WA" },
  { key: "resolve", label: "Tandai Selesai", hint: "Tutup percakapan" },
];

export function MasukDesk() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("Semua");
  const [draft, setDraft] = useState("");
  const [showCompose, setShowCompose] = useState(false);

  const qc = useQueryClient();

  const listQuery = useResourceList<InboxRow>(INBOX_DOCTYPE, {
    fields: INBOX_FIELDS,
    order_by: "creation desc",
    limit_page_length: INBOX_LIMIT,
  });

  const createOutbox = useResourceCreate(OUTBOX_DOCTYPE);
  const updateInbox = useResourceUpdate(INBOX_DOCTYPE);

  const items = useMemo<InboxRow[]>(() => listQuery.data ?? [], [listQuery.data]);
  const filtered = useMemo<InboxRow[]>(() => filterInbox(items, search, filter), [items, search, filter]);
  const selected = useMemo<InboxRow | undefined>(
    () => (!selectedId ? filtered[0] : items.find((p) => p.name === selectedId)),
    [selectedId, items, filtered],
  );
  const stats = useMemo(() => computeInboxStats(items), [items]);

  const handleSend = async () => {
    if (!draft.trim() || !selected) return;
    const payload = buildReplyPayload({
      inbox: selected.name,
      to: selected.email ?? "",
      body: draft.trim(),
      idempotencyKey: newIdempotencyKey(),
    });
    try {
      await createOutbox.mutateAsync(payload);
      if (selected.status === STATUS_BARU) {
        await updateInbox.mutateAsync({ name: selected.name, patch: { status: STATUS_DIBALAS } });
      }
      qc.invalidateQueries({ queryKey: ["resource:list", INBOX_DOCTYPE] });
      qc.invalidateQueries({ queryKey: ["resource:list", OUTBOX_DOCTYPE] });
      setDraft("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    }
  };

  const handleMarkAll = async () => {
    const targets = items.filter((p) => p.status === STATUS_BARU);
    if (targets.length === 0) return;
    try {
      await Promise.all(
        targets.map((p) => updateInbox.mutateAsync({ name: p.name, patch: { status: STATUS_SELESAI } })),
      );
      qc.invalidateQueries({ queryKey: ["resource:list", INBOX_DOCTYPE] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menandai pesan.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Komunikasi"
        title="Pesan Masuk"
        description="Inbox dari formulir kontak publik dan kanal komunikasi terjadwal."
        actions={
          <>
            <Button variant="outline" onClick={handleMarkAll} disabled={updateInbox.isPending}>
              <span className="h-4 w-4 mr-1.5"><IconCheck /></span>
              Tandai Semua Selesai
            </Button>
            <Button onClick={() => setShowCompose(true)}>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Catat Pesan Masuk
            </Button>
          </>
        }
      />

      <PageGuide
        storageNamespace="school-guide:"
        storageId="pesan"
        title={MISC_PAGE_GUIDES.pesan.title}
        intro={MISC_PAGE_GUIDES.pesan.intro}
        steps={MISC_PAGE_GUIDES.pesan.steps}
        tips={MISC_PAGE_GUIDES.pesan.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Pesan" value={stats.total.toLocaleString("id-ID")} icon={<IconChat />} accent="brand" />
        <StatCard label="Baru" value={stats.baru.toLocaleString("id-ID")} icon={<IconAlert />} accent="rose" hint="butuh respon" />
        <StatCard label="Dibalas" value={stats.dibalas.toLocaleString("id-ID")} icon={<IconPrint />} accent="amber" />
        <StatCard label="Selesai" value={stats.selesai.toLocaleString("id-ID")} icon={<IconFile />} accent="emerald" />
      </div>

      <ModuleFlow
        title="Alur Penanganan Pesan"
        description="Urutan kerja dari pesan masuk sampai diselesaikan."
        steps={PESAN_FLOW_STEPS}
      />

      <SectionCard padded={false}>
        <div className="grid grid-cols-[320px_1fr] gap-0 min-h-[640px]">
          <InboxList
            rows={filtered}
            selectedName={selected?.name ?? null}
            search={search}
            filter={filter}
            loading={listQuery.isLoading}
            error={listQuery.isError}
            onSearch={setSearch}
            onFilter={setFilter}
            onSelect={setSelectedId}
          />
          <div className="flex flex-col min-h-[640px]">
            {selected ? (
              <ConversationView
                pesan={selected}
                draft={draft}
                onDraftChange={setDraft}
                onSend={handleSend}
                sending={createOutbox.isPending || updateInbox.isPending}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState title="Pilih pesan" description="Pilih salah satu pesan di sebelah kiri untuk membalas." />
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <PesanComposeModal
        open={showCompose}
        onClose={() => setShowCompose(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["resource:list", INBOX_DOCTYPE] });
        }}
      />
    </div>
  );
}
