// Render an admin-provided map embed SAFELY: extract the iframe src and only
// render a controlled <iframe> when the host is on a small allowlist. This
// avoids dangerouslySetInnerHTML entirely for the one place that needs iframes.

const ALLOWED_HOSTS = ["www.google.com", "google.com", "maps.google.com", "www.openstreetmap.org"];

function extractSrc(embed: string): string | null {
  // Accept either a full <iframe ... src="..."> or a bare URL.
  const match = embed.match(/src=["']([^"']+)["']/i);
  const url = match && match[1] ? match[1] : embed.trim();
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return ALLOWED_HOSTS.includes(parsed.host) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function MapEmbed({ embed, title }: { embed: string; title: string }) {
  const src = extractSrc(embed);
  if (!src) return null;
  return (
    <iframe
      src={src}
      title={`Peta ${title}`}
      className="aspect-video w-full"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      sandbox="allow-scripts allow-same-origin allow-popups"
    />
  );
}
