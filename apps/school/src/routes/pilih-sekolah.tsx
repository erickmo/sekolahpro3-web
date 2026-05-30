import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, Input, Skeleton } from "@sekolahpro/ui";
import { useSessionStore, logout } from "@sekolahpro/auth";
import {
  useMySchools,
  useSelectSchool,
  useSelectKoperasi,
  type FooterContent,
  type KoperasiCard as KoperasiCardData,
  type OnboardingCta,
  type SekolahCard,
  type SekolahGroup,
} from "../data/sekolah";

const ROLE_TONE: Record<string, string> = {
  Admin: "bg-blue-500/20 text-blue-100 ring-1 ring-blue-300/40",
  Guru: "bg-violet-500/20 text-violet-100 ring-1 ring-violet-300/40",
  Siswa: "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-300/40",
  "Orang Tua": "bg-amber-500/20 text-amber-100 ring-1 ring-amber-300/40",
  "Operator PPDB":
    "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/40",
};

const STATUS_TONE: Record<string, string> = {
  Aktif: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40",
};

const GRADIENT_BG =
  "linear-gradient(135deg, hsl(222 89% 22%) 0%, hsl(262 83% 28%) 45%, hsl(292 76% 30%) 100%)";

const PATTERN_OVERLAY =
  "radial-gradient(60% 50% at 80% 10%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%), radial-gradient(55% 45% at 10% 90%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 60%), radial-gradient(40% 30% at 50% 50%, rgba(168,85,247,0.25) 0%, rgba(168,85,247,0) 70%)";

