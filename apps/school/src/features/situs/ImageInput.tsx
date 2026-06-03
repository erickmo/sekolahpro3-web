import { Input } from "@sekolahpro/ui";

// Shared control for situs "image" schema fields (KontenManager + ChildArrayManager).
// The backend stores an image URL, so this is a url <Input> plus a live thumbnail:
// the author pastes a link and immediately sees whether it resolves, instead of
// saving a blind URL. (Direct file upload needs the Frappe upload endpoint — a
// separate backend gap, intentionally out of scope here.)

/** Max preview edge in pixels — keeps the thumbnail compact inside the form. */
const PREVIEW_SIZE = 96;

interface ImageInputProps {
  /** Wires the FormField label to the input for a11y. */
  id?: string;
  /** Current image URL ("" when unset). */
  value: string;
  /** Emits the new URL string on every edit. */
  onChange: (url: string) => void;
  /** Alt text / preview label, defaults to a generic caption. */
  alt?: string;
}

/** URL input with a live thumbnail preview for situs image fields. */
export function ImageInput({ id, value, onChange, alt = "Pratinjau gambar" }: ImageInputProps) {
  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="url"
        inputMode="url"
        placeholder="https://…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <img
          src={value}
          alt={alt}
          width={PREVIEW_SIZE}
          height={PREVIEW_SIZE}
          className="h-24 w-24 rounded-md border border-slate-200 object-cover"
        />
      ) : null}
    </div>
  );
}
