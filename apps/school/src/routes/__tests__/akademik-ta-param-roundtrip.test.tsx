/**
 * Regression: a Tahun Ajaran `name` containing "/" and spaces (e.g. live
 * "SD Aletheia Malang-2026/2027 ASMN-DEMO") must round-trip through the `$ta`
 * path param so the workspace layout's taList.find(t => t.name === useParams().ta)
 * succeeds. The bug: links passed `params={{ ta: taPath(name) }}` — taPath
 * pre-encodes, then the router encodes AGAIN → double-encoded param → lookup
 * fails → redirect to ?pick=1. Fix: pass the RAW name; the router encodes once.
 */
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useParams,
} from "@tanstack/react-router";
import { taPath } from "../../lib/akademikNav";

const NAME = "SD Aletheia Malang-2026/2027 ASMN-DEMO";

afterEach(cleanup);

function renderWithTa(taValue: string) {
  const root = createRootRoute();
  const index = createRoute({ getParentRoute: () => root, path: "/", component: () => null });
  const ta = createRoute({
    getParentRoute: () => root,
    path: "/akademik/$ta",
    component: function TaProbe() {
      // Loose read — this throwaway router isn't part of the app's typed route
      // registry, so the path-constrained `from` overload doesn't apply here.
      const params = useParams({ strict: false }) as { ta?: string };
      return <div data-testid="ta">{params.ta}</div>;
    },
  });
  const router = createRouter({
    routeTree: root.addChildren([index, ta]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
  // Cast: `to`/`params` are typed against the global app router, not this mini one.
  void router.navigate({ to: "/akademik/$ta", params: { ta: taValue } } as never);
}

describe("$ta param round-trip for a slash+space TA name", () => {
  it("RAW name round-trips exactly (the contract links now rely on)", async () => {
    renderWithTa(NAME);
    const el = await waitFor(() => screen.getByTestId("ta"));
    expect(el.textContent).toBe(NAME);
  });

  it("taPath() inside params DOUBLE-encodes — the trap we removed", async () => {
    renderWithTa(taPath(NAME));
    const el = await waitFor(() => screen.getByTestId("ta"));
    // Router decodes once → still the once-encoded form, never the real name.
    expect(el.textContent).not.toBe(NAME);
    expect(el.textContent).toBe(taPath(NAME));
  });
});
