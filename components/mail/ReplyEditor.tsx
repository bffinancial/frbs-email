"use client";

import { useState } from "react";
import {
  Loader2,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import EmailEditor from "@/components/mail/EmailEditor";

type ReplyEditorProps = {
  onSend: (message: string) => Promise<void>;
  onCancel: () => void;
};

export default function ReplyEditor({
  onSend,
  onCancel,
}: ReplyEditorProps) {
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim() || sending) return;

    setSending(true);

    try {
      await onSend(text);

      setHtml("");
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-[#4b0008]/10 bg-white shadow-md">
      <div className="flex items-center justify-between border-b border-[#4b0008]/10 bg-[#fbfaf8] px-6 py-4">
        <div>
          <h3 className="text-xl font-black text-[#4b0008]">
            Reply
          </h3>

          <p className="mt-1 text-sm text-[#6f2b31]">
            Compose your response using the rich editor.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("File attachments coming next.")}
          className="flex items-center gap-2 rounded-xl border border-[#4b0008]/10 bg-white px-4 py-2 font-semibold transition hover:bg-[#f5eee7]"
        >
          <Paperclip className="h-4 w-4" />
          Attach
        </button>
      </div>

      <div className="p-6">
        <EmailEditor
          value={html}
          placeholder="Type your reply..."
          minHeight="260px"
          onAttachClick={() =>
            alert("Attachments will be enabled in the next update.")
          }
          onChange={(newHtml, newText) => {
            setHtml(newHtml);
            setText(newText);
          }}
        />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#4b0008]/15 px-5 py-3 font-bold transition hover:bg-[#f5eee7]"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#7a1118] px-6 py-3 font-bold text-white transition hover:bg-[#5f0d13] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Reply
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}