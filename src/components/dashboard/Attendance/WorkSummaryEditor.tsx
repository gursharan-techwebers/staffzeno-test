"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react";

type WorkSummaryEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function WorkSummaryEditor({
  value,
  onChange,
  disabled = false,
  placeholder,
}: WorkSummaryEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],

    content: value,

    immediatelyRender: false,

    editable: !disabled,

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const isEmpty = editor.getText().trim().length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b bg-muted/30 p-1.5">
        {/* Text formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          title="Bold"
          aria-label="Bold"
          className={`flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
            editor.isActive("bold")
              ? "bg-background text-foreground shadow-sm"
              : ""
          }`}
        >
          <Bold className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          title="Italic"
          aria-label="Italic"
          className={`flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
            editor.isActive("italic")
              ? "bg-background text-foreground shadow-sm"
              : ""
          }`}
        >
          <Italic className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          title="Strikethrough"
          aria-label="Strikethrough"
          className={`flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
            editor.isActive("strike")
              ? "bg-background text-foreground shadow-sm"
              : ""
          }`}
        >
          <Strikethrough className="size-4" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          title="Bullet list"
          aria-label="Bullet list"
          className={`flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
            editor.isActive("bulletList")
              ? "bg-background text-foreground shadow-sm"
              : ""
          }`}
        >
          <List className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          title="Numbered list"
          aria-label="Numbered list"
          className={`flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
            editor.isActive("orderedList")
              ? "bg-background text-foreground shadow-sm"
              : ""
          }`}
        >
          <ListOrdered className="size-4" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* Quote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          title="Quote"
          aria-label="Quote"
          className={`flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
            editor.isActive("blockquote")
              ? "bg-background text-foreground shadow-sm"
              : ""
          }`}
        >
          <Quote className="size-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="
            min-h-36
            [&_.ProseMirror]:min-h-36
            [&_.ProseMirror]:p-3
            [&_.ProseMirror]:outline-none
            [&_.ProseMirror]:text-sm
            [&_.ProseMirror_p]:my-1.5
            [&_.ProseMirror_ul]:my-2
            [&_.ProseMirror_ol]:my-2
            [&_.ProseMirror_li]:ml-5
            [&_.ProseMirror_ul]:list-disc
            [&_.ProseMirror_ol]:list-decimal
            [&_.ProseMirror_blockquote]:my-2
            [&_.ProseMirror_blockquote]:border-l-2
            [&_.ProseMirror_blockquote]:pl-3
            [&_.ProseMirror_blockquote]:text-muted-foreground
            [&_.ProseMirror_a]:text-primary
            [&_.ProseMirror_a]:underline
          "
        />

        {placeholder && isEmpty && (
          <div className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
