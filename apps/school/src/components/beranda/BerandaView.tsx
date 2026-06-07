/**
 * Pure presentational shell for the role-adaptive Beranda dashboard.
 *
 * Reads the per-persona panel registry (lib/berandaLayout) and composes the leaf
 * panels in registry order — this is what keeps the route component thin (<60
 * lines) and makes the whole dashboard testable without a Router or API mocks.
 * No hooks, no fetching: it receives fully-aggregated `data` + a `renderLink`.
 */
import type { ReactNode } from "react";
import { AttentionList, Badge, PageHeader, SectionCard } from "@sekolahpro/ui";
import { PageGuide } from "../guide";
import { MISC_PAGE_GUIDES } from "../guide/miscPageGuides";
import { SCHOOL_ROLE_LABEL } from "../../lib/schoolGuideRole";
import { BERANDA_ROLE_LABEL, type BerandaRole } from "../../lib/berandaRole";
import type { BerandaLayout, PanelKey } from "../../lib/berandaLayout";
import type { BerandaData } from "../../lib/beranda/scope";
import { AntreanSaya } from "./AntreanSaya";
import { StripKonteks } from "./StripKonteks";
import { HariSaya } from "./HariSaya";
import { AksiCepat } from "./AksiCepat";

type RenderLink = (href: string, children: ReactNode, className?: string) => ReactNode;

/** Per-persona title + empty copy for the "Hari Saya" strip. */
const HARI_SAYA_COPY: Record<BerandaRole, { title: string; empty: string }> = {
  kepala_sekolah: { title: "Agenda Hari Ini", empty: "Tidak ada agenda terjadwal hari ini." },
  bendahara: { title: "Tenggat Uang", empty: "Tidak ada tenggat keuangan hari ini." },
  tu_operator: { title: "Batas Waktu Operasional", empty: "Tidak ada batas waktu khusus hari ini." },
  guru: { title: "Jadwal Mengajar Saya", empty: "Tidak ada jadwal mengajar hari ini." },
  wali_kelas: { title: "Jadwal Mengajar Saya", empty: "Tidak ada jadwal mengajar hari ini." },
};

export interface BerandaViewProps {
  role: BerandaRole;
  roles: BerandaRole[];
  onRoleChange: (role: BerandaRole) => void;
  layout: BerandaLayout;
  data: BerandaData;
  dismissedIds: readonly string[];
  onDismiss: (id: string) => void;
  renderLink: RenderLink;
}

/** Inline role-switcher chips (presentation hint only; never gates access). */
function RoleChips({ roles, active, onChange }: { roles: BerandaRole[]; active: BerandaRole; onChange: (r: BerandaRole) => void }): ReactNode {
  if (roles.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          aria-pressed={r === active}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            r === active ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-fg hover:bg-muted"
          }`}
        >
          {BERANDA_ROLE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}

/** Render one content panel by its registry key. */
function Panel({ panel, role, data, dismissedIds, onDismiss, renderLink }: {
  panel: PanelKey;
  role: BerandaRole;
  data: BerandaData;
  dismissedIds: readonly string[];
  onDismiss: (id: string) => void;
  renderLink: RenderLink;
}): ReactNode {
  switch (panel) {
    case "antrean":
      return <AntreanSaya items={data.inbox} dismissedIds={dismissedIds} onDismiss={onDismiss} renderLink={renderLink} />;
    case "hari-saya":
      return <HariSaya title={HARI_SAYA_COPY[role].title} items={data.hariSaya} emptyText={HARI_SAYA_COPY[role].empty} />;
    case "sinyal":
      return (
        <SectionCard title="Sinyal" description="Hal lintas modul yang perlu Anda perhatikan.">
          {data.signals.length === 0 ? (
            <p className="text-sm text-muted-fg">Tidak ada sinyal yang perlu perhatian.</p>
          ) : (
            <AttentionList items={data.signals} renderLink={renderLink} />
          )}
        </SectionCard>
      );
    case "aksi-cepat":
      return <AksiCepat renderLink={renderLink} />;
    case "tren":
      return (
        <SectionCard title="Tren Kehadiran" description="7 hari terakhir">
          <p className="py-4 text-sm text-muted-fg">
            Tren kehadiran akan tampil setelah agregat absensi harian tersedia.
          </p>
        </SectionCard>
      );
    default:
      return null;
  }
}

export function BerandaView({
  role,
  roles,
  onRoleChange,
  layout,
  data,
  dismissedIds,
  onDismiss,
  renderLink,
}: BerandaViewProps): ReactNode {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Beranda"
        title="Selamat datang kembali"
        description="Antrean kerja Anda hari ini, disesuaikan dengan peran."
        actions={<RoleChips roles={roles} active={role} onChange={onRoleChange} />}
      />

      <PageGuide
        storageNamespace="school-guide:"
        storageId="dashboard"
        title={MISC_PAGE_GUIDES.dashboard.title}
        intro={MISC_PAGE_GUIDES.dashboard.intro}
        steps={MISC_PAGE_GUIDES.dashboard.steps}
        tips={MISC_PAGE_GUIDES.dashboard.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      {data.isError ? <Badge tone="danger">Sebagian data gagal dimuat — angka mungkin tidak lengkap.</Badge> : null}

      <StripKonteks metrics={data.konteks} mode={layout.konteks} />

      <div className="space-y-6">
        {layout.panels.map((panel) => (
          <Panel
            key={panel}
            panel={panel}
            role={role}
            data={data}
            dismissedIds={dismissedIds}
            onDismiss={onDismiss}
            renderLink={renderLink}
          />
        ))}
      </div>
    </div>
  );
}
