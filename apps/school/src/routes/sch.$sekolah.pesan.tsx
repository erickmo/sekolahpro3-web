import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  IconChat,
  IconSearch,
  IconPlus,
  IconAlert,
  IconCheck,
  IconFile,
  IconClock,
  IconPrint,
  ModuleFlow,
  type ModuleFlowStep,
} from "@sekolahpro/ui";

const PESAN_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "inbox", label: "Cek Inbox", hint: "Pesan masuk publik" },
  { key: "respond", label: "Balas Pesan", hint: "Jawab via inline reply" },
  { key: "compose", label: "Pesan Baru", hint: "Broadcast wali/staff" },
  { key: "resolve", label: "Tandai Selesai", hint: "Tutup percakapan" },
];
import {
  useResourceList,
  useResourceCreate,
  useResourceUpdate,
} from "@sekolahpro/api-client";
import { PesanComposeModal } from "../components/pesan/PesanComposeModal";
import { PageGuide } from "../components/guide";
import { MISC_PAGE_GUIDES } from "../components/guide/miscPageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

// Wired to backend DocTypes:
//  - inbox: "Contact Inbox SekolahPro"
//  - outbox: "Mobile Outbox Entry"

const INBOX_DOCTYPE = "Contact Inbox SekolahPro";
const OUTBOX_DOCTYPE = "Mobile Outbox Entry";

interface InboxRow {
  name: string;
  nama: string;
  email?: string;
  telepon?: string;
  pesan?: string;
  status?: "Baru" | "Dibalas" | "Selesai";
  submitted_at?: string;
  creation?: string;
}

const STATUS_TONE: Record<string, "warning" | "brand" | "success" | "neutral"> = {
  Baru: "warning",
  Dibalas: "brand",
  Selesai: "success",
};

const FILTERS = ["Semua", "Baru", "Dibalas", "Selesai"] as const;
type FilterKey = (typeof FILTERS)[number];

