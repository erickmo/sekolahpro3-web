import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@sekolahpro/ui";
import { useSitus } from "../data/situs";
import { ChildArrayManager } from "../features/situs/ChildArrayManager";
import type { ChildSchema } from "../features/situs/schemas";
import {
  KEUNGGULAN_SCHEMA,
  STATISTIK_SCHEMA,
  TESTIMONI_SCHEMA,
} from "../features/situs/blockSchemas";
import { PageGuide } from "../components/guide";
import { SITUS_PAGE_GUIDES } from "../components/situs/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

const SECTIONS: ChildSchema[] = [KEUNGGULAN_SCHEMA, STATISTIK_SCHEMA, TESTIMONI_SCHEMA];

type Row = Record<string, unknown>;

/** Sorotan editor: switch between Keunggulan / Statistik / Testimoni child arrays. */
export function SorotanPage({ sekolah }: { sekolah: string }) {
  const { data } = useSitus(sekolah);
  const [active, setActive] = useState(0);
  const schema = SECTIONS[active] ?? SECTIONS[0]!;
  const rows = ((data as Record<string, unknown> | undefined)?.[schema.field] as Row[]) ?? [];

  return (
    <div className="space-y-4">
      <PageGuide
        storageNamespace="situs-guide:"
        storageId="sorotan"
        title={SITUS_PAGE_GUIDES.sorotan.title}
        intro={SITUS_PAGE_GUIDES.sorotan.intro}
        steps={SITUS_PAGE_GUIDES.sorotan.steps}
        tips={SITUS_PAGE_GUIDES.sorotan.tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s, i) => (
          <Button
            key={s.field}
            variant={i === active ? "default" : "ghost"}
            size="sm"
            onClick={() => setActive(i)}
          >
            {s.singular}
          </Button>
        ))}
      </div>
      <ChildArrayManager key={schema.field} sekolah={sekolah} schema={schema} rows={rows} />
    </div>
  );
}

function SorotanRoute() {
  const { sekolah } = Route.useParams();
  return <SorotanPage sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/sorotan")({ component: SorotanRoute });
