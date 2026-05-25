import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { STAFF_LIST, formatTanggal, type Staff } from "../data/staff";
import { GLOSSARY } from "../lib/glossary";

const TODAY = new Date("2026-05-24");
const SK_WARNING_DAYS = 90;
const BERKAS_REQUIRED_MIN = 5;
const RECENT_LIMIT = 5;
const ATTENTION_LIMIT = 6;

function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

interface Issue {
  staff: Staff;
  label: string;
  tone: "warning" | "danger" | "neutral";
  kind: "sk" | "berkas";
}

function StaffDashboardPage() {
  const stats = useMemo(() => {
    const aktif = STAFF_LIST.filter((s) => s.status === "Aktif").length;
    const skHabis = STAFF_LIST.filter((s) => {
      const d = daysUntil(s.masaKontrakBerakhir);
      return d !== null && d >= 0 && d <= SK_WARNING_DAYS;
    }).length;
    const berkasKurang = STAFF_LIST.filter((s) => s.dokumen.length < BERKAS_REQUIRED_MIN).length;
    // Cuti hari ini — derived stub, replace when absensi staff wired
    const cutiHariIni = STAFF_LIST.filter((s) => s.status === "Cuti").length || Math.max(0, Math.round(aktif * 0.04));
    return { aktif, cutiHariIni, skHabis, berkasKurang };
  }, []);

  const perluPerhatian = useMemo<Issue[]>(() => {
    const list: Issue[] = [];
    for (const s of STAFF_LIST) {
      const d = daysUntil(s.masaKontrakBerakhir);
      if (d !== null && d >= 0 && d <= SK_WARNING_DAYS) {
        list.push({
          staff: s,
          label: `SK habis dalam ${d} hari (${formatTanggal(s.masaKontrakBerakhir!)})`,
          tone: d <= 30 ? "danger" : "warning",
          kind: "sk",
        });
      } else if (s.dokumen.length < BERKAS_REQUIRED_MIN) {
        list.push({
          staff: s,
          label: `Berkas tidak lengkap (${s.dokumen.length}/${BERKAS_REQUIRED_MIN})`,
          tone: "warning",
          kind: "berkas",
        });
      }
    }
    return list.slice(0, ATTENTION_LIMIT);
  }, []);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    return perluPerhatian.map((it) => ({
      id: `${it.staff.nip}-${it.kind}`,
      label: it.staff.namaLengkap,
      description: `${it.staff.jabatan} · ${it.staff.departemen} — ${it.label}`,
      tone: it.tone,
      badge: it.kind === "sk" ? "SK" : "Berkas",
      href: `/staff/${it.staff.nip}`,
      actionLabel: it.kind === "sk" ? "Perpanjang" : "Upload",
      actionHref: it.kind === "sk" ? "/staff/sk-jabatan" : "/staff/berkas",
    }));
  }, [perluPerhatian]);

  const terbaru = useMemo<Staff[]>(() => {
    return [...STAFF_LIST]
      .sort((a, b) => b.tmtKerja.localeCompare(a.tmtKerja))
      .slice(0, RECENT_LIMIT);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direktori"
        title="Dashboard Staff"
        description="Ringkasan tenaga kependidikan dan staf non-pengajar."
        actions={
          <Link to="/staff/daftar">
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconUsers /></span>
              Lihat Daftar
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Staff Aktif" value={stats.aktif} hint={`dari ${STAFF_LIST.length} total`} icon={<IconCheck />} accent="emerald" urgency="normal" />
        <StatCard
          label="Cuti Hari Ini"
          value={stats.cutiHariIni}
          hint="tidak hadir hari ini"
          icon={<IconUsers />}
          accent="brand"
          urgency="warn"
          actionHref="/absensi/guru"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label={<><GlossaryTooltip term="SK" definition={GLOSSARY.SK} /> Akan Habis</>}
          value={stats.skHabis}
          hint={`dalam ${SK_WARNING_DAYS} hari`}
          icon={<IconAlert />}
          accent="amber"
          urgency="warn"
          actionHref="/staff/sk-jabatan"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
        <StatCard
          label="Berkas Tidak Lengkap"
          value={stats.berkasKurang}
          hint={`< ${BERKAS_REQUIRED_MIN} dokumen`}
          icon={<IconFile />}
          accent="violet"
          urgency="warn"
          actionHref="/staff/berkas"
          renderLink={(href, children) => <Link to={href}>{children}</Link>}
        />
      </div>

      <SectionCard title="Aksi Cepat" description="Pintasan ke modul terkait pengelolaan staff.">
        <div className="flex flex-wrap gap-2">
          <Link to="/staff/jabatan">
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Kelola Jabatan
            </Button>
          </Link>
          <Link to="/staff/sk-jabatan">
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconFile /></span>
              Terbitkan SK
            </Button>
          </Link>
          <Link to="/staff/berkas">
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconFile /></span>
              Unggah Berkas
            </Button>
          </Link>
          <Link to="/staff/daftar">
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
          description="Staff dengan SK akan habis atau berkas tidak lengkap."
        >
          <AttentionList
            items={attentionItems}
            maxItems={5}
            renderLink={(href, children, className) => (
              <Link to={href} className={className}>
                {children}
              </Link>
            )}
          />
        </SectionCard>

        <SectionCard
          title="Aktivitas Terbaru"
          description={`${RECENT_LIMIT} staff dengan TMT terbaru.`}
          padded={false}
        >
          <ul className="divide-y divide-border">
            {terbaru.map((s) => (
              <li key={s.nip}>
                <Link
                  to="/staff/$nip"
                  params={{ nip: s.nip }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <Avatar name={s.namaLengkap} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-fg truncate">{s.namaLengkap}</div>
                    <div className="text-xs text-muted-fg truncate">NIP {s.nip} - {s.jabatan}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-fg whitespace-nowrap">
                    <span className="h-3.5 w-3.5"><IconClock /></span>
                    <span>TMT {formatTanggal(s.tmtKerja)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/staff/")({ component: StaffDashboardPage });
