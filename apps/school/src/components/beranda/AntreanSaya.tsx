/**
 * "Antrean Saya" — the hero work-inbox of the role-adaptive Beranda.
 *
 * Pure presentational: renders an urgency-ranked list of actionable rows (built
 * by lib/berandaInbox), each a one-tap deep-link to the form that clears it,
 * plus an inbox-zero progress ring and a per-row dismiss. No hooks, no fetching —
 * fully testable with a plain renderLink.
 */
import type { ReactNode } from "react";
import { Badge, Button, SectionCard } from "@sekolahpro/ui";
import { ProgressRing } from "../viz";
import { berandaInboxProgress, type BerandaWorkItem, type BerandaWorkType } from "../../lib/berandaInbox";

type RenderLink = (href: string, children: ReactNode, className?: string) => ReactNode;

/** Map an inbox severity to a UI badge tone. */
const SEVERITY_TONE = { red: "danger", amber: "warning", emerald: "success" } as const;

/** Dot colour classes per severity (left rail accent). */
const SEVERITY_DOT: Record<BerandaWorkItem["severity"], string> = {
  red: "bg-danger",
  amber: "bg-warning",
  emerald: "bg-emerald-500",
};

export interface AntreanSayaProps {
  items: BerandaWorkItem[];
  /** Ids the user has dismissed this session (removed from the visible list). */
  dismissedIds: readonly string[];
  onDismiss: (id: string) => void;
  renderLink: RenderLink;
}

/** Verb-first heading shown above the inbox, varied by the dominant work kind. */
function headerCopy(items: BerandaWorkItem[]): { title: string; description: string } {
  const decisionTypes: BerandaWorkType[] = ["wali", "sk"];
  const isDecision = items.some((i) => decisionTypes.includes(i.type));
  return isDecision
    ? { title: "Keputusan Anda hari ini", description: "Hal lintas sekolah yang menunggu keputusan Anda." }
    : { title: "Antrean Saya", description: "Tugas hari ini — ketuk untuk membuka formulir penyelesainya." };
}

export function AntreanSaya({ items, dismissedIds, onDismiss, renderLink }: AntreanSayaProps): ReactNode {
  const visible = items.filter((i) => !dismissedIds.includes(i.id));
  const { done, total } = berandaInboxProgress(items, dismissedIds);
  const pct = total > 0 ? Math.round((done / total) * 100) : 100;
  const { title, description } = headerCopy(items);

  return (
    <SectionCard
      title={title}
      description={description}
      action={<Badge tone={total > 0 ? "brand" : "success"} dot>{done} dari {total} beres</Badge>}
    >
      {visible.length === 0 ? (
        <div className="flex items-center gap-3 py-6">
          <ProgressRing value={pct} tone="emerald" label="bersih" />
          <p className="text-sm text-muted-fg">Antrean bersih — tidak ada yang menunggu Anda. 🎉</p>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="hidden sm:block shrink-0 pt-1">
            <ProgressRing value={pct} tone="brand" label={`${done}/${total}`} />
          </div>
          <ul role="list" className="min-w-0 flex-1 divide-y divide-border">
            {visible.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[item.severity]}`} aria-hidden />
                {renderLink(
                  item.to,
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{item.label}</span>
                    {item.meta ? <span className="block text-xs text-muted-fg">{item.meta}</span> : null}
                  </span>,
                  "min-w-0 flex-1 group",
                )}
                <Badge tone={SEVERITY_TONE[item.severity]}>{item.meta ?? "buka"}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(item.id)}
                  aria-label={`Tandai selesai: ${item.label}`}
                >
                  ✕
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
