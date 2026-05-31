import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
  ACTIVE_SEKOLAH_HEADER,
  configureResource,
  createResource,
  getResource,
  listResource,
  TenantMismatchError,
} from "../src/frappeResource";

const server = setupServer();
beforeAll(() => server.listen());
afterAll(() => server.close());
beforeEach(() => server.resetHandlers());

const ACTIVE = "SCH-001";

function setup() {
  configureResource({ baseUrl: "https://api.test", getActiveSekolah: () => ACTIVE });
}

describe("tenant-scoped listResource", () => {
  it("injects sekolah filter for tenanted doctypes", async () => {
    setup();
    let captured: URL | undefined;
    server.use(
      http.get("https://api.test/api/resource/Siswa", ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({ data: [] });
      }),
    );
    await listResource("Siswa");
    expect(captured?.searchParams.get("filters")).toBe(
      JSON.stringify([["sekolah", "=", ACTIVE]]),
    );
  });

  it("merges sekolah filter with caller-provided array filters", async () => {
    setup();
    let captured: URL | undefined;
    server.use(
      http.get("https://api.test/api/resource/Siswa", ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({ data: [] });
      }),
    );
    await listResource("Siswa", { filters: [["status", "=", "Aktif"]] });
    const filters = JSON.parse(captured!.searchParams.get("filters")!);
    expect(filters).toEqual([
      ["status", "=", "Aktif"],
      ["sekolah", "=", ACTIVE],
    ]);
  });

  it("does not duplicate sekolah filter when caller already provided one", async () => {
    setup();
    let captured: URL | undefined;
    server.use(
      http.get("https://api.test/api/resource/Siswa", ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({ data: [] });
      }),
    );
    await listResource("Siswa", { filters: [["sekolah", "=", "OTHER-SCH"]] });
    const filters = JSON.parse(captured!.searchParams.get("filters")!);
    expect(filters).toEqual([["sekolah", "=", "OTHER-SCH"]]);
  });

  it("skips injection for blocklisted master doctypes", async () => {
    setup();
    let captured: URL | undefined;
    server.use(
      http.get("https://api.test/api/resource/Tahun%20Ajaran", ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({ data: [] });
      }),
    );
    await listResource("Tahun Ajaran");
    expect(captured?.searchParams.get("filters")).toBeNull();
  });

  it("skips injection when no active sekolah is set", async () => {
    configureResource({ baseUrl: "https://api.test", getActiveSekolah: () => null });
    let captured: URL | undefined;
    server.use(
      http.get("https://api.test/api/resource/Siswa", ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({ data: [] });
      }),
    );
    await listResource("Siswa");
    expect(captured?.searchParams.get("filters")).toBeNull();
  });
});

describe("active-sekolah request header", () => {
  it("sends X-Active-Sekolah on list requests", async () => {
    setup();
    let captured: Request | undefined;
    server.use(
      http.get("https://api.test/api/resource/Siswa", ({ request }) => {
        captured = request.clone();
        return HttpResponse.json({ data: [] });
      }),
    );
    await listResource("Siswa");
    expect(captured?.headers.get(ACTIVE_SEKOLAH_HEADER)).toBe(ACTIVE);
  });

  it("sends X-Active-Sekolah on create requests", async () => {
    setup();
    let captured: Request | undefined;
    server.use(
      http.post("https://api.test/api/resource/Lantai", ({ request }) => {
        captured = request.clone();
        return HttpResponse.json({ data: { name: "GA-L1" } });
      }),
    );
    await createResource("Lantai", { nama: "LT 1", nomor_lantai: 1, gedung: "GA" });
    expect(captured?.headers.get(ACTIVE_SEKOLAH_HEADER)).toBe(ACTIVE);
  });

  it("sends an empty header when no active sekolah is set", async () => {
    configureResource({ baseUrl: "https://api.test", getActiveSekolah: () => null });
    let captured: Request | undefined;
    server.use(
      http.get("https://api.test/api/resource/Siswa", ({ request }) => {
        captured = request.clone();
        return HttpResponse.json({ data: [] });
      }),
    );
    await listResource("Siswa");
    expect(captured?.headers.get(ACTIVE_SEKOLAH_HEADER)).toBe("");
  });
});

describe("tenant-scoped getResource", () => {
  it("returns doc when sekolah matches active", async () => {
    setup();
    server.use(
      http.get("https://api.test/api/resource/Siswa/S-1", () =>
        HttpResponse.json({ data: { name: "S-1", sekolah: ACTIVE } }),
      ),
    );
    const doc = await getResource("Siswa", "S-1");
    expect(doc).toMatchObject({ name: "S-1", sekolah: ACTIVE });
  });

  it("throws TenantMismatchError when fetched doc belongs to another sekolah", async () => {
    setup();
    server.use(
      http.get("https://api.test/api/resource/Siswa/S-2", () =>
        HttpResponse.json({ data: { name: "S-2", sekolah: "OTHER-SCH" } }),
      ),
    );
    await expect(getResource("Siswa", "S-2")).rejects.toBeInstanceOf(TenantMismatchError);
  });

  it("allows blocklisted doctypes through without sekolah check", async () => {
    setup();
    server.use(
      http.get("https://api.test/api/resource/Tahun%20Ajaran/TA-2025", () =>
        HttpResponse.json({ data: { name: "TA-2025" } }),
      ),
    );
    const doc = await getResource("Tahun Ajaran", "TA-2025");
    expect(doc).toMatchObject({ name: "TA-2025" });
  });
});
