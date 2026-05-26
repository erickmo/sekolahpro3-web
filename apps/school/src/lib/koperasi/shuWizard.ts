/**
 * Pure helpers untuk SHU Wizard 4-step.
 *
 * Source schema:
 *   - docs/domains/koperasi/entities/pembagian-shu.html
 *   - docs/domains/koperasi/entities/item-shu-anggota.html
 *
 * Formula (per AD/ART koperasi syariah default):
 *   cadangan = shu_total × pct_cadangan / 100
 *   shu_dibagikan = shu_total − cadangan
 *   per_anggota.total_shu = jasa_anggota + jasa_modal
 *
 * Wizard tidak meng-hitung distribusi otomatis ke nominal aneh —
 * default equal split antara semua anggota aktif sebagai starting
 * point; user wajib review/edit sebelum submit.
 */

export interface WizardStep1Input {
  periode: string;
  shu_total: number;
  pct_cadangan: number;
}

export interface WizardComputed {
  cadangan: number;
  shu_dibagikan: number;
}

export interface ItemShuRow {
  anggota: string;
  jasa_anggota: number;
  jasa_modal: number;
}

export function computeShu(input: WizardStep1Input): WizardComputed {
  const pct = clampPct(input.pct_cadangan);
  const cadangan = Math.round((input.shu_total * pct) / 100);
  const shu_dibagikan = input.shu_total - cadangan;
  return { cadangan, shu_dibagikan };
}

function clampPct(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

export function validateStep1(input: WizardStep1Input): string | null {
  if (!input.periode || !input.periode.trim()) return "Periode wajib diisi.";
  if (!Number.isFinite(input.shu_total) || input.shu_total <= 0) {
    return "SHU total harus lebih dari nol.";
  }
  if (!Number.isFinite(input.pct_cadangan) || input.pct_cadangan < 0 || input.pct_cadangan > 100) {
    return "Persentase cadangan harus 0–100.";
  }
  return null;
}

/**
 * Distribusi equal split: shu_dibagikan dibagi merata jadi total_shu
 * per anggota; lalu di-split 50/50 jasa_anggota & jasa_modal sebagai
 * starting point yang netral.
 */
export function distributeEqually(
  anggotaNames: string[],
  shu_dibagikan: number,
): ItemShuRow[] {
  if (anggotaNames.length === 0) return [];
  const per = Math.floor(shu_dibagikan / anggotaNames.length);
  const half = Math.floor(per / 2);
  return anggotaNames.map((name) => ({
    anggota: name,
    jasa_anggota: half,
    jasa_modal: per - half,
  }));
}

export function totalDistributed(items: ItemShuRow[]): number {
  return items.reduce((s, it) => s + it.jasa_anggota + it.jasa_modal, 0);
}

export function validateStep3(items: ItemShuRow[], shu_dibagikan: number): string | null {
  if (items.length === 0) return "Belum ada anggota untuk dibagikan.";
  for (const it of items) {
    if (it.jasa_anggota < 0 || it.jasa_modal < 0) {
      return `Nominal jasa anggota ${it.anggota} tidak boleh negatif.`;
    }
  }
  const total = totalDistributed(items);
  const diff = total - shu_dibagikan;
  if (Math.abs(diff) > items.length) {
    // Tolerate floor-rounding sisa <= jumlah anggota
    return `Total distribusi (${total.toLocaleString("id-ID")}) tidak cocok dengan SHU dibagikan (${shu_dibagikan.toLocaleString("id-ID")}). Selisih ${diff.toLocaleString("id-ID")}.`;
  }
  return null;
}
