import { useEffect, useRef } from "react";
import { cn } from "@sekolahpro/ui";
import { useAdsConfig } from "./AdsProvider";
import { useAd } from "./useAd";
import { trackImpression, resolveClick } from "./client";

const VISIBLE_RATIO = 0.5;

interface Props {
  /** Slot key as seeded, e.g. "school-dashboard-top". */
  slot: string;
  className?: string;
}

/** Image banner for a slot. Fetches a creative, fires one impression when ≥50%
 * visible, and routes clicks through the backend (which records + redirects).
 * Renders nothing when there is no ad. */
export function AdBanner({ slot, className }: Props) {
  const cfg = useAdsConfig();
  const { creative } = useAd(slot);
  const ref = useRef<HTMLAnchorElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!creative || !cfg || tracked.current) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (tracked.current) return;
        if (entries.some((e) => e.isIntersecting)) {
          tracked.current = true;
          void trackImpression(cfg.baseUrl, creative.token);
          obs.disconnect();
        }
      },
      { threshold: VISIBLE_RATIO },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [creative, cfg]);

  if (!cfg || !creative || !creative.image_url) return null;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const dest = await resolveClick(cfg!.baseUrl, creative!.click_url);
    if (dest) window.open(dest, "_blank", "noopener,noreferrer");
  }

  return (
    <a
      ref={ref}
      href={creative.click_url}
      onClick={handleClick}
      className={cn("inline-block max-w-full", className)}
      data-ad-slot={slot}
    >
      <img
        src={creative.image_url}
        alt={creative.title ?? "Iklan"}
        width={creative.width ?? undefined}
        height={creative.height ?? undefined}
        className="block max-w-full h-auto"
      />
    </a>
  );
}
