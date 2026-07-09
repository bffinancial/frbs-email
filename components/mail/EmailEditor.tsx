"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Link as LinkIcon,
  Undo,
  Redo,
  RemoveFormatting,
  Paperclip,
} from "lucide-react";

type EmailEditorProps = {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  minHeight?: string;
};

export default function EmailEditor({
  value,
  onChange,
  placeholder = "Write your message...",
  minHeight = "300px",
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
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none px-4 py-4 text-[#2c0004]",
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML(), editor.getText());
    },
  });

  if (!editor) return null;

function setLink() {
  if (!editor) return;

  const previousUrl =
    (editor.getAttributes("link")?.href as string | undefined) || "";

  const url = window.prompt("Enter link URL", previousUrl || "https://");

  if (url === null) return;

  if (url === "") {
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .unsetLink()
      .run();
    return;
  }

  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url })
    .run();
}

  const buttonClass =
    "rounded-lg p-2 transition hover:bg-[#f5eee7] disabled:opacity-40";

  const activeClass = "bg-[#4b0008] text-white hover:bg-[#4b0008]";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#4b0008]/10 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#4b0008]/10 bg-[#fbfaf8] px-3 py-2">
        <select
          onChange={(e) => editor.chain().focus().setParagraph().run()}
          className="rounded-lg border border-[#4b0008]/10 bg-white px-2 py-2 text-sm font-semibold outline-none"
          defaultValue="sans"
        >
          <option value="sans">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
        </select>

        <select
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level === 0) editor.chain().focus().setParagraph().run();
            if (level === 1) editor.chain().focus().toggleHeading({ level: 1 }).run();
            if (level === 2) editor.chain().focus().toggleHeading({ level: 2 }).run();
            if (level === 3) editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          className="rounded-lg border border-[#4b0008]/10 bg-white px-2 py-2 text-sm font-semibold outline-none"
          defaultValue="0"
        >
          <option value="0">Normal</option>
          <option value="1">Large</option>
          <option value="2">Medium</option>
          <option value="3">Small</option>
        </select>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${buttonClass} ${editor.isActive("bold") ? activeClass : ""}`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonClass} ${editor.isActive("italic") ? activeClass : ""}`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${buttonClass} ${editor.isActive("underline") ? activeClass : ""}`}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>

        <input
          type="color"
          title="Text color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="h-9 w-10 cursor-pointer rounded-lg border border-[#4b0008]/10 bg-white p-1"
        />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${buttonClass} ${editor.isActive("bulletList") ? activeClass : ""}`}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${buttonClass} ${editor.isActive("orderedList") ? activeClass : ""}`}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`${buttonClass} ${editor.isActive({ textAlign: "left" }) ? activeClass : ""}`}
          title="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`${buttonClass} ${editor.isActive({ textAlign: "center" }) ? activeClass : ""}`}
          title="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`${buttonClass} ${editor.isActive({ textAlign: "right" }) ? activeClass : ""}`}
          title="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${buttonClass} ${editor.isActive("blockquote") ? activeClass : ""}`}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <button type="button" onClick={setLink} className={buttonClass} title="Insert link">
          <LinkIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => alert("Attachments coming next.")}
          className={buttonClass}
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={buttonClass}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={buttonClass}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className={buttonClass}
          title="Remove formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </button>
      </div>

      <EditorContent editor={editor} />

      {!editor.getText().trim() && (
        <div className="pointer-events-none -mt-[300px] px-4 py-4 text-[#6f2b31]/50">
          {placeholder}
        </div>
      )}
    </div>
  );
}