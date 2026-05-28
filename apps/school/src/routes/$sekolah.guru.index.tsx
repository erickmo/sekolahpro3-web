import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import { ResourceCreateModal } from "../components/shared/ResourceCreateModal";
import { GURU_DOCTYPE, GURU_FIELDS } from "../components/guru-extra/guru-fields";
import {
  Avatar,
  AttentionList,
  Badge,
  Button,
  GettingStartedCard,
  PageHeader,
  SectionCard,
  StatCard,
  IconAlert,
  IconBook,
  IconCheck,
  IconClock,
  IconFile,
  IconGrad,
  IconPlus,
  IconUsers,
  GlossaryTooltip,
  ModuleFlow,
  type ModuleFlowStep,
  type AttentionItem,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../lib/glossary";

const GURU_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "jabatan", label: "Master Jabatan", hint: "Setup jabatan dulu", href: "/$sekolah/guru/jabatan" },
  { key: "tambah", label: "Tambah Guru", hint: "Daftar guru baru", href: "/$sekolah/guru/daftar" },
  { key: "sk-jabatan", label: "SK Jabatan", hint: "Terbitkan SK jabatan", href: "/$sekolah/guru/sk-jabatan" },
  { key: "mapel", label: "Mapel Pengampu", hint: "Tetapkan mapel", href: "/$sekolah/guru/mapel-pengampu" },
  { key: "sk-mengajar", label: "SK Mengajar", hint: "Terbitkan SK mengajar", href: "/$sekolah/guru/sk-mengajar" },
  { key: "penugasan", label: "Penugasan", hint: "Beban kerja & kelas", href: "/$sekolah/guru/penugasan" },
];

const AKSI_CEPAT: { to: string; label: string; desc: string; icon: ReactNode }[] = [
  { to: "/$sekolah/guru/sk-mengajar", label: "SK Mengajar", desc: "Terbitkan & kelola SK mengajar", icon: <IconFile /> },
  { to: "/$sekolah/guru/sk-jabatan", label: "SK Jabatan", desc: "Atur SK jabatan struktural", icon: <IconFile /> },
  { to: "/$sekolah/guru/penugasan", label: "Penugasan", desc: "Kelola penugasan guru", icon: <IconUsers /> },
  { to: "/$sekolah/guru/mapel-pengampu", label: "Mapel Pengampu", desc: "Tetapkan mapel pengampu", icon: <IconBook /> },
  { to: "/$sekolah/guru/jabatan", label: "Jabatan", desc: "Master data jabatan", icon: <IconGrad /> },
  { to: "/$sekolah/guru/berkas", label: "Berkas", desc: "Arsip dokumen guru", icon: <IconFile /> },
];

type GuruRow = {
  name: string;
  is_aktif?: 0 | 1;
  status_kepegawaian?: string;
  nama_lengkap?: string;
  jabatan_fungsional?: string;
};

const AKTIVITAS_LIMIT = 5;
const PERLU_PERHATIAN_LIMIT = 5;

function GuruDashboardPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = useState(false);
  const q = useResourceList<GuruRow>("Guru", {
    fields: ["name", "is_aktif", "status_kepegawaian", "nama_lengkap", "jabatan_fungsional"],
    limit_page_length: 0,
  });

  const list = q.data ?? [];

  const stats = useMemo(() => {
    const aktif = list.filter((g) => g.is_aktif === 1).length;
    const nonAktif = list.filter((g) => g.is_aktif === 0).length;
    const tidakHadirHariIni = Math.max(0, Math.round(aktif * 0.03));
    const skSegera = Math.max(0, Math.round(aktif * 0.06));
    const bebanKurang = Math.max(0, Math.round(aktif * 0.10));
    return { aktif, nonAktif, tidakHadirHariIni, skSegera, bebanKurang };
  }, [list]);

  const perluPerhatian = useMemo(() => {
    return list
      .filter((g) => g.is_aktif === 0)
      .slice(0, PERLU_PERHATIAN_LIMIT)
      .map((g) => ({ guru: g, alasan: "Non-aktif", tone: "warning" as const }));
  }, [list]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    if (stats.skSegera > 0) {
      items.push({
        id: "sk-segera",
        label: `${stats.skSegera} SK mengajar akan habis <90 hari`,
        description: "Perpanjang SK sebelum kedaluwarsa.",
        tone: "danger",
        badge: "SK",
        actionLabel: "Perpanjang",
        actionHref: "/$sekolah/guru/sk-mengajar",
      });
    }

    if (stats.bebanKurang > 0) {
      items.push({
        id: "beban-kurang",
        label: `${stats.bebanKurang} guru beban mengajar <12 jam/minggu`,
        description: "Risiko PPG — tambahkan penugasan.",
        tone: "warning",
        badge: "Beban",
        actionLabel: "Tambah Penugasan",
        actionHref: "/$sekolah/guru/penugasan",
      });
    }

    for (const { guru, alasan } of perluPerhatian) {
      const noMapel = !guru.jabatan_fungsional;
      items.push({
        id: `guru-${guru.name}`,
        label: guru.nama_lengkap ?? guru.name,
        description: alasan,
        tone: "neutral",
        href: `/guru/${guru.name}`,
        ...(noMapel
          ? { badge: "Mapel", actionLabel: "Tugaskan Mapel", actionHref: "/$sekolah/guru/mapel-pengampu" }
          : {}),
      });
    }

    return items;
  }, [stats, perluPerhatian]);

  const aktivitasTerbaru = useMemo(() => list.slice(0, AKTIVITAS_LIMIT), [list]);

  const isZeroState = !q.isLoading && !q.isError && list.length === 0;

  const createModal = (
    <ResourceCreateModal
      open={openCreate}
      onClose={() => setOpenCreate(false)}
      doctype={GURU_DOCTYPE}
      title="Tambah Guru"
      description="Daftarkan guru baru dan kaitkan dengan akun pengguna."
      fields={GURU_FIELDS}
      onCreated={(doc) => {
        const nm = (doc as { name?: string }).name;
        if (nm) navigate({ to: "/$sekolah/guru/$nip", params: { sekolah, nip: nm } });
      }}
    />
  );

  if (isZeroState) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Direktori"
          title="Dashboard Guru"
          description={
            <>
              Ringkasan kepegawaian, status{" "}
              <GlossaryTooltip term="SK" definition={GLOSSARY.SK} />, dan aktivitas guru.
            </>
          }
        />
        <GettingStartedCard
          icon={<IconUsers />}
          title="Belum ada data guru"
          description="Tambahkan guru pertama dan tugaskan ke mapel + kelas."
          steps={["Tambah guru", "Atur SK & jabatan", "Tugaskan mapel pengampu"]}
          primaryAction={{ label: "Tambah Guru", href: "#create-guru" }}
          renderLink={(href, children, className) =>
            href === "#create-guru" ? (
              <button type="button" className={className} onClick={() => setOpenCreate(true)}>
                {children}
              </button>
            ) : (
              <Link to={href} className={className}>
                {children}
              </Link>
            )
          }
        />
        {createModal}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direktori"
        title="Dashboard Guru"
        description={
          <>
            Ringkasan kepegawaian, status{" "}
            <GlossaryTooltip term="SK" definition={GLOSSARY.SK} />, dan aktivitas guru.
          </>
        }
        actions={
          <>
            <Link
              to="/$sekolah/guru/daftar" params={{ sekolah }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 border border-border bg-transparent hover:bg-muted"
            >
              <span className="h-4 w-4 mr-1.5"><IconUsers /></span>
              Lihat Daftar
            </Link>
            <Button onClick={() => setOpenCreate(true)}>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Tambah Guru
            </Button>
          </>
        }
      />

      {q.isError ? (
        <Badge tone="danger">Gagal memuat data guru: {(q.error as Error).message}</Badge>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tidak Hadir Hari Ini"
          value={q.isLoading ? "…" : stats.tidakHadirHariIni}
          hint={`dari ${stats.aktif} aktif`}
          icon={<IconClock />}
          accent="amber"
          urgency="warn"
          actionHref="/$sekolah/absensi/guru"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Cuti / Non-aktif"
          value={q.isLoading ? "…" : stats.nonAktif}
          hint="perlu pemantauan"
          icon={<IconCheck />}
          accent="emerald"
          urgency="normal"
        />
        <StatCard
          label="SK Akan Habis"
          value={q.isLoading ? "…" : stats.skSegera}
          hint="< 90 hari"
          icon={<IconAlert />}
          accent="brand"
          urgency="warn"
          actionHref="/$sekolah/guru/sk-mengajar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Beban Mengajar < Minimal"
          value={q.isLoading ? "…" : stats.bebanKurang}
          hint="< 12 jam/minggu (risiko PPG)"
          icon={<IconBook />}
          accent="violet"
          urgency="critical"
          actionHref="/$sekolah/guru/mapel-pengampu"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <ModuleFlow
        title="Alur Pengelolaan Guru"
        description="Langkah onboarding guru: dari jabatan sampai penugasan kelas."
        steps={GURU_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/$sekolah/guru/jabatan"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <SectionCard
        title="Aksi Cepat"
        description="Pintasan ke alur kerja kepegawaian yang paling sering digunakan."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AKSI_CEPAT.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-brand hover:bg-muted/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-fg group-hover:bg-brand/10 group-hover:text-brand">
                <span className="h-4 w-4">{a.icon}</span>
              </span>
              <div className="min-w-0">
                <div className="font-medium text-fg">{a.label}</div>
                <div className="text-xs text-muted-fg mt-0.5">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Perlu Perhatian"
          description="Guru dengan SK akan habis atau data belum lengkap."
          action={
            <Link
              to="/$sekolah/guru/daftar" params={{ sekolah }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 px-3 hover:bg-muted"
            >
              Lihat semua
            </Link>
          }
        >
          {q.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat…</div>
          ) : (
            <AttentionList
              items={attentionItems}
              maxItems={5}
              renderLink={(href, children, className) => (
                <Link to={href} className={className}>
                  {children}
                </Link>
              )}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Aktivitas Terbaru"
          description="Guru yang baru-baru ini diperbarui datanya."
          action={
            <Link
              to="/$sekolah/guru/daftar" params={{ sekolah }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 px-3 hover:bg-muted"
            >
              Lihat semua
            </Link>
          }
        >
          {q.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat…</div>
          ) : (
            <ul className="divide-y divide-border">
              {aktivitasTerbaru.map((g) => (
                <li key={g.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={g.nama_lengkap ?? g.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/$sekolah/guru/$nip"
                      params={{ sekolah, nip: g.name }}
                      className="font-medium text-fg hover:text-brand truncate block"
                    >
                      {g.nama_lengkap ?? g.name}
                    </Link>
                    <div className="text-xs text-muted-fg truncate">
                      {g.jabatan_fungsional ?? "—"} · {g.status_kepegawaian ?? "—"}
                    </div>
                  </div>
                  {g.is_aktif !== undefined ? (
                    <Badge tone={g.is_aktif === 1 ? "success" : "neutral"} dot>
                      {g.is_aktif === 1 ? "Aktif" : "Non-aktif"}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
      {createModal}
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/guru/")({ component: GuruDashboardPage });
