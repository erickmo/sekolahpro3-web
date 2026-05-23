import { useQuery } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface NewsItem {
  name: string;
  title: string;
  route: string;
  published_on: string;
  category: string;
  excerpt: string;
  author: string;
  cover_image?: string | null;
}

export interface NewsArticle extends NewsItem {
  content: string;
}

async function frappeGet<T>(method: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${API_BASE}/api/method/${method}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`${method} failed: ${res.status}`);
  const json = await res.json();
  return json.message as T;
}

export const NEWS_CATEGORIES = ["Semua", "Berita", "Pengumuman", "Event", "Artikel", "Rilis Produk"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export function useNewsList(category: NewsCategory = "Semua") {
  return useQuery<NewsItem[]>({
    queryKey: ["news.list", category],
    queryFn: () =>
      frappeGet<NewsItem[]>("sekolahpro.api.landing.list_news", {
        kategori: category,
        limit: 50,
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNewsArticle(route: string) {
  return useQuery<NewsArticle>({
    queryKey: ["news.get", route],
    queryFn: () => frappeGet<NewsArticle>("sekolahpro.api.landing.get_news", { route }),
    enabled: !!route,
    staleTime: 10 * 60 * 1000,
  });
}

export function formatNewsDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
