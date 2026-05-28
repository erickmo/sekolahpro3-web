import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams} from "@tanstack/react-router";
import {
  Avatar,
  AttentionList,
  Button,
  PageHeader,
  SectionCard,
  StatCard,
  IconUsers,
  IconCheck,
  IconAlert,
  IconFile,
  IconClock,
  IconPlus,
  GlossaryTooltip,
  type AttentionItem,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { StaffFormModal } from "../components/staff/StaffFormModal";
import { GLOSSARY } from "../lib/glossary";

const SK_WARNING_DAYS = 90;
const RECENT_LIMIT = 5;
const ATTENTION_LIMIT = 6;

type GuruRow = {
  name: string;
  nama_lengkap?: string;
  nip?: string;
  jabatan_fungsional?: string;
  sekolah?: string;
  is_aktif?: 0 | 1;
  tmt_pertama_kerja?: string;
  creation?: string;
};

type SkRow = {
  name: string;
  guru?: string;
  jenis_jabatan?: string;
  tanggal_berakhir?: string;
  status?: string;
};

type BerkasRow = { name: string };

function formatTanggal(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StaffDashboardPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const guruQ = useResourceList<GuruRow>("Guru", {
    fields: ["name", "nama_lengkap", "nip", "jabatan_fungsional", "sekolah", "is_aktif", "tmt_pertama_kerja", "creation"],
    order_by: "creation desc",
    limit_page_length: 0,
  });
  const skQ = useResourceList<SkRow>("SK Jabatan", {
    fields: ["name", "guru", "jenis_jabatan", "tanggal_berakhir", "status"],
    filters: [["status", "!=", "Dicabut"]],
    limit_page_length: 0,
  });
  const berkasQ = useResourceList<BerkasRow>("Berkas Guru", {
    fields: ["name"],
    limit_page_length: 0,
  });

  const gurus = guruQ.data ?? [];
  const sks = skQ.data ?? [];
  const berkas = berkasQ.data ?? [];

  const stats = useMemo(() => {
    const aktif = gurus.filter((g) => g.is_aktif === 1).length;
    const skHabis = sks.filter((s) => {
      const d = daysUntil(s.tanggal_berakhir);
      return d !== null && d >= 0 && d <= SK_WARNING_DAYS;
    }).length;
    return { total: gurus.length, aktif, skHabis, berkas: berkas.length };
  }, [gurus, sks, berkas]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const guruByName = new Map(gurus.map((g) => [g.name, g]));
    return sks
      .map((s) => {
        const d = daysUntil(s.tanggal_berakhir);
        if (d === null || d < 0 || d > SK_WARNING_DAYS) return null;
        const g = s.guru ? guruByName.get(s.guru) : undefined;
        return {
          id: s.name,
          label: g?.nama_lengkap ?? s.guru ?? s.name,
          description: `${s.jenis_jabatan ?? "SK"} — habis dalam ${d} hari (${formatTanggal(s.tanggal_berakhir)})`,
          tone: d <= 30 ? ("danger" as const) : ("warning" as const),
          badge: "SK",
          href: "/$sekolah/staff/sk-jabatan",
          actionLabel: "Perpanjang",
          actionHref: "/$sekolah/staff/sk-jabatan",
        } satisfies AttentionItem;
      })
      .filter((x): x is AttentionItem => !!x)
      .slice(0, ATTENTION_LIMIT);
  }, [sks, gurus]);

  const terbaru = useMemo(() => {
    return [...gurus]
      .sort((a, b) => (b.creation ?? "").localeCompare(a.creation ?? ""))
      .slice(0, RECENT_LIMIT);
  }, [gurus]);

  return (
    <div className="space-y-6">
      <StaffFormModal open={showCreate} onClose={() => setShowCreate(false)} />
      <PageHeader
        eyebrow="Direktori"
        title="Dashboard Staff"
        description="Ringkasan tenaga kependidikan dan staf non-pengajar."
        actions={
          <>
            <Link to="/$sekolah/staff/daftar" params={{ sekolah }}>
              <Button variant="outline">
                <span className="h-4 w-4 mr-1.5"><IconUsers /></span>
                Lihat Daftar
              </Button>
            </Link>
            <Button onClick={() => setShowCreate(true)}>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Tambah Staff
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Staff Aktif"
          value={stats.aktif}
          hint={`dari ${stats.total} total`}
          icon={<IconCheck />}
          accent="emerald"
          urgency="normal"
        />
        <StatCard
          label="Total Staff"
          value={stats.total}
          hint="seluruh staf terdaftar"
          icon={<IconUsers />}
          accent="brand"
        />
        <StatCard
          label={<><GlossaryTooltip term="SK" definition={GLOSSARY.SK} /> Akan Habis</>}
          value={stats.skHabis}
          hint={`dalam ${SK_WARNING_DAYS} hari`}
          icon={<IconAlert />}
          accent="amber"
          urgency="warn"
          actionHref="/$sekolah/staff/sk-jabatan"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Total Berkas"
          value={stats.berkas}
          hint="berkas terdaftar"
          icon={<IconFile />}
          accent="violet"
          actionHref="/$sekolah/staff/berkas"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <SectionCard title="Aksi Cepat" description="Pintasan ke modul terkait pengelolaan staff.">
        <div className="flex flex-wrap gap-2">
          <Link to="/$sekolah/staff/jabatan" params={{ sekolah }}>
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Kelola Jabatan
            </Button>
          </Link>
          <Link to="/$sekolah/staff/sk-jabatan" params={{ sekolah }}>
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconFile /></span>
              Terbitkan SK
            </Button>
          </Link>
          <Link to="/$sekolah/staff/berkas" params={{ sekolah }}>
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconFile /></span>
              Unggah Berkas
            </Button>
          </Link>
          <Link to="/$sekolah/staff/daftar" params={{ sekolah }}>
            <Button>
              <span className="h-4 w-4 mr-1.5"><IconUsers /></span>
              Buka Daftar Staff
            </Button>
          </Link>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Perlu Perhatian"
          description={skQ.isLoading ? "Memuat..." : "SK akan habis dalam 90 hari."}
        >
          {attentionItems.length === 0 && !skQ.isLoading ? (
            <div className="text-sm text-muted-fg">Tidak ada SK yang akan habis dalam 90 hari.</div>
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
          description={guruQ.isLoading ? "Memuat..." : `${RECENT_LIMIT} staff terbaru terdaftar.`}
          padded={false}
        >
          {terbaru.length === 0 && !guruQ.isLoading ? (
            <div className="px-4 py-6 text-sm text-muted-fg">Belum ada staff terdaftar.</div>
          ) : (
            <ul className="divide-y divide-border">
              {terbaru.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/$sekolah/staff/$nip", params: { sekolah, nip: s.name } })}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  >
                    <Avatar name={s.nama_lengkap ?? s.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-fg truncate">{s.nama_lengkap ?? s.name}</div>
                      <div className="text-xs text-muted-fg truncate">
                        {s.nip ? `NIP ${s.nip}` : s.name}{s.jabatan_fungsional ? ` · ${s.jabatan_fungsional}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-fg whitespace-nowrap">
                      <span className="h-3.5 w-3.5"><IconClock /></span>
                      <span>TMT {formatTanggal(s.tmt_pertama_kerja)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/staff/")({ component: StaffDashboardPage });
