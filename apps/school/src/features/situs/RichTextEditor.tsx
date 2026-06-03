import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// WYSIWYG editor for situs "richtext" fields (Berita/Halaman isi). Replaces the
// raw HTML <textarea> so non-technical authors format content visually. Output is
// HTML stored as-is; the public renderer (apps/situs RichText) sanitizes with
// DOMPurify before display, so no sanitization is needed here.

interface RichTextEditorProps {
  /** Wires the toolbar group / editor region to the FormField label. */
  id?: string;
  /** Initial HTML (seeds the editor on mount; the editor is uncontrolled after). */
  value: string;
  /** Emits the editor's current HTML on every change. */
  onChange: (html: string) => void;
}

/** One toolbar toggle button; `active` reflects the current selection's mark/node. */
function ToolButton({ label, active, onClick, children }: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm font-semibold transition ${active ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}

/** Toolbar — split out so the editor body stays readable. */
function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-1">
      <ToolButton label="Tebal" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </ToolButton>
      <ToolButton label="Miring" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i>I</i>
      </ToolButton>
      <ToolButton label="Judul" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolButton>
      <ToolButton label="Daftar Butir" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </ToolButton>
      <ToolButton label="Daftar Nomor" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </ToolButton>
    </div>
  );
}

/** Rich-text editor (tiptap) for situs HTML content fields. */
export function RichTextEditor({ id, value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    // Required so the editor only renders client-side (avoids the SSR/jsdom
    // "set immediatelyRender explicitly" hydration error).
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        class: "prose prose-sm max-w-none min-h-[8rem] p-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  if (!editor) return null;
  return (
    <div className="rounded-md border border-slate-200">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
