import { WizardShell } from "../features/ppdb/WizardShell";

export function Ppdb() {
  return (
    <main className="bg-slate-50 py-10">
      <header className="mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-3xl font-bold">Pendaftaran PPDB Online</h1>
        <p className="mt-2 text-gray-600">
          Lengkapi 5 langkah berikut untuk mendaftar sebagai calon siswa.
        </p>
      </header>
      <WizardShell />
    </main>
  );
}
