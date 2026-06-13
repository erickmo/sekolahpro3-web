import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
  ACTIVE_KOPERASI_HEADER,
  ACTIVE_SEKOLAH_HEADER,
  configureResource,
  createResource,
  getResource,
  listResource,
  TenantMismatchError,
  type ActiveTenant,
} from "../src/frappeResource";
import {
  injectTenantFilter,
  isKoperasiScopedDoctype,
  tenantCacheKey,
} from "../src/tenant";

// Koperasi tenant context: the active anchor is a Koperasi (org-level), with
// the set of Sekolah it covers (sekolah_utama first). KOPERASI-tier doctypes
// are scoped by `koperasi`; SCHOOL-tier doctypes by `sekolah in schools`.
const KOP: ActiveTenant = {
  kind: "koperasi",
  koperasi: "KOP-001",
  schools: ["SCH-001", "SCH-002"],
};
const SEK: ActiveTenant = { kind: "sekolah", sekolah: "SCH-001" };

describe("isKoperasiScopedDoctype", () => {
  it("classifies KOPERASI-tier doctypes", () => {
    expect(isKoperasiScopedDoctype("Nasabah")).toBe(true);
    expect(isKoperasiScopedDoctype("Rekening Simpanan")).toBe(true);
    expect(isKoperasiScopedDoctype("Penyaluran ZIS")).toBe(true);
    expect(isKoperasiScopedDoctype("E-Money Wallet")).toBe(true);
  });
  it("excludes SCHOOL-tier and global doctypes", () => {
    expect(isKoperasiScopedDoctype("Siswa")).toBe(false);
    expect(isKoperasiScopedDoctype("Denominasi Uang")).toBe(false);
    expect(isKoperasiScopedDoctype("Koperasi")).toBe(false);
  });
});

describe("injectTenantFilter — koperasi tenant", () => {
  it("scopes a KOPERASI-tier doctype by koperasi", () => {
    expect(injectTenantFilter("Nasabah", KOP, undefined)).toEqual([
      ["koperasi", "=", "KOP-001"],
    ]);
  });

  it("scopes a SCHOOL-tier doctype by sekolah in covered schools", () => {
    expect(injectTenantFilter("Siswa", KOP, undefined)).toEqual([
      ["sekolah", "in", ["SCH-001", "SCH-002"]],
    ]);
  });

  it("keeps caller-provided koperasi filter (no duplicate)", () => {
    expect(
      injectTenantFilter("Nasabah", KOP, [["koperasi", "=", "KOP-XYZ"]]),
    ).toEqual([["koperasi", "=", "KOP-XYZ"]]);
  });

  it("merges with caller filters for KOPERASI-tier doctypes", () => {
    expect(
      injectTenantFilter("Nasabah", KOP, [["status", "=", "Aktif"]]),
    ).toEqual([
      ["status", "=", "Aktif"],
      ["koperasi", "=", "KOP-001"],
    ]);
  });

  it("skips global masters entirely", () => {
    expect(injectTenantFilter("Denominasi Uang", KOP, undefined)).toBeUndefined();
    expect(injectTenantFilter("Fatwa DSN MUI", KOP, undefined)).toBeUndefined();
    expect(injectTenantFilter("Sanctions List Entry", KOP, undefined)).toBeUndefined();
    expect(injectTenantFilter("Koperasi", KOP, undefined)).toBeUndefined();
    expect(injectTenantFilter("Pengaturan Koperasi", KOP, undefined)).toBeUndefined();
  });

  it("keeps legacy sekolah behavior for sekolah tenant", () => {
    expect(injectTenantFilter("Siswa", SEK, undefined)).toEqual([
      ["sekolah", "=", "SCH-001"],
    ]);
    // KOPERASI-tier doctype browsed from a school context still pins to the
    // school (rows carry sekolah), preserving the previous behavior.
    expect(injectTenantFilter("Nasabah", SEK, undefined)).toEqual([
      ["sekolah", "=", "SCH-001"],
    ]);
  });

  it("no-ops when there is no active tenant", () => {
    expect(injectTenantFilter("Siswa", null, undefined)).toBeUndefined();
  });
});

