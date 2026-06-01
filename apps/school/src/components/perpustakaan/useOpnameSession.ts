/**
 * useOpnameSession — stateful core of the Stock Opname scan page (layer: hook).
 *
 * Owns the long-running scan session lifecycle so the route component stays a
 * thin "fetch + compose" shell. Responsibilities (verbatim from the original
 * route, see PERP-ADR-0004):
 *   1) Load an existing opname doc (or resume a "new" draft from localStorage).
 *   2) Autosave the draft to the server tiap AUTOSAVE_MS (debounced) when dirty.
 *   3) Mirror every change to localStorage (key per opname name) as a backup.
 *   4) beforeunload guard while there are dirty unsaved changes.
 *   5) Scan / edit / remove row handlers + derived counts + submit.
 *
 * Pure types + helpers live in {@link ./opnameSession}.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createResource, getResource, listResource, updateResource } from "@sekolahpro/api-client";
import { opnameDetailPath } from "./inventarisNav";
import {
  AUTOSAVE_MS,
  OPNAME_DOCTYPE,
  buildOpnamePayload,
  computeOpnameStats,
  defaultHeader,
  lsKey,
  type AuditorOption,
  type Header,
  type OpnameStats,
  type ScanRow,
} from "./opnameSession";

// Re-export the shared types so sub-components can keep importing from the hook.
export type { AuditorOption, Header, OpnameStats, ScanRow } from "./opnameSession";

/** Everything the route + sub-components need from the opname session. */
export interface UseOpnameSession {
  doc: Header;
  setDoc: React.Dispatch<React.SetStateAction<Header>>;
  loading: boolean;
  saving: boolean;
  lastSaved: Date | null;
  scanInput: string;
  setScanInput: React.Dispatch<React.SetStateAction<string>>;
  scanStatus: ScanRow["status_temuan"];
  setScanStatus: React.Dispatch<React.SetStateAction<ScanRow["status_temuan"]>>;
  confirmSubmit: boolean;
  setConfirmSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  err: string | null;
  setDirty: React.Dispatch<React.SetStateAction<boolean>>;
  scanRef: React.RefObject<HTMLInputElement>;
  isNew: boolean;
  isReadonly: boolean;
  currentName: string;
  stats: OpnameStats;
  auditorOptions: AuditorOption[];
  handleScan: (raw: string) => Promise<void>;
  updateRow: (idx: number, patch: Partial<ScanRow>) => void;
  removeRow: (idx: number) => void;
  saveDraft: () => Promise<void>;
  submitOpname: () => Promise<void>;
}

/**
 * Drive the Stock Opname scan session for a given school slug + doc name.
 *
 * @param sekolah active school slug (needed for the shallow refresh-resume URL)
 * @param name opname docname, or `"new"` for a fresh session
 */
export function useOpnameSession(sekolah: string, name: string): UseOpnameSession {
  const navigate = useNavigate();
  const isNew = name === "new";

  const [doc, setDoc] = useState<Header>(() => defaultHeader());
  const [currentName, setCurrentName] = useState<string>(name);
  const [loading, setLoading] = useState(!isNew);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanRow["status_temuan"]>("Hadir");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<number | null>(null);

  // load existing
  useEffect(() => {
    if (isNew) {
      const cached = typeof window !== "undefined" ? window.localStorage.getItem(lsKey("new")) : null;
      if (cached) {
        try {
          setDoc(JSON.parse(cached) as Header);
        } catch {
          // ignore corrupt cache
        }
      }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const d = await getResource<Header & { items?: ScanRow[] }>(OPNAME_DOCTYPE, name);
        if (!cancelled) {
          setDoc({
            ...defaultHeader(),
            ...d,
            items: (d.items ?? []).map((i) => ({ ...i, scanned_at: i.scanned_at ?? Date.now() })),
          });
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Gagal memuat dokumen.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, name]);

  const isReadonly = (doc.docstatus ?? 0) >= 1;

  // localStorage backup on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isReadonly) return;
    window.localStorage.setItem(lsKey(currentName), JSON.stringify(doc));
  }, [doc, currentName, isReadonly]);

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const saveDraft = useCallback(async () => {
    if (isReadonly) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = buildOpnamePayload(doc);
      if (currentName === "new") {
        const created = await createResource<{ name: string }>(OPNAME_DOCTYPE, payload);
        setCurrentName(created.name);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(lsKey("new"));
        }
        // shallow URL update so refresh resumes the right doc — must keep the
        // /sch/<sekolah> scope or the refresh 404s. PERP-GAP-05
        window.history.replaceState(null, "", opnameDetailPath(sekolah, created.name));
      } else {
        await updateResource(OPNAME_DOCTYPE, currentName, payload);
      }
      setLastSaved(new Date());
      setDirty(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal autosave.");
    } finally {
      setSaving(false);
    }
  }, [doc, currentName, isReadonly, sekolah]);

  // debounced autosave
  useEffect(() => {
    if (!dirty || isReadonly) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      void saveDraft();
    }, AUTOSAVE_MS);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [dirty, saveDraft, isReadonly]);

  const stats = useMemo(() => computeOpnameStats(doc.items), [doc.items]);

  const handleScan = async (raw: string) => {
    const eksemplar = raw.trim();
    if (!eksemplar) return;
    // duplicate guard
    const exists = doc.items.find((i) => i.eksemplar === eksemplar);
    if (exists) {
      setErr(`Eksemplar ${eksemplar} sudah discan (${exists.status_temuan}).`);
      setScanInput("");
      return;
    }
    setErr(null);
    setDoc((p) => ({
      ...p,
      items: [...p.items, { eksemplar, status_temuan: scanStatus, scanned_at: Date.now() }],
    }));
    setDirty(true);
    setScanInput("");
  };

  const updateRow = (idx: number, patch: Partial<ScanRow>) => {
    setDoc((p) => {
      const items = [...p.items];
      items[idx] = { ...items[idx]!, ...patch };
      return { ...p, items };
    });
    setDirty(true);
  };

  const removeRow = (idx: number) => {
    setDoc((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
    setDirty(true);
  };

  const submitOpname = async () => {
    if (doc.items.length === 0) {
      setErr("Tidak ada item discan. Tidak bisa submit.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      if (dirty) await saveDraft();
      await updateResource(OPNAME_DOCTYPE, currentName, { docstatus: 1 });
      if (typeof window !== "undefined") window.localStorage.removeItem(lsKey(currentName));
      navigate({ to: "/sch/$sekolah/perpustakaan/inventaris/opname/$name", params: { sekolah, name: currentName } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal submit.");
    } finally {
      setSaving(false);
      setConfirmSubmit(false);
    }
  };

  // load auditors for select (best-effort)
  const [auditorOptions, setAuditorOptions] = useState<AuditorOption[]>([]);
  useEffect(() => {
    listResource<{ name: string; full_name?: string }>("User", {
      fields: ["name", "full_name"],
      filters: { enabled: 1 },
      limit_page_length: 50,
    })
      .then((rows) =>
        setAuditorOptions(rows.map((r) => ({ value: r.name, label: r.full_name ?? r.name }))),
      )
      .catch(() => undefined);
  }, []);

  return {
    doc,
    setDoc,
    loading,
    saving,
    lastSaved,
    scanInput,
    setScanInput,
    scanStatus,
    setScanStatus,
    confirmSubmit,
    setConfirmSubmit,
    err,
    setDirty,
    scanRef,
    isNew,
    isReadonly,
    currentName,
    stats,
    auditorOptions,
    handleScan,
    updateRow,
    removeRow,
    saveDraft,
    submitOpname,
  };
}
