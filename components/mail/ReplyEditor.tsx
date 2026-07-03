"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";

type ReplyEditorProps = {
  onSend: (message: string) => Promise<void>;
  onCancel: () => void;
};

export default function ReplyEditor({
  onSend,
  onCancel,
}: ReplyEditorProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!message.trim() || sending) return;

    setSending(true);

    try {
      await onSend(message);
      setMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-[#4b0008]/10 bg-white shadow-sm">
      <div className="border-b border-[#4b0008]/10 px-6 py-4">
        <h3 className="text-xl font-black text-[#4b0008]">
          Reply
        </h3>
      </div>

      <div className="p-6">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your reply..."
          rows={8}
          className="w-full rounded-xl border border-[#4b0008]/15 p-4 outline-none transition focus:border-[#7a1118]"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 rounded-xl border border-[#4b0008]/15 px-5 py-3 font-bold hover:bg-[#f5eee7]"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="flex items-center gap-2 rounded-xl bg-[#7a1118] px-5 py-3 font-bold text-white transition hover:bg-[#5f0d13] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}