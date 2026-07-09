"use client";

import { useCallback } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Paperclip,
  Quote,
  Redo,
  RemoveFormatting,
  Type,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";

type EmailEditorProps = {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  minHeight?: string;
  onAttachClick?: () => void;
};

export default function EmailEditor({
  value,
  onChange,
  placeholder = "Write your message...",
  minHeight = "320px",
  onAttachClick,
}: EmailEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] w-full px-4 py-4 text-base leading-7 text-[#2c0004] outline-none",
        style: `min-height:${minHeight};`,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML(), editor.getText());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl =
      (editor.getAttributes("link")?.href as string | undefined) || "";

    const url = window.prompt("Enter link URL", previousUrl || "https://");

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded-2xl border border-[#4b0008]/10 bg-white p-4 text-sm font-semibold text-[#6f2b31]">
        Loading editor...
      </div>
    );
  }

  const buttonBase =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-[#f5eee7] disabled:cursor-not-allowed disabled:opacity-40";

  const activeButton = "bg-[#4b0008] text-white hover:bg-[#4b0008]";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#4b0008]/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#4b0008]/10 bg-[#fbfaf8] px-3 py-2">
        <select
          defaultValue="paragraph"
          onChange={(e) => {
            const value = e.target.value;

            if (value === "paragraph") {
              editor.chain().focus().setParagraph().run();
            }

            if (value === "h1") {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }

            if (value === "h2") {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }

            if (value === "h3") {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }
          }}
          className="h-9 rounded-lg border border-[#4b0008]/10 bg-white px-2 text-sm font-bold outline-none"
          title="Font size"
        >
          <option value="paragraph">Normal</option>
          <option value="h1">Large</option>
          <option value="h2">Medium</option>
          <option value="h3">Small</option>
        </select>

        <button
          type="button"
          title="Text style"
          className={buttonBase}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Type className="h-4 w-4" />
        </button>

        <span className="mx-1 h-7 w-px bg-[#4b0008]/15" />

        <button
          type="button"
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonBase} ${editor.isActive("bold") ? activeButton : ""}`}
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonBase} ${editor.isActive("italic") ? activeButton : ""}`}
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${buttonBase} ${
            editor.isActive("underline") ? activeButton : ""
          }`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>

        <input
          type="color"
          title="Text color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="h-9 w-10 cursor-pointer rounded-lg border border-[#4b0008]/10 bg-white p-1"
        />

        <span className="mx-1 h-7 w-px bg-[#4b0008]/15" />

        <button
          type="button"
          title="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${buttonBase} ${
            editor.isActive("bulletList") ? activeButton : ""
          }`}
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonBase} ${
            editor.isActive("orderedList") ? activeButton : ""
          }`}
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${buttonBase} ${
            editor.isActive("blockquote") ? activeButton : ""
          }`}
        >
          <Quote className="h-4 w-4" />
        </button>

        <span className="mx-1 h-7 w-px bg-[#4b0008]/15" />

        <button
          type="button"
          title="Align left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`${buttonBase} ${
            editor.isActive({ textAlign: "left" }) ? activeButton : ""
          }`}
        >
          <AlignLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Align center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`${buttonBase} ${
            editor.isActive({ textAlign: "center" }) ? activeButton : ""
          }`}
        >
          <AlignCenter className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Align right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`${buttonBase} ${
            editor.isActive({ textAlign: "right" }) ? activeButton : ""
          }`}
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <span className="mx-1 h-7 w-px bg-[#4b0008]/15" />

        <button
          type="button"
          title="Insert link"
          onClick={setLink}
          className={`${buttonBase} ${editor.isActive("link") ? activeButton : ""}`}
        >
          <LinkIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Attach file"
          onClick={onAttachClick || (() => alert("File attachments coming next."))}
          className={buttonBase}
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <span className="mx-1 h-7 w-px bg-[#4b0008]/15" />

        <button
          type="button"
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={buttonBase}
        >
          <Undo className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={buttonBase}
        >
          <Redo className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Remove formatting"
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          className={buttonBase}
        >
          <RemoveFormatting className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        {!editor.getText().trim() && (
          <div className="pointer-events-none absolute left-4 top-4 text-base text-[#6f2b31]/50">
            {placeholder}
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}