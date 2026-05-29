import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { configure } from "@sekolahpro/api-client";
import { server } from "./src/mocks/server";
import { db } from "./src/mocks/db";

// frappeFetch builds `${baseUrl}/api/method/...`. Empty baseUrl yields a
// relative URL which jsdom resolves against window.location so MSW can match
// on path alone, regardless of the test origin.
configure({ baseUrl: "" });

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  // Reset mutable fixture so tests do not leak state across files.
  db.students[0]!.saldo = 50000;
  db.students[0]!.today_spent = 0;
  db.students[1]!.saldo = 5000;
  db.students[1]!.today_spent = 0;
  db.students[2]!.saldo = 100000;
  db.students[2]!.today_spent = 18000;
  db.transaksi.length = 0;
  db.idempotency.clear();
});

afterAll(() => server.close());
