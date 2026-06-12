/**
 * Thin wrapper that renders the centralized {@link KOPERASI_PAGE_GUIDES} content
 * for a given Koperasi page as a collapsible PageGuide, wired with the koperasi
 * role labels. Pages add it with a single tag: <KoperasiPageGuide id="transaksi" />.
 */
import { PageGuide } from "../guide";
import { KOPERASI_ROLE_LABEL } from "../../lib/koperasi/role";
import { KOPERASI_PAGE_GUIDES, type KoperasiGuideId } from "./pageGuides";

export function KoperasiPageGuide({ id }: { id: KoperasiGuideId }) {
  const guide = KOPERASI_PAGE_GUIDES[id];
  return (
    <PageGuide
      storageId={`koperasi-${id}`}
      title={guide.title}
      intro={guide.intro}
      steps={guide.steps}
      tips={guide.tips}
      roleLabels={KOPERASI_ROLE_LABEL}
    />
  );
}
