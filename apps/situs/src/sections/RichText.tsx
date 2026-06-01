import DOMPurify from "dompurify";

/**
 * Render CMS HTML (Text Editor fields) safely. Content is admin-authored and
 * sanitized server-side by Frappe, but we sanitize again client-side as
 * defense-in-depth against stored XSS. The ONLY place situs renders raw HTML.
 */
export function RichText({ html, className = "situs-prose" }: { html: string; className?: string }) {
  const clean = DOMPurify.sanitize(html ?? "", { USE_PROFILES: { html: true } });
  // eslint-disable-next-line react/no-danger -- sanitized above with DOMPurify
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
