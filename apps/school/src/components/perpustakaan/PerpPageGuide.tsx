/**
 * Thin wrapper that renders the centralized {@link PERP_PAGE_GUIDES} content for
 * a given Perpustakaan page as a collapsible PageGuide, wired with the library
 * role labels. Pages add it with a single tag: <PerpPageGuide id="daftar" />.
 */
import { PageGuide } from "../guide";
import { ROLE_LABEL } from "../../lib/perpustakaanRole";
import { PERP_PAGE_GUIDES, type PerpGuideId } from "./pageGuides";

export function PerpPageGuide({ id }: { id: PerpGuideId }) {
  const guide = PERP_PAGE_GUIDES[id];
  return (
    <PageGuide
      storageId={`perpus-${id}`}
      title={guide.title}
      intro={guide.intro}
      steps={guide.steps}
      tips={guide.tips}
      roleLabels={ROLE_LABEL}
    />
  );
}
