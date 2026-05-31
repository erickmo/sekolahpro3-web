import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { configure, frappeFetch } from "../src/frappeFetch";

const server = setupServer();
beforeAll(() => server.listen());
afterAll(() => server.close());
beforeEach(() => server.resetHandlers());

describe("frappeFetch", () => {
  it("calls /api/method/<name> with credentials", async () => {
    configure({ baseUrl: "https://api.test" });
    let captured: Request | undefined;
    server.use(
      http.post("https://api.test/api/method/ping", async ({ request }) => {
        captured = request.clone();
        return HttpResponse.json({ message: "pong" });
      }),
    );

    const out = await frappeFetch<string>("ping", { msg: "hi" });

    expect(out).toBe("pong");
    expect(captured?.credentials).toBe("include");
    expect(captured?.headers.get("content-type")).toContain("application/json");
  });

  it("sends X-Active-Sekolah header from config", async () => {
    configure({ baseUrl: "https://api.test", getActiveSekolah: () => "SCH-001" });
    let captured: Request | undefined;
    server.use(
      http.post("https://api.test/api/method/ping", async ({ request }) => {
        captured = request.clone();
        return HttpResponse.json({ message: "pong" });
      }),
    );

    await frappeFetch("ping", {});

    expect(captured?.headers.get("X-Active-Sekolah")).toBe("SCH-001");
  });

  it("throws on non-2xx", async () => {
    configure({ baseUrl: "https://api.test" });
    server.use(
      http.post("https://api.test/api/method/boom", () =>
        HttpResponse.json({ exc: "AuthenticationError" }, { status: 401 }),
      ),
    );
    await expect(frappeFetch("boom", {})).rejects.toThrow(/401/);
  });
});
