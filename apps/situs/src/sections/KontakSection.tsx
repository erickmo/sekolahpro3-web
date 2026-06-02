import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSite } from "../SiteContext";
import { useSubmitKontak } from "../lib/kontak";
import { Container, SectionHeading } from "./primitives";
import { MapEmbed } from "./MapEmbed";

const schema = z.object({
  nama: z.string().min(2, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  telepon: z.string().regex(/^[\d\s()+-]{7,20}$/, "Nomor telepon tidak valid"),
  pesan: z.string().min(5, "Pesan terlalu pendek").max(2000),
});
type FormValues = z.infer<typeof schema>;

/** Contact form (writes to the per-school inbox) + contact details. */
export function KontakSection() {
  const site = useSite();
  const submit = useSubmitKontak();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    submit.mutate(
      { sekolah: site.sekolah, ...values },
      { onSuccess: () => { setSent(true); reset(); } },
    );
  };

  return (
    <section className="situs-section">
      <Container className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Hubungi Kami" title="Kontak Sekolah" />
          <dl className="mt-6 space-y-3 text-sm">
            {site.contact.alamat ? <div><dt className="font-semibold" style={{ color: "var(--situs-ink)" }}>Alamat</dt><dd style={{ color: "var(--situs-muted)" }}>{site.contact.alamat}</dd></div> : null}
            {site.contact.telepon ? <div><dt className="font-semibold" style={{ color: "var(--situs-ink)" }}>Telepon</dt><dd style={{ color: "var(--situs-muted)" }}>{site.contact.telepon}</dd></div> : null}
            {site.contact.email ? <div><dt className="font-semibold" style={{ color: "var(--situs-ink)" }}>Email</dt><dd style={{ color: "var(--situs-muted)" }}>{site.contact.email}</dd></div> : null}
          </dl>
          {site.profil.petaEmbed ? (
            <div className="situs-round-lg mt-5 overflow-hidden">
              <MapEmbed embed={site.profil.petaEmbed} title={site.nama} />
            </div>
          ) : null}
        </div>

        <div className="situs-card situs-round-lg p-6">
          {sent ? (
            <div role="status" className="py-8 text-center">
              <p className="text-lg font-semibold" style={{ color: "var(--situs-brand)" }}>Terima kasih!</p>
              <p className="mt-2 text-sm" style={{ color: "var(--situs-muted)" }}>Pesan Anda telah terkirim. Kami akan menghubungi Anda.</p>
              <button type="button" onClick={() => setSent(false)} className="situs-brand-text mt-4 text-sm font-semibold">Kirim pesan lain</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Field label="Nama" error={errors.nama?.message}>
                <input {...register("nama")} className="situs-input" aria-label="Nama" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input {...register("email")} type="email" className="situs-input" aria-label="Email" />
              </Field>
              <Field label="Telepon" error={errors.telepon?.message}>
                <input {...register("telepon")} className="situs-input" aria-label="Telepon" />
              </Field>
              <Field label="Pesan" error={errors.pesan?.message}>
                <textarea {...register("pesan")} rows={4} className="situs-input" aria-label="Pesan" />
              </Field>
              {submit.isError ? <p className="text-sm text-red-600">Gagal mengirim. Coba lagi.</p> : null}
              <button type="submit" disabled={submit.isPending} className="situs-brand-bg situs-round w-full px-4 py-3 text-sm font-semibold disabled:opacity-60">
                {submit.isPending ? "Mengirim…" : "Kirim Pesan"}
              </button>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium" style={{ color: "var(--situs-ink)" }}>{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
