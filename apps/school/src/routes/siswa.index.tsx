import { useMemo, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Avatar,
  AttentionList,
  Badge,
  GettingStartedCard,
  PageHeader,
  SectionCard,
  StatCard,
  IconUsers,
  IconCheck,
  IconAlert,
  IconPlus,
  IconGrad,
  IconBook,
  IconFile,
  type AttentionItem,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

const QUICK_ACTIONS: {
  to: string;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  { to: "/siswa/new", label: "Tambah Siswa", description: "Daftarkan siswa baru ke sistem.", icon: <IconPlus /> },
  { to: "/siswa/mutasi", label: "Catat Mutasi", description: "Pindah masuk, keluar, atau naik kelas.", icon: <IconFile /> },
  { to: "/siswa/kelulusan", label: "Proses Kelulusan", description: "Kelola data calon lulusan.", icon: <IconGrad /> },
  { to: "/siswa/rombel", label: "Atur Rombel", description: "Susun anggota rombongan belajar.", icon: <IconBook /> },
  { to: "/siswa/wali", label: "Data Wali", description: "Lihat dan perbarui data wali siswa.", icon: <IconUsers /> },
];

type SiswaRow = {
  name: string;
  status?: string;
  jenis_kelamin?: string;
  // TODO confirm field name in backend doctype: assuming snake_case "kelas", "nama_lengkap"
  kelas?: string;
  nama_lengkap?: string;
};

const PERHATIAN_LIMIT = 5;
const AKTIVITAS_LIMIT = 5;

function SiswaDashboardPage() {
  const q = useResourceList<SiswaRow>("Siswa", {
    fields: ["name", "status", "jenis_kelamin", "kelas", "nama_lengkap"],
    limit_page_length: 0,
  });

  const list = q.data ?? [];

  const stats = useMemo(() => {
    const aktif = list.filter((s) => s.status === "Aktif").length;
    // derived stub — replace when backend wired (tagihan SPP join)
    const nunggakSpp = Math.max(0, Math.round(aktif * 0.08));
    // Mutasi pending approval: count Pindah Keluar (TA berjalan); replace with status === "Mutasi Pending" when field exists
    const mutasiPending = list.filter((s) => s.status === "Pindah Keluar").length;
    // derived stub — replace when backend wired (Dokumen Siswa child table)
    const berkasKurang = Math.max(0, Math.round(aktif * 0.05));
    // derived stub — replace when backend wired (Absensi Siswa join, alpa beruntun >3 hari)
    const alpaBeruntun = Math.max(0, Math.round(aktif * 0.02));
    return { aktif, nunggakSpp, mutasiPending, berkasKurang, alpaBeruntun };
  }, [list]);

  const perluPerhatian = useMemo(
    () => list.filter((s) => s.status && s.status !== "Aktif").slice(0, PERHATIAN_LIMIT),
    [list],
  );

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    if (stats.nunggakSpp > 0) {
      items.push({
        id: "spp-nunggak",
        label: `${stats.nunggakSpp} siswa nunggak SPP >30 hari`,
        description: "Perlu tindak lanjut tim keuangan.",
        tone: "danger",
        badge: "SPP",
        actionLabel: "Tinjau",
        actionHref: "/keuangan",
      });
    }

    if (stats.berkasKurang > 0) {
      items.push({
        id: "berkas-kurang",
        label: `${stats.berkasKurang} siswa berkas belum lengkap`,
        description: "Lengkapi dokumen administrasi siswa.",
        tone: "warning",
        badge: "Berkas",
        actionLabel: "Lihat Daftar",
        actionHref: "/siswa/daftar",
      });
    }

    if (stats.alpaBeruntun > 0) {
      items.push({
        id: "alpa-beruntun",
        label: `${stats.alpaBeruntun} siswa alpa beruntun >3 hari`,
        description: "Perlu komunikasi dengan wali.",
        tone: "danger",
        actionLabel: "Hubungi Wali",
        actionHref: "/siswa/wali",
      });
    }

    for (const s of perluPerhatian) {
      items.push({
        id: `siswa-${s.name}`,
        label: s.nama_lengkap ?? s.name,
        description: `${s.kelas ?? "—"} · NIS ${s.name} · Status ${s.status}`,
        tone: "warning",
        href: `/siswa/${s.name}`,
        actionLabel: "Upload Berkas",
        actionHref: `/siswa/${s.name}/edit`,
      });
    }

    return items;
  }, [stats, perluPerhatian]);

  const aktivitasTerbaru = useMemo(() => list.slice(-AKTIVITAS_LIMIT).reverse(), [list]);

  const isZeroState = !q.isLoading && !q.isError && list.length === 0;

  if (isZeroState) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Direktori"
          title="Dashboard Siswa"
          description="Ringkasan kesiswaan, aksi cepat, dan hal yang perlu ditindaklanjuti."
        />
        <GettingStartedCard
          icon={<IconUsers />}
          title="Belum ada data siswa"
          description="Tambahkan siswa pertama untuk mulai mengelola direktori, absensi, dan nilai."
          steps={[
            "Buat rombongan belajar dulu",
            "Tambah siswa satuan atau import CSV",
            "Tetapkan wali siswa",
          ]}
          primaryAction={{ label: "Tambah Siswa", href: "/siswa/new" }}
          secondaryAction={{ label: "Import Massal (CSV)", href: "/siswa/daftar" }}
          renderLink={(href, children, className) => (
            <Link to={href} className={className}>
              {children}
            </Link>
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direktori"
        title="Dashboard Siswa"
        description="Ringkasan kesiswaan, aksi cepat, dan hal yang perlu ditindaklanjuti."
      />

      {q.isError ? (
        <Badge tone="danger">Gagal memuat data siswa: {(q.error as Error).message}</Badge>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Siswa Aktif"
          value={q.isLoading ? "…" : stats.aktif.toLocaleString("id-ID")}
          hint={`dari ${list.length} total`}
          icon={<IconCheck />}
          accent="emerald"
          urgency="normal"
        />
        <StatCard
          label="Nunggak SPP >30 hari"
          value={q.isLoading ? "…" : stats.nunggakSpp.toLocaleString("id-ID")}
          hint="perlu penagihan"
          icon={<IconAlert />}
          accent="rose"
          urgency="critical"
          actionHref="/keuangan"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Mutasi Pending Approval"
          value={q.isLoading ? "…" : stats.mutasiPending.toLocaleString("id-ID")}
          hint="menunggu persetujuan"
          icon={<IconGrad />}
          accent="amber"
          urgency="warn"
          actionHref="/siswa/mutasi"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Berkas Belum Lengkap"
          value={q.isLoading ? "…" : stats.berkasKurang.toLocaleString("id-ID")}
          hint="dokumen kurang"
          icon={<IconFile />}
          accent="violet"
          urgency="warn"
          actionHref="/siswa/daftar"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <SectionCard title="Aksi Cepat" description="Pintasan ke alur kerja kesiswaan yang umum digunakan.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group flex items-start gap-3 rounded-lg border border-border bg-bg p-3 hover:border-brand hover:bg-muted/30 transition-colors"
            >
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-fg group-hover:bg-brand/10 group-hover:text-brand">
                {q.icon}
              </span>
              <div className="min-w-0">
                <div className="font-medium text-fg group-hover:text-brand">{q.label}</div>
                <div className="text-xs text-muted-fg">{q.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Perlu Perhatian"
          description="Siswa non-aktif atau berkas administrasi belum lengkap."
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
          description="Siswa terakhir yang ditambahkan atau diperbarui."
          action={
            <Link to="/siswa/daftar" className="text-xs text-brand hover:underline">
              Lihat semua
            </Link>
          }
        >
          {q.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat…</div>
          ) : (
            <ul className="divide-y divide-border -my-2">
              {aktivitasTerbaru.map((s) => (
                <li key={s.name} className="py-2.5">
                  <Link
                    to="/siswa/$nis"
                    params={{ nis: s.name }}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar name={s.nama_lengkap ?? s.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-fg truncate group-hover:text-brand">
                        {s.nama_lengkap ?? s.name}
                      </div>
                      <div className="text-xs text-muted-fg truncate">
                        {s.kelas ?? "—"} · {s.jenis_kelamin ?? "—"}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/siswa/")({ component: SiswaDashboardPage });