function formatWaktu(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function stripHtml(html: string): string {
  // Strip tags for safe text rendering; backend stores Text Editor HTML.
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function newIdempotencyKey(): string {
  return `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function PesanPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("Semua");
  const [draft, setDraft] = useState("");
  const [showCompose, setShowCompose] = useState(false);

  const qc = useQueryClient();

  const listQuery = useResourceList<InboxRow>(INBOX_DOCTYPE, {
    fields: ["name", "nama", "email", "telepon", "pesan", "status", "submitted_at", "creation"],
    order_by: "creation desc",
    limit_page_length: 100,
  });

  const createOutbox = useResourceCreate(OUTBOX_DOCTYPE);
  const updateInbox = useResourceUpdate(INBOX_DOCTYPE);

  const items = listQuery.data ?? [];

  const filtered = useMemo<InboxRow[]>(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (q && !`${p.nama} ${p.email ?? ""} ${p.pesan ?? ""}`.toLowerCase().includes(q)) return false;
      if (filter !== "Semua" && p.status !== filter) return false;
      return true;
    });
  }, [items, search, filter]);

  const selected = useMemo<InboxRow | undefined>(() => {
    if (!selectedId) return filtered[0];
    return items.find((p) => p.name === selectedId);
  }, [selectedId, items, filtered]);

  const stats = useMemo(() => {
    const total = items.length;
    const baru = items.filter((p) => p.status === "Baru").length;
    const dibalas = items.filter((p) => p.status === "Dibalas").length;
    const selesai = items.filter((p) => p.status === "Selesai").length;
    return { total, baru, dibalas, selesai };
  }, [items]);

  const handleSend = async () => {
    if (!draft.trim() || !selected) return;
    const payload = {
      idempotency_key: newIdempotencyKey(),
      op: "reply_contact_inbox",
      request_hash: "n/a",
      status: "received",
      response: JSON.stringify({
        to: selected.email,
        inbox: selected.name,
        body: draft.trim(),
      }),
    };
    try {
      await createOutbox.mutateAsync(payload);
      if (selected.status === "Baru") {
        await updateInbox.mutateAsync({ name: selected.name, patch: { status: "Dibalas" } });
      }
      qc.invalidateQueries({ queryKey: ["resource:list", INBOX_DOCTYPE] });
      qc.invalidateQueries({ queryKey: ["resource:list", OUTBOX_DOCTYPE] });
      setDraft("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengirim pesan.");
    }
  };

  const handleMarkAll = async () => {
    const targets = items.filter((p) => p.status === "Baru");
    if (targets.length === 0) return;
    try {
      await Promise.all(
        targets.map((p) => updateInbox.mutateAsync({ name: p.name, patch: { status: "Selesai" } })),
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
        title="Pesan"
        description="Inbox dari formulir kontak publik dan kanal komunikasi terjadwal."
        actions={
          <>
            <Button variant="outline" onClick={handleMarkAll} disabled={updateInbox.isPending}>
              <span className="h-4 w-4 mr-1.5"><IconCheck /></span>
              Tandai Semua Selesai
            </Button>
            <Button onClick={() => setShowCompose(true)}>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Pesan Baru
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
          {/* Left pane */}
          <div className="border-r border-border flex flex-col">
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-fg">
                  <IconSearch />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari pesan..."
                  className="w-full h-9 pl-8 pr-3 rounded-md border border-border bg-bg text-sm placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={
                      filter === f
                        ? "px-2.5 py-1 rounded-full text-xs font-medium bg-brand text-white"
                        : "px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-fg/70 hover:bg-muted/80"
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 max-h-[640px]">
              {listQuery.isLoading ? (
                <div className="p-6 text-center text-sm text-muted-fg">Memuat...</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-fg">
                  {listQuery.isError ? "Gagal memuat." : "Tidak ada pesan."}
                </div>
              ) : (
                filtered.map((p) => {
                  const active = p.name === (selected?.name ?? null);
                  return (
                    <button
                      key={p.name}
                      onClick={() => setSelectedId(p.name)}
                      className={
                        (active
                          ? "bg-brand/5 border-l-2 border-l-brand "
                          : "border-l-2 border-l-transparent hover:bg-muted/40 ") +
                        "w-full text-left px-3 py-3 border-b border-border flex gap-3 items-start"
                      }
                    >
                      <Avatar name={p.nama} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-medium text-fg text-sm truncate flex-1">
                            {p.nama}
                          </span>
                          <span className="text-[10px] text-muted-fg shrink-0 tabular-nums">
                            {formatWaktu(p.submitted_at ?? p.creation)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-fg truncate">
                          {stripHtml(p.pesan ?? "") || p.email || "—"}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Badge tone={STATUS_TONE[p.status ?? "Baru"] ?? "neutral"} dot>
                            {p.status ?? "Baru"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right pane */}
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
                <EmptyState
                  title="Pilih pesan"
                  description="Pilih salah satu pesan di sebelah kiri untuk membalas."
                />
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

interface ConversationViewProps {
  pesan: InboxRow;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}

function ConversationView({ pesan, draft, onDraftChange, onSend, sending }: ConversationViewProps) {
  return (
    <>
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <Avatar name={pesan.nama} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-fg truncate">{pesan.nama}</h2>
            <Badge tone={STATUS_TONE[pesan.status ?? "Baru"] ?? "neutral"} dot>
              {pesan.status ?? "Baru"}
            </Badge>
          </div>
          <div className="text-xs text-muted-fg mt-0.5">
            {pesan.email ?? "—"} {pesan.telepon ? `· ${pesan.telepon}` : ""}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 max-h-[420px]">
        <div className="flex justify-start">
          <div className="max-w-[75%] flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[11px] text-muted-fg">
              <span className="font-medium text-fg/80">{pesan.nama}</span>
              <span className="tabular-nums inline-flex items-center gap-0.5">
                <span className="h-3 w-3"><IconClock /></span>
                {formatWaktu(pesan.submitted_at ?? pesan.creation)}
              </span>
            </div>
            <div className="bg-muted text-fg rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm whitespace-pre-wrap">
              {stripHtml(pesan.pesan ?? "")}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Tulis balasan..."
          rows={2}
          className="flex-1 resize-none rounded-md border border-border bg-bg px-3 py-2 text-sm placeholder:text-muted-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <Button onClick={onSend} disabled={!draft.trim() || sending}>
          {sending ? "Mengirim..." : "Kirim"}
        </Button>
      </div>
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/pesan")({ component: PesanPage });
