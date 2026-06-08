/**
 * KotakMasalahData — the pre-flight data-quality gate (winner's killer feature).
 * Runs the Siswa Missing NISN report through the TU-gated Dinas export channel
 * and blocks the compliance submission while any student lacks a NISN, deep-
 * linking to fix the records. Prevents the #1 TU failure: a Dapodik rejection.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { frappeFetch } from "@sekolahpro/api-client";
import { SectionCard, Badge, Button } from "@sekolahpro/ui";
import { evaluateNisnGate, extractRows, type NisnGateResult } from "../../lib/laporan/nisnGate";

const EXPORT_DATA = "sekolahpro.akademik.api.laporan_dinas.export_data";
const NISN_REPORT = "Siswa Missing NISN";

export interface KotakMasalahDataProps {
  sekolah: string;
  /** Called whenever the gate result changes (e.g. to enable "Kirim"). */
  onResult?: (result: NisnGateResult) => void;
}

export function KotakMasalahData({ sekolah, onResult }: KotakMasalahDataProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [gate, setGate] = useState<NisnGateResult | null>(null);

  async function check() {
    setLoading(true);
    setError(false);
    try {
      const res = await frappeFetch(EXPORT_DATA, {
        report_name: NISN_REPORT,
        filters: JSON.stringify({ sekolah }),
        format: "json",
      });
      const result = evaluateNisnGate(extractRows(res));
      setGate(result);
      onResult?.(result);
    } catch (_) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sekolah) check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sekolah]);

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span>Kotak Masalah Data</span>
          {gate ? (
            <Badge tone={gate.blocked ? "danger" : "success"}>
              {gate.blocked ? `${gate.count} masalah` : "Bersih"}
            </Badge>
          ) : null}
        </span>
      }
      description="Cek kualitas data sebelum kirim laporan Dinas."
      action={
        <Button size="sm" variant="outline" onClick={check} disabled={loading}>
          {loading ? "Memeriksa…" : "Periksa ulang"}
        </Button>
      }
    >
      {loading && !gate ? (
        <div className="py-2 text-sm text-muted-fg">Memeriksa NISN siswa…</div>
      ) : error ? (
        <div className="py-2 text-sm text-amber-600">
          Gagal memeriksa NISN (endpoint Dinas mungkin belum live).
        </div>
      ) : gate?.blocked ? (
        <div className="space-y-2">
          <div className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-700">
            {gate.count} siswa belum punya NISN. Lengkapi dulu sebelum kirim ke Dapodik —
            submission akan ditolak bila ada NISN kosong.
          </div>
          <Link
            to="/sch/$sekolah/siswa"
            params={{ sekolah }}
            className="text-sm text-brand hover:underline"
          >
            Perbaiki data siswa →
          </Link>
        </div>
      ) : gate ? (
        <div className="py-2 text-sm text-emerald-600">
          Data NISN lengkap. Siap menyusun paket Dinas.
        </div>
      ) : null}
    </SectionCard>
  );
}
