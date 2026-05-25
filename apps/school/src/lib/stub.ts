// Quick acknowledgement helper for actions that need backend wiring.
// Replace each call site with real implementation when backend is ready.

export function stubAction(label: string, payload?: unknown): void {
  if (payload !== undefined) console.info(`[stub] ${label}`, payload);
  else console.info(`[stub] ${label}`);
  if (typeof window !== "undefined") {
    window.alert(`${label}\n\nFitur ini menunggu integrasi backend.`);
  }
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) {
    window.alert("Tidak ada data untuk diekspor.");
    return;
  }
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openOrAlert(url: string | undefined, fallback: string): void {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
  else window.alert(fallback);
}

export interface PrintRow {
  label: string;
  value: string;
}

export function printDocument(opts: {
  title: string;
  heading: string;
  subheading?: string;
  rows: PrintRow[];
  table?: { header: string[]; rows: string[][] };
}): void {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) {
    window.alert("Popup diblokir. Izinkan popup untuk mencetak.");
    return;
  }
  const doc = w.document;
  doc.title = opts.title;
  const style = doc.createElement("style");
  style.textContent = `
    body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; padding: 24px; color: #111; }
    h1, h2, h3 { margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; text-align: left; }
    th { background: #f5f5f5; }
    .muted { color: #666; font-size: 12px; }
    dl { display: grid; grid-template-columns: 200px 1fr; gap: 4px 12px; font-size: 13px; }
    dt { color: #666; }
    @media print { @page { margin: 16mm; } }
  `;
  doc.head.appendChild(style);

  const wrapper = doc.createElement("div");

  const h1 = doc.createElement("h1");
  h1.textContent = opts.heading;
  wrapper.appendChild(h1);

  if (opts.subheading) {
    const sub = doc.createElement("div");
    sub.className = "muted";
    sub.textContent = opts.subheading;
    wrapper.appendChild(sub);
  }

  const dl = doc.createElement("dl");
  for (const r of opts.rows) {
    const dt = doc.createElement("dt");
    dt.textContent = r.label;
    const dd = doc.createElement("dd");
    dd.textContent = r.value;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }
  wrapper.appendChild(dl);

  if (opts.table) {
    const table = doc.createElement("table");
    const thead = doc.createElement("thead");
    const trh = doc.createElement("tr");
    for (const h of opts.table.header) {
      const th = doc.createElement("th");
      th.textContent = h;
      trh.appendChild(th);
    }
    thead.appendChild(trh);
    table.appendChild(thead);
    const tbody = doc.createElement("tbody");
    for (const row of opts.table.rows) {
      const tr = doc.createElement("tr");
      for (const cell of row) {
        const td = doc.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
  }

  doc.body.appendChild(wrapper);

  const script = doc.createElement("script");
  script.textContent = "window.onload = function() { window.print(); };";
  doc.body.appendChild(script);
}
