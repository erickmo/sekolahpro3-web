// Shared school-scoping helpers for mock fixtures.
//
// Each mock entity is tagged with one of `MOCK_SCHOOL_SLUGS` so list/detail
// helpers can filter by the active URL slug. Distributes round-robin by index
// to give every mock school a representative sample.

export const MOCK_SCHOOL_SLUGS = [
  "sd-aletheia-malang",
  "sma-cendekia-jakarta",
  "smp-bina-bangsa-bandung",
] as const;

export type MockSchoolSlug = (typeof MOCK_SCHOOL_SLUGS)[number];

export function pickSchoolSlug(idx: number): MockSchoolSlug {
  return MOCK_SCHOOL_SLUGS[idx % MOCK_SCHOOL_SLUGS.length]!;
}

export function belongsToSchool(
  entitySlug: string | undefined,
  activeSlug: string | undefined,
): boolean {
  if (!activeSlug) return true;
  return entitySlug === activeSlug;
}
