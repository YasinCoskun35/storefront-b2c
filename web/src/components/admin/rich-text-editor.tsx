"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    // Avoid SSR hydration mismatch in the Next.js app router.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[180px] w-full px-3 py-2 text-sm focus:outline-none",
          // Basic content styling (no typography plugin required).
          "[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold",
          "[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold",
          "[&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_strong]:font-semibold"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // TipTap emits "<p></p>" for an empty document; treat that as empty.
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Keep the editor in sync when the value is set externally (e.g. edit form load).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[220px] rounded-md border bg-background" aria-hidden />
    );
  }

  return (
    <div className="rounded-md border bg-background focus-within:ring-1 focus-within:ring-ring">
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="Kalın"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="İtalik"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          label="Üstü çizili"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          label="Başlık"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          label="Alt başlık"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label="Madde işaretli liste"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label="Numaralı liste"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          label="Alıntı"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          label="Geri al"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          label="Yinele"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  editor: Editor;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded transition-colors",
        "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-muted text-primary"
      )}
    >
      {children}
    </button>
  );
}