export function PilihSekolahPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useMySchools();
  const select = useSelectSchool();
  const selectKoperasi = useSelectKoperasi();
  const setActiveSekolah = useSessionStore((s) => s.setActiveSekolah);
  const userEmail = useSessionStore((s) => s.user);
  const [activeOrg, setActiveOrg] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate({ to: "/login" });
    }
  };

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      200,
    );
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!data || data.total_schools !== 1) return;
    const only = data.groups[0]?.schools[0];
    if (!only) return;
    select.mutate(
      { name: only.sekolah },
      {
        onSuccess: (resp) => {
          setActiveSekolah({
            name: resp.sekolah,
            nama: resp.nama,
            subdomain: resp.subdomain,
            slug: resp.slug,
          });
          navigate({ to: "/$sekolah", params: { sekolah: resp.slug } });
        },
      },
    );
  }, [data, select, navigate, setActiveSekolah]);

  const showToolbar =
    !!data && (data.org_count >= 2 || data.total_schools > 4);

  const filteredGroups: SekolahGroup[] = useMemo(() => {
    if (!data) return [];
    return data.groups
      .filter((g) => activeOrg === "all" || g.organisasi === activeOrg)
      .map((g) => ({
        ...g,
        schools: debouncedQuery
          ? g.schools.filter((s) =>
              s.nama.toLowerCase().includes(debouncedQuery),
            )
          : g.schools,
      }))
      .filter((g) => g.schools.length > 0);
  }, [data, activeOrg, debouncedQuery]);

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white font-sans"
      style={{ background: GRADIENT_BG }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: PATTERN_OVERLAY }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-10 pb-16">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur ring-1 ring-white/25 text-lg font-bold"
              aria-hidden
            >
              S
            </span>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight">
                SekolahPro
              </div>
              <div className="text-[11px] text-white/60">Portal Sekolah</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userEmail ? (
              <div className="hidden sm:block text-xs text-white/60 truncate max-w-[260px]">
                Masuk sebagai{" "}
                <span className="text-white/90 font-medium">{userEmail}</span>
              </div>
            ) : null}
            {data?.onboarding ? (
              <OnboardingButton cta={data.onboarding} />
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 ring-1 ring-white/25 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              {loggingOut ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              )}
              Keluar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl bg-white/10" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="mx-auto max-w-md text-center rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-8">
            <p className="text-sm text-red-200 mb-4">
              Gagal memuat daftar sekolah.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/15 hover:bg-white/25 ring-1 ring-white/25 text-sm font-medium"
            >
              Coba lagi
            </button>
          </div>
        ) : data.total_schools === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">
              Belum terdaftar di sekolah manapun
            </h2>
            <p className="text-sm text-white/70">
              Hubungi admin sekolah Anda untuk mendapatkan akses.
            </p>
            {data.onboarding ? (
              <div className="mt-5 flex justify-center">
                <OnboardingButton cta={data.onboarding} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-8">
            {select.isError ? (
              <div className="rounded-xl border border-red-300/40 bg-red-500/15 backdrop-blur p-4 text-sm">
                <div className="font-semibold text-red-100 mb-1">
                  Gagal memilih sekolah
                </div>
                <div className="text-red-100/80 break-words">
                  {(select.error as Error)?.message ?? "Unknown error"}
                </div>
              </div>
            ) : null}
            <header className="space-y-3 max-w-2xl">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                Selamat datang.
                <br />
                Pilih sekolah untuk memulai.
              </h1>
              <p className="text-sm sm:text-base text-white/70">
                Anda terdaftar di {data.total_schools} sekolah
                {data.org_count > 1
                  ? ` pada ${data.org_count} organisasi`
                  : ""}
                . Pilih salah satu untuk masuk ke dashboard.
              </p>
            </header>

            {showToolbar && (
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div
                  role="tablist"
                  aria-label="Filter organisasi"
                  className="flex gap-2 overflow-x-auto"
                >
                  <OrgChip
                    label="Semua"
                    active={activeOrg === "all"}
                    onClick={() => setActiveOrg("all")}
                  />
                  {data.groups.map((g) => (
                    <OrgChip
                      key={g.organisasi}
                      label={g.organisasi_nama}
                      active={activeOrg === g.organisasi}
                      onClick={() => setActiveOrg(g.organisasi)}
                    />
                  ))}
                </div>
                <Input
                  type="search"
                  placeholder="Cari sekolah..."
                  aria-label="Cari sekolah"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="sm:max-w-xs bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            )}

            {filteredGroups.length === 0 ? (
              <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-8 text-center">
                <EmptyState
                  title="Tidak ada sekolah cocok"
                  description="Coba ubah kata kunci atau filter organisasi."
                />
              </div>
            ) : (
              filteredGroups.map((group) => (
                <section key={group.organisasi} className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-lg font-semibold text-white/95">
                      {group.organisasi_nama}
                    </h2>
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-[11px] font-semibold bg-white/15 ring-1 ring-white/20">
                      {group.schools.length}
                    </span>
                    <span className="flex-1 h-px bg-white/10 ml-2" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.schools.map((school) => (
                      <SchoolCard
                        key={school.sekolah}
                        school={school}
                        busy={select.isPending}
                        onSelect={() => {
                          select.mutate(
                            { name: school.sekolah },
                            {
                              onSuccess: (resp) => {
                                setActiveSekolah({
                                  name: resp.sekolah,
                                  nama: resp.nama,
                                  subdomain: resp.subdomain,
                                  slug: resp.slug,
                                });
                                navigate({
                                  to: "/$sekolah",
                                  params: { sekolah: resp.slug },
                                });
                              },
                            },
                          );
                        }}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}

            {(data.koperasi?.length ?? 0) > 0 ? (
              <section className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-lg font-semibold text-white/95">
                    Koperasi
                  </h2>
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-[11px] font-semibold bg-white/15 ring-1 ring-white/20">
                    {data.koperasi.length}
                  </span>
                  <span className="flex-1 h-px bg-white/10 ml-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.koperasi.map((kop) => (
                    <KoperasiCard
                      key={kop.koperasi}
                      koperasi={kop}
                      busy={selectKoperasi.isPending}
                      onSelect={() => {
                        selectKoperasi.mutate(
                          { name: kop.koperasi },
                          {
                            onSuccess: (resp) => {
                              setActiveSekolah({
                                name: resp.sekolah,
                                nama: resp.nama,
                                subdomain: null,
                                slug: resp.slug,
                              });
                              navigate({
                                to: "/$sekolah/koperasi",
                                params: { sekolah: resp.slug },
                              });
                            },
                          },
                        );
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        {selectKoperasi.isError ? (
          <div className="mt-6 rounded-xl border border-red-300/40 bg-red-500/15 backdrop-blur p-4 text-sm">
            <div className="font-semibold text-red-100 mb-1">
              Gagal memilih koperasi
            </div>
            <div className="text-red-100/80 break-words">
              {(selectKoperasi.error as Error)?.message ?? "Unknown error"}
            </div>
          </div>
        ) : null}

        <Footer footer={data?.footer ?? null} />
      </div>
    </div>
  );
}

function safeHttpUrl(u: string): string | null {
  try {
    const parsed = new URL(u, window.location.origin);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function OnboardingButton({ cta }: { cta: OnboardingCta }) {
  const safe = safeHttpUrl(cta.url);
  if (!safe) return null;
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-500/90 hover:bg-emerald-400 text-white text-xs font-semibold whitespace-nowrap shadow-sm ring-1 ring-emerald-300/40 transition focus:outline-none focus:ring-2 focus:ring-white/60"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
      </svg>
      {cta.label}
    </a>
  );
}

const KOPERASI_ROLE_TONE: Record<string, string> = {
  "Admin Koperasi": "bg-blue-500/20 text-blue-100 ring-1 ring-blue-300/40",
  Teller: "bg-violet-500/20 text-violet-100 ring-1 ring-violet-300/40",
  Pengawas: "bg-amber-500/20 text-amber-100 ring-1 ring-amber-300/40",
  Anggota: "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-300/40",
};

/**
 * Card for a koperasi the user can access. A koperasi is identified by its
 * owning sekolah; selecting it sets the active sekolah and routes into the
 * existing per-sekolah koperasi dashboard (/$sekolah/koperasi).
 */
function KoperasiCard(props: {
  koperasi: KoperasiCardData;
  busy: boolean;
  onSelect: () => void;
}) {
  const { koperasi } = props;
  const initials = koperasi.nama
    .replace(/ — Koperasi$/, "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <button
      type="button"
      onClick={props.onSelect}
      disabled={props.busy}
      className="group relative w-full text-left rounded-2xl bg-white/[0.07] backdrop-blur ring-1 ring-white/15 p-5 flex flex-col gap-4 transition hover:bg-white/[0.12] hover:ring-white/30 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/60"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60 group-hover:opacity-100 transition"
      />
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400/40 to-white/5 ring-1 ring-white/25 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
          {koperasi.logo ? (
            <img
              src={koperasi.logo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white truncate">
            {koperasi.nama}
          </div>
          <span
            className={
              "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold " +
              (KOPERASI_ROLE_TONE[koperasi.role_koperasi] ??
                "bg-white/10 text-white/80 ring-1 ring-white/20")
            }
          >
            {koperasi.role_koperasi}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/55 pt-1 border-t border-white/10">
        <span className="truncate">{koperasi.organisasi_nama}</span>
        <span
          aria-hidden
          className="opacity-0 group-hover:opacity-100 transition text-white/80"
        >
          Masuk →
        </span>
      </div>
      {props.busy ? (
        <div className="absolute inset-0 rounded-2xl bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center">
          <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        </div>
      ) : null}
    </button>
  );
}

const DEFAULT_FOOTER_SUFFIX = "SekolahPro · built by Thunderlab";

/**
 * Footer for /pilih-sekolah. Renders server-managed content from SekolahPro
 * Settings (text already has {year} substituted server-side). Falls back to the
 * built-in default text when the backend returns no footer. An optional link is
 * rendered only when both url + label are present and the url is safe http(s).
 */
function Footer({ footer }: { footer: FooterContent | null }) {
  const text = footer?.text ?? `© ${new Date().getFullYear()} ${DEFAULT_FOOTER_SUFFIX}`;
  const safe = footer?.url ? safeHttpUrl(footer.url) : null;
  return (
    <footer className="mt-16 text-[11px] text-white/40 text-center">
      {text}
      {safe && footer?.url_label ? (
        <>
          {" · "}
          <a
            href={safe}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/70 transition"
          >
            {footer.url_label}
          </a>
        </>
      ) : null}
    </footer>
  );
}

function OrgChip(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-pressed={props.active}
      onClick={props.onClick}
      className={
        "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition " +
        (props.active
          ? "bg-white text-slate-900 shadow-sm"
          : "bg-white/10 text-white/85 ring-1 ring-white/20 hover:bg-white/20")
      }
    >
      {props.label}
    </button>
  );
}

function SchoolCard(props: {
  school: SekolahCard;
  busy: boolean;
  onSelect: () => void;
}) {
  const { school } = props;
  const initials = school.nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <button
      type="button"
      onClick={props.onSelect}
      disabled={props.busy}
      className="group relative w-full text-left rounded-2xl bg-white/[0.07] backdrop-blur ring-1 ring-white/15 p-5 flex flex-col gap-4 transition hover:bg-white/[0.12] hover:ring-white/30 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/60"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60 group-hover:opacity-100 transition"
      />

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/30 to-white/5 ring-1 ring-white/25 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
          {school.logo ? (
            <img
              src={school.logo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white truncate">
            {school.nama}
          </div>
          <span
            className={
              "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold " +
              (ROLE_TONE[school.role_sekolah] ??
                "bg-white/10 text-white/80 ring-1 ring-white/20")
            }
          >
            {school.role_sekolah}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70">
          {[school.jenis, school.tingkat].filter(Boolean).join(" · ") || "—"}
        </span>
        <span
          className={
            "px-2 py-0.5 rounded-full text-[10px] font-semibold " +
            (STATUS_TONE[school.status] ??
              "bg-white/10 text-white/80 ring-1 ring-white/20")
          }
        >
          {school.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-white/55 pt-1 border-t border-white/10">
        <span className="truncate">{school.organisasi_nama}</span>
        <span
          aria-hidden
          className="opacity-0 group-hover:opacity-100 transition text-white/80"
        >
          Masuk →
        </span>
      </div>

      {props.busy ? (
        <div className="absolute inset-0 rounded-2xl bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center">
          <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        </div>
      ) : null}
    </button>
  );
}

export const Route = createFileRoute("/pilih-sekolah")({
  component: PilihSekolahPage,
});
