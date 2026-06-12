import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Alert,
  Badge,
  Button,
  PageHeader,
  SectionCard,
  SearchableSelect,
  WorkflowStepper,
  IconArrowLeft,
  IconCheck,
  IconUsers,
  IconWallet,
  type SearchableOption,
} from "@sekolahpro/ui";
import {
  listResource,
  useResourceList,
  useResourceUpdate,
} from "@sekolahpro/api-client";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { PermohonanModal } from "../components/koperasi-simpanan/permohonanForms";
import { TransaksiModal } from "../components/koperasi-simpanan/transaksiForm";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";
import { ANGGOTA_KOPERASI_FIELDS } from "../data/create-schemas";
import {
  deriveOnboardingStep,
  canProceedToPokok,
  onboardingSteps,
  type OnboardingState,
} from "../lib/koperasi/onboarding";

// Anggota fields minus nasabah — nasabah is injected as a locked baseValue so
// the operator cannot accidentally re-pick a different member mid-onboarding.
const ANGGOTA_FIELDS_NO_NASABAH = ANGGOTA_KOPERASI_FIELDS.filter((f) => f.name !== "nasabah");

type ModalKind = "anggota" | "rekening" | "pokok";

/** Search the Nasabah master by name (Nasabah create lives off-module). */
async function searchNasabah(q: string): Promise<SearchableOption[]> {
  const rows = await listResource<{ name: string }>("Nasabah", {
    fields: ["name"],
    ...(q ? { or_filters: [["name", "like", `%${q}%`]] as [string, string, unknown][] } : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({ value: r.name, label: r.name }));
}

function ContextChips({ state }: { state: OnboardingState }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {state.nasabah ? <Badge tone="brand" dot>Nasabah: {state.nasabah}</Badge> : null}
      {state.anggotaName ? <Badge tone="success" dot>Anggota: {state.anggotaName}</Badge> : null}
      {state.rekeningName ? <Badge tone="neutral" dot>Permohonan: {state.rekeningName}</Badge> : null}
    </div>
  );
}

function OnboardingWizardPage() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const navigate = useNavigate();
  const [state, setState] = useState<OnboardingState>({});
  const [modal, setModal] = useState<ModalKind | null>(null);
  const updateAnggota = useResourceUpdate("Anggota Koperasi");

  // The actual savings account only exists once the supervisor approves the
  // Buka Rekening permohonan — poll for an Aktif rekening of this nasabah.
  const rekQ = useResourceList<{ name: string; status?: string }>(
    "Rekening Simpanan",
    {
      fields: ["name", "status"],
      filters: [
        ["nasabah", "=", state.nasabah ?? ""],
        ["status", "=", "Aktif"],
      ],
      limit_page_length: 1,
    },
    { enabled: Boolean(state.nasabah) && Boolean(state.anggotaName) && Boolean(state.rekeningName) },
  );
  const aktifRekening = rekQ.data?.[0];

  const liveState: OnboardingState = {
    ...state,
    ...(aktifRekening ? { rekeningStatus: "Aktif" } : {}),
  };
  const phase = deriveOnboardingStep(liveState);
  const steps = onboardingSteps(liveState);

  const handlePokokDone = () => {
    if (state.anggotaName) {
      // Mark simpanan pokok lunas — the gate that no UI set before this wizard.
      updateAnggota.mutate({ name: state.anggotaName, patch: { simpanan_pokok_lunas: 1 } });
    }
    setModal(null);
    setState((s) => ({ ...s, pokokPaid: true }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Pendaftaran Anggota Baru"
        description="Satu alur terpandu: pilih nasabah, buat keanggotaan, buka rekening, lalu setor simpanan pokok."
        actions={
          <Button variant="outline" onClick={() => navigate({ to: "/kop/$sekolah/daftar", params: { sekolah } })}>
            <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
            Daftar Anggota
          </Button>
        }
      />

      <KoperasiPageGuide id="onboarding" />

      <SectionCard title="Progres Onboarding">
        <WorkflowStepper steps={steps} />
      </SectionCard>

      <ContextChips state={liveState} />

      {phase === "nasabah" ? (
        <StepNasabah value={state.nasabah ?? ""} onPick={(v) => setState({ nasabah: v })} />
      ) : null}

      {phase === "keanggotaan" ? (
        <StepAction
          icon={<IconUsers />}
          title="Buat Keanggotaan"
          body="Daftarkan nasabah sebagai anggota koperasi. Nasabah sudah terkunci dari langkah sebelumnya."
          actionLabel="Buat Keanggotaan"
          onAction={() => setModal("anggota")}
          onBack={() => setState({})}
        />
      ) : null}

      {phase === "rekening" ? (
        <StepAction
          icon={<IconWallet />}
          title="Buka Rekening Simpanan"
          body="Ajukan pembukaan rekening simpanan untuk anggota. Permohonan masuk ke antrian persetujuan supervisor."
          actionLabel="Ajukan Buka Rekening"
          onAction={() => setModal("rekening")}
        />
      ) : null}

      {phase === "pokok" ? (
        <StepPokok
          ready={canProceedToPokok(liveState)}
          loading={rekQ.isLoading}
          rekening={aktifRekening?.name}
          onRefresh={() => void rekQ.refetch()}
          onDeposit={() => setModal("pokok")}
          onFinishLater={() => navigate({ to: "/kop/$sekolah/persetujuan", params: { sekolah } })}
        />
      ) : null}

      {phase === "selesai" ? (
        <StepSelesai
          anggota={state.anggotaName ?? "—"}
          onView={() =>
            navigate({ to: "/kop/$sekolah/$noAnggota", params: { sekolah, noAnggota: state.anggotaName ?? "" } })
          }
          onAgain={() => setState({})}
        />
      ) : null}

      {modal === "anggota" ? (
        <ResourceCreateModal
          open
          onClose={() => setModal(null)}
          doctype="Anggota Koperasi"
          title="Buat Keanggotaan Koperasi"
          description="Nasabah terkunci dari langkah sebelumnya."
          fields={ANGGOTA_FIELDS_NO_NASABAH}
          baseValues={{ nasabah: state.nasabah }}
          submitLabel="Simpan Keanggotaan"
          onCreated={(doc) => {
            setModal(null);
            setState((s) => ({ ...s, anggotaName: String(doc.name ?? "") }));
          }}
        />
      ) : null}

      {modal === "rekening" && state.anggotaName ? (
        <PermohonanModal
          kind="buka"
          open
          onClose={() => setModal(null)}
          anggota={state.anggotaName}
          onSuccess={(name) => {
            setModal(null);
            setState((s) => ({ ...s, rekeningName: name, rekeningStatus: "Diajukan" }));
          }}
        />
      ) : null}

      {modal === "pokok" && aktifRekening ? (
        <TransaksiModal
          open
          onClose={() => setModal(null)}
          rekening={aktifRekening.name}
          defaultJenis="Setor"
          onSuccess={handlePokokDone}
        />
      ) : null}
    </div>
  );
}

function StepNasabah({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const [picked, setPicked] = useState(value);
  return (
    <SectionCard title="1. Pilih Nasabah" description="Cari identitas orang yang akan menjadi anggota.">
      <div className="max-w-md space-y-3">
        <SearchableSelect
          value={picked}
          onChange={setPicked}
          loadOptions={searchNasabah}
          placeholder="Cari nasabah berdasarkan nama/ID…"
        />
        <Alert tone="info" statusRole>
          Nasabah belum terdaftar? Tambahkan dulu di modul Nasabah, lalu kembali ke sini.
        </Alert>
        <Button disabled={!picked} onClick={() => onPick(picked)}>
          Lanjut
        </Button>
      </div>
    </SectionCard>
  );
}

function StepAction({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  onBack,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  onBack?: () => void;
}) {
  return (
    <SectionCard title={title}>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <span className="h-5 w-5">{icon}</span>
        </span>
        <p className="flex-1 text-sm text-muted-fg">{body}</p>
        <div className="flex gap-2">
          {onBack ? (
            <Button variant="outline" onClick={onBack}>Ulangi</Button>
          ) : null}
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      </div>
    </SectionCard>
  );
}

function StepPokok({
  ready,
  loading,
  rekening,
  onRefresh,
  onDeposit,
  onFinishLater,
}: {
  ready: boolean;
  loading: boolean;
  rekening: string | undefined;
  onRefresh: () => void;
  onDeposit: () => void;
  onFinishLater: () => void;
}) {
  return (
    <SectionCard title="4. Setor Simpanan Pokok">
      {ready && rekening ? (
        <div className="space-y-3">
          <Alert tone="success" statusRole>
            Rekening <strong>{rekening}</strong> sudah aktif. Catat setoran simpanan pokok untuk menyelesaikan keanggotaan.
          </Alert>
          <Button onClick={onDeposit}>
            <span className="h-4 w-4 mr-1.5"><IconWallet /></span>
            Setor Simpanan Pokok
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Alert tone="warning" statusRole>
            Rekening menunggu persetujuan supervisor. Setelah disetujui dan aktif, kembali ke sini untuk setor simpanan pokok.
          </Alert>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? "Memeriksa…" : "Cek status rekening"}
            </Button>
            <Button variant="outline" onClick={onFinishLater}>
              Buka antrian persetujuan
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function StepSelesai({
  anggota,
  onView,
  onAgain,
}: {
  anggota: string;
  onView: () => void;
  onAgain: () => void;
}) {
  return (
    <SectionCard title="Onboarding Selesai">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
          <span className="h-5 w-5"><IconCheck /></span>
        </span>
        <div className="flex-1">
          <div className="text-sm font-medium text-fg">Anggota {anggota} aktif penuh.</div>
          <div className="text-xs text-muted-fg">Keanggotaan, rekening, dan simpanan pokok telah tercatat.</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onAgain}>Daftarkan lagi</Button>
          <Button onClick={onView}>Lihat anggota</Button>
        </div>
      </div>
    </SectionCard>
  );
}

export const Route = createFileRoute("/kop/$sekolah/onboarding")({ component: OnboardingWizardPage });
