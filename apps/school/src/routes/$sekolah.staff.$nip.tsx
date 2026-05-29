import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useResourceDoc } from "@sekolahpro/api-client";
import { ApiPegawaiHeader } from "../features/pegawai/ApiPegawaiHeader";
import { ApiProfilTab } from "../features/pegawai/ApiProfilTab";
import { ApiMengajarTab } from "../features/pegawai/ApiMengajarTab";
import { ApiStaffTab } from "../features/pegawai/ApiStaffTab";
import { ApiBerkasSection } from "../features/pegawai/ApiBerkasSection";
import { ApiKehadiranSection } from "../features/pegawai/ApiKehadiranSection";
import { apiIsGuru, apiIsStaff, type PegawaiApi } from "../features/pegawai/roles";

// Route param `$nip` carries the Pegawai `name` (autoname like PEGAWAI-0001).
type TabKey = "profil" | "mengajar" | "staff" | "berkas" | "kehadiran";

export const Route = createFileRoute("/$sekolah/staff/$nip")({
  component: PegawaiDetail,
});

function PegawaiDetail() {
  const { nip } = Route.useParams();
  const q = useResourceDoc<PegawaiApi>("Pegawai", nip);

  if (q.isLoading) {
    return <div className="text-sm text-muted-fg p-4">Memuat...</div>;
  }
  if (q.error || !q.data) {
    return (
      <div className="rounded-lg border border-border bg-bg p-6 text-center">
        <h1 className="text-lg font-semibold text-fg">Pegawai tidak ditemukan</h1>
        <p className="text-sm text-muted-fg">{nip} tidak terdaftar.</p>
      </div>
    );
  }
  const pegawai = q.data;
  const guruActive = apiIsGuru(pegawai);
  const staffActive = apiIsStaff(pegawai);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "profil", label: "Profil" },
    ...(guruActive ? [{ key: "mengajar" as const, label: "Mengajar" }] : []),
    ...(staffActive ? [{ key: "staff" as const, label: "Kepegawaian Staff" }] : []),
    { key: "berkas", label: "Berkas" },
    { key: "kehadiran", label: "Kehadiran" },
  ];

  const initial: TabKey = guruActive ? "mengajar" : staffActive ? "staff" : "profil";
  const [active, setActive] = useState<TabKey>(initial);

  return (
    <div className="space-y-4">
      <ApiPegawaiHeader pegawai={pegawai} />

      <div className="border-b border-border flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`px-3 py-2 text-sm border-b-2 ${active === t.key ? "border-brand text-brand" : "border-transparent text-muted-fg hover:text-fg"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "profil" ? <ApiProfilTab pegawai={pegawai} /> : null}
      {active === "mengajar" ? <ApiMengajarTab pegawai={pegawai} /> : null}
      {active === "staff" ? <ApiStaffTab pegawai={pegawai} /> : null}
      {active === "berkas" ? <ApiBerkasSection pegawai={pegawai} /> : null}
      {active === "kehadiran" ? <ApiKehadiranSection pegawai={pegawai} /> : null}
    </div>
  );
}
