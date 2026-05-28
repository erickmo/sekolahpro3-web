import { useCallback } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { EntriNilaiSelector, type EntriNilaiSelection } from "../components/akademik/EntriNilaiSelector";
import { EntriNilaiGrid } from "../components/akademik/EntriNilaiGrid";
import { useAkademikContextOptional } from "../lib/akademikContext";

interface EditSearch {
  rombel?: string;
  mapel?: string;
  semester?: string;
  ta?: string;
}

function EntriNilaiEditPage() {
  const ctx = useAkademikContextOptional();
  const search = useSearch({ from: "/akademik/entri-nilai/edit" });
  const navigate = useNavigate({ from: "/akademik/entri-nilai/edit" });

  const onStart = useCallback(
    (sel: EntriNilaiSelection) => {
      navigate({
        to: ".",
        search: {
          rombel: sel.rombel,
          mapel: sel.mapel,
          semester: sel.semester,
          ta: sel.tahunAjaran,
        },
        replace: true,
      });
    },
    [navigate],
  );

  const onChangeSelection = useCallback(() => {
    navigate({
      to: ".",
      search: () => ({}),
      replace: true,
    });
  }, [navigate]);

  const ready = !!(search.rombel && search.mapel && search.semester && search.ta);

  if (ready) {
    return (
      <EntriNilaiGrid
        selection={{
          rombel: search.rombel!,
          mapel: search.mapel!,
          semester: search.semester!,
          tahunAjaran: search.ta!,
        }}
        onChangeSelection={onChangeSelection}
      />
    );
  }

  const initial: Partial<EntriNilaiSelection> = {};
  if (search.rombel) initial.rombel = search.rombel;
  if (search.mapel) initial.mapel = search.mapel;
  if (search.semester) initial.semester = search.semester;
  else if (ctx?.semester) initial.semester = ctx.semester;
  if (search.ta) initial.tahunAjaran = search.ta;
  else if (ctx?.tahunAjaran) initial.tahunAjaran = ctx.tahunAjaran;

  return <EntriNilaiSelector initial={initial} onStart={onStart} />;
}

export const Route = createFileRoute("/akademik/entri-nilai/edit")({
  component: EntriNilaiEditPage,
  validateSearch: (s: Record<string, unknown>): EditSearch => {
    const out: EditSearch = {};
    if (typeof s.rombel === "string" && s.rombel) out.rombel = s.rombel;
    if (typeof s.mapel === "string" && s.mapel) out.mapel = s.mapel;
    if (typeof s.semester === "string" && s.semester) out.semester = s.semester;
    if (typeof s.ta === "string" && s.ta) out.ta = s.ta;
    return out;
  },
});
