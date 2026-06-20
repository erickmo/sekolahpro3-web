// akademikTaSwitch — derive the in-place Tahun Ajaran switcher for the akademik
// sub-module layouts (absensi/kelas/jadwal/ekskul) from the workspace period
// context. Pure (no React/I-O) so the wiring stays testable and the four layouts
// don't each re-derive it. The TA `options` + active value come from the context
// (filled by the `$ta` layout); switching delegates to the context's
// `setTahunAjaran`, which preserves the current sub-module (see submoduleRoot).
import type { PeriodSwitch } from "../components/shell/StripTahun";
import type { PeriodContextValue } from "./periodContext";

/**
 * Build the StripTahun TA dropdown from the workspace period context.
 *
 * @param ctx - The akademik workspace period context value.
 * @returns A PeriodSwitch wiring value/options/onChange, or undefined when there
 *   are no Tahun Ajaran options to switch between (the strip then shows the
 *   read-only TA badge instead).
 */
export function buildTaSwitch(ctx: PeriodContextValue): PeriodSwitch | undefined {
  const options = ctx.taOptions ?? [];
  if (options.length === 0) return undefined;
  return { value: ctx.tahunAjaran, options, onChange: ctx.setTahunAjaran };
}
