/** Target hapus generik untuk entitas infrastruktur (doctype + name). */
export interface DeleteTarget {
  doctype: string;
  name: string;
}

/** Label ringkas utk dialog konfirmasi hapus, mis. "Lantai GA-L1". */
export function deleteTargetLabel(t: DeleteTarget): string {
  return `${t.doctype} ${t.name}`;
}
