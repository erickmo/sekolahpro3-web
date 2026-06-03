import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, Card, FormField, Input, PageHeader } from "@sekolahpro/ui";
import { useSitus, useSetDomain } from "../data/situs";

const MAIN_DOMAIN = (import.meta.env.VITE_SITUS_MAIN_DOMAIN as string | undefined) ?? "sekolahpro.id";

/** Domain & SSL settings: subdomain, custom domain, DNS hints, verify/SSL badges. */
export function DomainPage({ sekolah }: { sekolah: string }) {
  const { data } = useSitus(sekolah);
  const setDomain = useSetDomain(sekolah);
  const [subdomain, setSub] = useState("");
  const [customDomain, setCustom] = useState("");

  useEffect(() => {
    if (data) {
      setSub(data.subdomain ?? "");
      setCustom(data.custom_domain ?? "");
    }
  }, [data]);

  const sslTone = data?.ssl_status === "Provisioned" ? "success" : data?.ssl_status === "Failed" ? "danger" : "warning";

  return (
    <div className="space-y-5">
      <PageHeader title="Domain & SSL" description="Atur alamat situs sekolah Anda." />

      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold text-slate-700">Subdomain SekolahPro</h3>
        <FormField label={`Subdomain (akan menjadi <subdomain>.${MAIN_DOMAIN})`} hint="Huruf kecil, angka, dan tanda hubung.">
          <div className="flex items-center gap-2">
            <Input value={subdomain} onChange={(e) => setSub(e.target.value)} placeholder="smp-pelita" />
            <span className="text-sm text-slate-500">.{MAIN_DOMAIN}</span>
          </div>
        </FormField>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Domain Kustom</h3>
          <div className="flex items-center gap-2">
            <Badge tone={data?.domain_verified ? "success" : "neutral"}>
              {data?.domain_verified ? "Terverifikasi" : "Belum verifikasi"}
            </Badge>
            <Badge tone={sslTone}>SSL: {data?.ssl_status ?? "Pending"}</Badge>
          </div>
        </div>
        <FormField label="Domain Kustom" hint="Mis. www.namasekolah.sch.id">
          <Input value={customDomain} onChange={(e) => setCustom(e.target.value)} placeholder="www.namasekolah.sch.id" />
        </FormField>
        {customDomain ? (
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold">Arahkan DNS domain Anda:</p>
            <p className="mt-1 font-mono">CNAME {customDomain} → cname.{MAIN_DOMAIN}</p>
            <p className="mt-1">Verifikasi & SSL akan diproses otomatis oleh tim SekolahPro setelah DNS aktif.</p>
          </div>
        ) : null}
      </Card>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => setDomain.mutate({ subdomain, custom_domain: customDomain })}
          disabled={setDomain.isPending}
        >
          {setDomain.isPending ? "Menyimpan…" : "Simpan Domain"}
        </Button>
        {setDomain.isSuccess ? <span className="text-sm text-emerald-600">Tersimpan.</span> : null}
        {setDomain.isError ? <span className="text-sm text-rose-600">Subdomain mungkin sudah dipakai.</span> : null}
      </div>
    </div>
  );
}

function DomainCms() {
  const { sekolah } = Route.useParams();
  return <DomainPage sekolah={sekolah} />;
}

export const Route = createFileRoute("/sch/$sekolah/situs/domain")({ component: DomainCms });
