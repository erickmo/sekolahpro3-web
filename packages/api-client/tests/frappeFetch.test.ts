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
