import { useState } from "react";
import { Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  NEWS_CATEGORIES,
  type NewsCategory,
  useNewsList,
  formatNewsDate,
} from "../lib/news";
import { useBeritaPageContent } from "../lib/berita-page";

// Local QueryClient so we don't depend on a global provider that the landing app may not have yet.
const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 } },
});

export function Berita() {
  return (
    <QueryClientProvider client={qc}>
      <BeritaInner />
    </QueryClientProvider>
  );
}

function BeritaInner() {
  const [active, setActive] = useState<NewsCategory>("Semua");
  const { data, isLoading, isError } = useNewsList(active);
  const cp = useBeritaPageContent();

  return (
    <>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-sm font-medium text-brand">{cp.hero_eyebrow}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold text-fg leading-tight">
            {cp.hero_title_main}{" "}
            <em className="not-italic font-serif italic text-brand">{cp.hero_title_italic}</em>
          </h1>
          <p className="mt-3 text-muted-fg max-w-2xl">{cp.hero_lead}</p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Kategori" className="flex flex-wrap gap-2 mb-8">
            {NEWS_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                className={
                  "px-3 py-1.5 rounded-full text-sm border transition-colors " +
                  (active === c
                    ? "bg-fg text-bg border-fg"
                    : "bg-bg text-fg/80 border-border hover:bg-muted")
                }
              >
                {c}
              </button>
            ))}
          </nav>

          {isLoading && <SkeletonGrid />}
          {isError && <div className="text-muted-fg text-sm">{cp.error_message}</div>}
          {!isLoading && !isError && (data?.length ?? 0) === 0 && (
            <div className="text-muted-fg text-sm">{cp.empty_message}</div>
          )}
          {!isLoading && !isError && data && data.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((a) => (
                <Link
                  key={a.name}
                  to={`/berita/${encodeURIComponent(a.route)}`}
                  className="group rounded-lg border border-border bg-bg overflow-hidden hover:border-brand transition-colors"
                >
                  {a.cover_image ? (
                    <img src={a.cover_image} alt="" className="w-full aspect-[16/9] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[16/9] bg-gradient-to-br from-brand/10 to-muted" aria-hidden />
                  )}
                  <div className="p-5">
                    <div className="text-xs font-medium uppercase tracking-wide text-brand">
                      {a.category}
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-fg group-hover:text-brand transition-colors line-clamp-2">
                      {a.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-fg line-clamp-3 leading-relaxed">
                      {a.excerpt}
                    </p>
                    <div className="mt-4 text-xs text-muted-fg flex items-center justify-between">
                      <span>{formatNewsDate(a.published_on)}</span>
                      {a.author && <span>{a.author}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Memuat berita">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-bg overflow-hidden">
          <div className="w-full aspect-[16/9] bg-muted animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-full bg-muted animate-pulse rounded" />
            <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
