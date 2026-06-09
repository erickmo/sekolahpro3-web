/**
 * Shared run-a-report logic for RunPanel + SusunPaket. Routes a report to its
 * channel's whitelisted method, then saves the returned base64 envelope.
 *  - dinas → export_b64 (TU-gated)
 *  - engine → generate
 * 'desk' reports are not run here (the catalog links them to the Frappe Desk).
 */
import { frappeFetch } from "@sekolahpro/api-client";
import { saveBase64File } from "./download";
import type { ReportChannel } from "./reportChannel";

export const EXPORT_B64 = "sekolahpro.akademik.api.laporan_dinas.export_b64";
export const GENERATE = "sekolahpro.laporan.api.generate.generate";

export interface RunOpts {
  sekolah: string;
  fmt: string;
  periode?: string;
  ref?: string;
}

export interface RunRequest {
  method: string;
  args: Record<string, unknown>;
}

interface ExportEnvelope {
  filename?: string;
  mime?: string;
  content_b64?: string;
}

/** Build the {method, args} for running a report through its channel. */
export function buildRunRequest(
  report: string,
  channel: ReportChannel,
  opts: RunOpts,
): RunRequest {
  if (channel === "engine") {
    return {
      method: GENERATE,
      args: {
        report,
        periode: opts.periode ?? "Bulanan",
        ref: opts.ref ?? "",
        fmt: opts.fmt,
        sekolah: opts.sekolah,
      },
    };
  }
  return {
    method: EXPORT_B64,
    args: {
      report_name: report,
      filters: JSON.stringify({ sekolah: opts.sekolah }),
      fmt: opts.fmt,
    },
  };
}

/** Run a report and save the downloaded file. Returns the saved filename. */
export async function runAndSave(
  report: string,
  channel: ReportChannel,
  opts: RunOpts,
): Promise<string> {
  const { method, args } = buildRunRequest(report, channel, opts);
  const res = (await frappeFetch(method, args)) as ExportEnvelope;
  if (!res?.content_b64) throw new Error("Tidak ada konten laporan");
  const filename = res.filename ?? `${report}.${opts.fmt}`;
  saveBase64File(res.content_b64, filename, res.mime ?? "application/octet-stream");
  return filename;
}
