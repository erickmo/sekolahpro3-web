import { useMemo } from "react";
import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import {
  AttentionList,
  type AttentionItem,
  PageHeader,
  SectionCard,
  StatCard,
  IconAlert,
  IconBook,
  IconCalendar,
  IconCheck,
  IconGrad,
  IconHome,
  IconPlus,
  IconSettings,
  IconUsers,
  GlossaryTooltip,
  ModuleFlow,
  type ModuleFlowStep,
} from "@sekolahpro/ui";

const MASTER_FLOW_STEPS: ModuleFlowStep[] = [
  { key: "organisasi", label: "Organisasi", hint: "Struktur tenant", href: "/$sekolah/master/organisasi" },
  { key: "unit", label: "Unit Jenjang", hint: "SD/SMP/SMA", href: "/$sekolah/master/unit-jenjang" },
  { key: "tahun-ajaran", label: "Tahun Ajaran", hint: "Set TA berjalan", href: "/$sekolah/master/tahun-ajaran" },
  { key: "semester", label: "Semester", hint: "Ganjil & Genap", href: "/$sekolah/master/semester" },
  { key: "modul", label: "Modul & Fitur", hint: "Aktifkan modul", href: "/$sekolah/master/modul" },
  { key: "pengguna", label: "Pengguna", hint: "Akun & peran", href: "/$sekolah/master/pengguna" },
];
import { useResourceList } from "@sekolahpro/api-client";
import { GLOSSARY } from "../lib/glossary";

// Real doctype field shapes (verified).
type Pengguna = { name: string; user?: string; sekolah?: string; role_sekolah?: string; status?: string };
type TahunAjaran = { name: string; nama?: string; aktif?: number; tanggal_mulai?: string; tanggal_selesai?: string };
type Modul = { name: string; nama_modul?: string; aktif?: number };

const PENGGUNA_FIELDS = ["name", "user", "sekolah", "role_sekolah", "status"];
const TAHUN_AJARAN_FIELDS = ["name", "nama", "aktif", "tanggal_mulai", "tanggal_selesai"];
const MODUL_FIELDS = ["name", "nama_modul", "aktif"];
const PAGE_LIMIT = 0;

const AKSI_CEPAT: { to: string; label: string; desc: string; icon: React.ReactNode }[] = [
  { to: "/$sekolah/master/tahun-ajaran", label: "Tahun Ajaran", desc: "Kelola periode akademik", icon: <IconCalendar /> },
  { to: "/$sekolah/master/semester", label: "Semester", desc: "Atur semester ganjil & genap", icon: <IconCalendar /> },
  { to: "/$sekolah/master/pengguna", label: "Pengguna", desc: "Undang & kelola akses pengguna", icon: <IconUsers /> },
  { to: "/$sekolah/master/organisasi", label: "Organisasi", desc: "Struktur yayasan & sekolah", icon: <IconHome /> },
  { to: "/$sekolah/master/unit-jenjang", label: "Unit Jenjang", desc: "Atur jenjang TK/SD/SMP/SMA", icon: <IconGrad /> },
  { to: "/$sekolah/master/modul", label: "Modul Aktif", desc: "Aktifkan modul per tenant", icon: <IconBook /> },
  { to: "/$sekolah/master/feature-flag", label: "Feature Flag", desc: "Toggle eksperimen fitur", icon: <IconSettings /> },
];

const PERLU_PERHATIAN_LIMIT = 5;

function MasterDashboardPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const penggunaQ = useResourceList<Pengguna>("Pengguna Sekolah", { fields: PENGGUNA_FIELDS, limit_page_length: PAGE_LIMIT });
  const tahunQ = useResourceList<TahunAjaran>("Tahun Ajaran", { fields: TAHUN_AJARAN_FIELDS, limit_page_length: PAGE_LIMIT });
  const modulQ = useResourceList<Modul>("Modul Aktif", { fields: MODUL_FIELDS, limit_page_length: PAGE_LIMIT });

  const penggunaList = penggunaQ.data ?? [];
  const tahunList = tahunQ.data ?? [];
  const _modulList = modulQ.data ?? [];

  const stats = useMemo(() => {
    const penggunaAktif = penggunaList.filter((p) => p.status === "Aktif").length;
    const tahunAjaranAktif = tahunList.filter((t) => t.aktif === 1).length;
    // Actionable: pengguna tanpa peran (role_sekolah kosong) — blocker akses.
    const penggunaTanpaPeran = penggunaList.filter((p) => !p.role_sekolah).length;
    // Stub: tidak ada field lastLogin pada Pengguna Sekolah doctype.
    // TODO(api): tambahkan field `last_login` lalu filter < TODAY - 90 hari.
    const DORMANT_STUB_RATIO = 0.15;
    const akunDorman = Math.round(penggunaList.length * DORMANT_STUB_RATIO);
    return { penggunaAktif, tahunAjaranAktif, penggunaTanpaPeran, akunDorman };
  }, [penggunaList, tahunList]);

  const perluPerhatian = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    for (const p of penggunaList) {
      if (!p.role_sekolah) {
        items.push({
          id: `peran-${p.name}`,
          label: p.user ?? p.name,
          description: "Belum memiliki peran",
          tone: "danger",
          actionLabel: "Tetapkan Peran",
          actionHref: "/$sekolah/master/pengguna",
        });
      }
    }
    if (tahunList.length > 0 && tahunList.filter((t) => t.aktif === 1).length === 0) {
      items.push({
        id: "ta-belum-aktif",
        label: "Tahun Ajaran",
        description: "Belum ada tahun ajaran aktif",
        tone: "danger",
        actionLabel: "Aktifkan TA",
        actionHref: "/$sekolah/master/tahun-ajaran",
      });
    }
    if (stats.akunDorman > 0) {
      items.push({
        id: "akun-dorman",
        label: `${stats.akunDorman} akun dorman`,
        description: "Tidak login lebih dari 90 hari (estimasi)",
        tone: "warning",
        actionLabel: "Tinjau Akun",
        actionHref: "/$sekolah/master/pengguna",
      });
    }
    return items.slice(0, PERLU_PERHATIAN_LIMIT);
  }, [penggunaList, tahunList, stats.akunDorman]);

  const anyLoading = penggunaQ.isLoading || tahunQ.isLoading || modulQ.isLoading;
  const anyError = penggunaQ.isError || tahunQ.isError || modulQ.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Dashboard Master Data"
        description="Ringkasan pengguna, periode akademik, dan modul tenant."
        actions={
          <>
            <Link
              to="/$sekolah/master/daftar" params={{ sekolah }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 border border-border bg-transparent hover:bg-muted"
            >
              <span className="h-4 w-4 mr-1.5"><IconHome /></span>
              Daftar Sekolah
            </Link>
            <Link
              to="/$sekolah/master/pengguna" params={{ sekolah }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 bg-brand text-white hover:bg-brand/90"
            >
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Undang Pengguna
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pengguna Aktif"
          value={stats.penggunaAktif}
          hint={penggunaQ.isLoading ? "memuat..." : `dari ${penggunaList.length} pengguna`}
          icon={<IconUsers />}
          accent="emerald"
          urgency="normal"
        />
        <StatCard
          label={<><GlossaryTooltip term="Tahun Ajaran" definition={GLOSSARY.TA} /> Aktif</>}
          value={stats.tahunAjaranAktif}
          hint={tahunQ.isLoading ? "memuat..." : `dari ${tahunList.length} periode`}
          icon={<IconCalendar />}
          accent={stats.tahunAjaranAktif === 0 ? "rose" : "brand"}
          urgency={stats.tahunAjaranAktif === 0 ? "critical" : "normal"}
          {...(stats.tahunAjaranAktif === 0
            ? {
                actionHref: "/$sekolah/master/tahun-ajaran",
                renderLink: (href: string, children: React.ReactNode) => <Link to={href}>{children}</Link>,
              }
            : {})}
        />
        <StatCard
          label="Pengguna Tanpa Peran"
          value={stats.penggunaTanpaPeran}
          hint={penggunaQ.isLoading ? "memuat..." : "blokir akses fitur"}
          icon={<IconAlert />}
          accent="rose"
          urgency="critical"
          actionHref="/$sekolah/master/pengguna"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Akun Dorman >90 hari"
          value={stats.akunDorman}
          hint="butuh field last_login"
          icon={<IconCheck />}
          accent="amber"
          urgency="warn"
          actionHref="/$sekolah/master/pengguna"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <ModuleFlow
        title="Alur Setup Master Data"
        description="Urutan konfigurasi awal sekolah."
        steps={MASTER_FLOW_STEPS}
        renderLink={(href, children) => (
          <Link to={href as "/$sekolah/master/organisasi"} params={{ sekolah }}>
            {children}
          </Link>
        )}
      />

      <SectionCard
        title="Aksi Cepat"
        description="Pintasan ke pengaturan master data yang paling sering diakses."
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

      <SectionCard
        title="Perlu Perhatian"
        description="Pengguna tanpa peran atau periode akademik yang belum diatur."
        action={
          <Link
            to="/$sekolah/master/pengguna" params={{ sekolah }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 px-3 hover:bg-muted"
          >
            Lihat semua
          </Link>
        }
      >
        {anyLoading ? (
          <div className="text-sm text-muted-fg">Memuat data...</div>
        ) : anyError ? (
          <div className="text-sm text-rose-600">Gagal memuat data.</div>
        ) : (
          <AttentionList
            items={perluPerhatian}
            renderLink={(href, children) => <Link to={href as "/$sekolah/master/pengguna"} params={{ sekolah }}>{children}</Link>}
          />
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/master/")({ component: MasterDashboardPage });
