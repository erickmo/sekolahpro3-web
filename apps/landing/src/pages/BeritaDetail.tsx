import { Link, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@sekolahpro/ui";
import { useNewsArticle, formatNewsDate } from "../lib/news";
import { useBeritaPageContent } from "../lib/berita-page";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export function BeritaDetail() {
  return (
    <QueryClientProvider client={qc}>
      <BeritaDetailInner />
    </QueryClientProvider>
  );
}

function BeritaDetailInner() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useNewsArticle(slug);
  const cp = useBeritaPageContent();

  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="mt-4 h-10 w-3/4 bg-muted animate-pulse rounded" />
        <div className="mt-3 h-4 w-1/2 bg-muted animate-pulse rounded" />
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full bg-muted animate-pulse rounded" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold text-fg">{cp.detail_not_found_title}</h1>
        <p className="mt-3 text-muted-fg">{cp.detail_not_found_body}</p>
        <div className="mt-6">
          <Link to="/berita">
            <Button>{cp.detail_not_found_action}</Button>
          </Link>
        </div>
      </section>
    );
  }

  const htmlProps = { __html: data.content ?? "" };

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <Link to="/berita" className="text-sm text-brand hover:underline">
        {cp.detail_back_label}
      </Link>

      <div className="mt-4 text-xs font-medium uppercase tracking-wide text-brand">
        {data.category}
      </div>
      <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-semibold text-fg leading-tight tracking-tight">
        {data.title}
      </h1>
      <div className="mt-3 text-sm text-muted-fg">
        {formatNewsDate(data.published_on)}
        {data.author && <span> · {data.author}</span>}
      </div>

      {data.cover_image && (
        <img
          src={data.cover_image}
          alt=""
          className="mt-8 w-full rounded-lg object-cover aspect-[16/9]"
          loading="lazy"
        />
      )}

      {data.excerpt && (
        <p className="mt-8 text-lg text-fg/80 leading-relaxed font-serif italic">
          {data.excerpt}
        </p>
      )}

      {/* Content from trusted internal author flow (Frappe admin). Sanitize at write-time if untrusted authors are introduced. */}
      <div
        className="mt-8 text-fg/90 leading-relaxed [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-fg [&_h2]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_p]:mt-4 [&_a]:text-brand [&_a]:underline [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mt-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mt-4 [&_strong]:font-semibold"
        dangerouslySetInnerHTML={htmlProps}
      />

      <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
        <Link to="/berita" className="text-sm text-brand hover:underline">
          {cp.detail_back_label}
        </Link>
        <Link to="/kontak?utm=berita">
          <Button size="sm">{cp.detail_cta_label}</Button>
        </Link>
      </div>
    </article>
  );
}