describe("tenantCacheKey", () => {
  it("partitions by koperasi for koperasi tenants", () => {
    expect(tenantCacheKey("Nasabah", KOP)).toBe("KOP-001");
  });
  it("partitions by sekolah for sekolah tenants", () => {
    expect(tenantCacheKey("Siswa", SEK)).toBe("SCH-001");
  });
  it("is null for untenanted doctypes", () => {
    expect(tenantCacheKey("Denominasi Uang", KOP)).toBeNull();
  });
});

// ——————————————————————————————————————————————————————————— integration

const server = setupServer();
beforeAll(() => server.listen());
afterAll(() => server.close());
beforeEach(() => server.resetHandlers());

function setupKop() {
  configureResource({
    baseUrl: "https://api.test",
    getActiveSekolah: () => null,
    getActiveTenant: () => KOP,
  });
}

describe("listResource under a koperasi tenant", () => {
  it("filters KOPERASI-tier doctypes by koperasi and sends both headers", async () => {
    setupKop();
    let captured: Request | undefined;
    server.use(
      http.get("https://api.test/api/resource/Nasabah", ({ request }) => {
        captured = request.clone();
        return HttpResponse.json({ data: [] });
      }),
    );
    await listResource("Nasabah");
    const url = new URL(captured!.url);
    expect(JSON.parse(url.searchParams.get("filters")!)).toEqual([
      ["koperasi", "=", "KOP-001"],
    ]);
    expect(captured?.headers.get(ACTIVE_KOPERASI_HEADER)).toBe("KOP-001");
    // Anchor school still rides along for SCHOOL-tier writes server-side.
    expect(captured?.headers.get(ACTIVE_SEKOLAH_HEADER)).toBe("SCH-001");
  });

  it("filters SCHOOL-tier doctypes by covered schools", async () => {
    setupKop();
    let captured: URL | undefined;
    server.use(
      http.get("https://api.test/api/resource/Siswa", ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({ data: [] });
      }),
    );
    await listResource("Siswa");
    expect(JSON.parse(captured!.searchParams.get("filters")!)).toEqual([
      ["sekolah", "in", ["SCH-001", "SCH-002"]],
    ]);
  });
});

describe("createResource under a koperasi tenant", () => {
  it("sends the koperasi header so the backend can derive tenant fields", async () => {
    setupKop();
    let captured: Request | undefined;
    server.use(
      http.post("https://api.test/api/resource/Nasabah", ({ request }) => {
        captured = request.clone();
        return HttpResponse.json({ data: { name: "NSB-0001" } });
      }),
    );
    await createResource("Nasabah", { pihak_tipe: "Siswa", pihak: "S-1" });
    expect(captured?.headers.get(ACTIVE_KOPERASI_HEADER)).toBe("KOP-001");
  });
});

describe("getResource under a koperasi tenant", () => {
  it("accepts a KOPERASI-tier doc of the active koperasi", async () => {
    setupKop();
    server.use(
      http.get("https://api.test/api/resource/Nasabah/NSB-1", () =>
        HttpResponse.json({ data: { name: "NSB-1", koperasi: "KOP-001", sekolah: "SCH-001" } }),
      ),
    );
    await expect(getResource("Nasabah", "NSB-1")).resolves.toMatchObject({ name: "NSB-1" });
  });

  it("rejects a KOPERASI-tier doc of another koperasi", async () => {
    setupKop();
    server.use(
      http.get("https://api.test/api/resource/Nasabah/NSB-2", () =>
        HttpResponse.json({ data: { name: "NSB-2", koperasi: "KOP-OTHER" } }),
      ),
    );
    await expect(getResource("Nasabah", "NSB-2")).rejects.toBeInstanceOf(TenantMismatchError);
  });

  it("accepts a legacy KOPERASI-tier doc with empty koperasi but covered sekolah", async () => {
    setupKop();
    server.use(
      http.get("https://api.test/api/resource/Nasabah/NSB-3", () =>
        HttpResponse.json({ data: { name: "NSB-3", koperasi: "", sekolah: "SCH-002" } }),
      ),
    );
    await expect(getResource("Nasabah", "NSB-3")).resolves.toMatchObject({ name: "NSB-3" });
  });

  it("rejects a SCHOOL-tier doc outside the covered schools", async () => {
    setupKop();
    server.use(
      http.get("https://api.test/api/resource/Siswa/S-9", () =>
        HttpResponse.json({ data: { name: "S-9", sekolah: "SCH-OTHER" } }),
      ),
    );
    await expect(getResource("Siswa", "S-9")).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
