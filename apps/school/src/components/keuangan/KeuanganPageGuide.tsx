/**
 * Keuangan-flavored page guide.
 *
 * Thin wrapper over the shared PageGuide that injects the finance role labels
 * and a dedicated localStorage namespace, so every Keuangan page gets a
 * consistent, role-aware tutorial without repeating wiring.
 */
import type { ReactNode } from "react";
import { PageGuide, type PageGuideStep } from "../guide/PageGuide";
import { ROLE_LABEL, type KeuanganRole } from "../../lib/keuanganRole";

const KEUANGAN_STORAGE_NS = "keuangan-guide:";

/** Resolve a finance role key to its Bahasa Indonesia label. */
function keuanganRoleLabel(role: string): string {
  return ROLE_LABEL[role as KeuanganRole] ?? role;
}

export interface KeuanganPageGuideProps {
  storageId: string;
  intro?: ReactNode;
  steps?: PageGuideStep[];
  tips?: ReactNode[];
  title?: string;
  defaultOpen?: boolean;
  className?: string;
}

/** Page guide preconfigured for the Keuangan hub. */
export function KeuanganPageGuide(props: KeuanganPageGuideProps): ReactNode {
  return (
    <PageGuide
      {...props}
      roleLabel={keuanganRoleLabel}
      storageNamespace={KEUANGAN_STORAGE_NS}
    />
  );
}
