"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { MailOpen, RefreshCcw, Send } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";
import MailToolbar from "@/components/mail/MailToolbar";
import ConversationView from "@/components/mail/ConversationView";
import ReplyEditor from "@/components/mail/ReplyEditor";
type Email = {
  id: string;
  thread_id: string;
  from_email?: string;
  to_email: string;
  subject: string;
  body: string;
  created_at: string;
  status?: string;
};

type Thread = {
  id: string;
  subject: string;
  created_at: string;
  updated_at: string;
};

export default function SentPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadEmails, setThreadEmails] = useState<Email[]>([]);
  const [status, setStatus] = useState("Loading sent mail...");
  const [threadStatus, setThreadStatus] = useState("");
const [replyOpen, setReplyOpen] = useState(false);
  async function getSessionToken() {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    return session?.access_token || null;
  }

  async function loadSent() {
    setStatus("Loading sent mail...");

    const token = await getSessionToken();

    if (!token) {
      setStatus("You must be logged in.");
      return;
    }

    const res = await fetch("/api/emails/sent", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Unable to load sent mail.");
      return;
    }

    const sentEmails = data.emails || [];

    setEmails(sentEmails);
    setStatus("");

    if (sentEmails.length > 0) {
      await openThread(sentEmails[0]);
    } else {
      setSelectedEmail(null);
      setSelectedThread(null);
      setThreadEmails([]);
    }
  }

  async function openThread(email: Email) {
    setSelectedEmail(email);
    setThreadStatus("Loading conversation...");
setReplyOpen(false);
    const token = await getSessionToken();

    if (!token) {
      setThreadStatus("You must be logged in.");
      return;
    }

    if (!email.thread_id) {
      setThreadStatus("This email does not have a thread yet.");
      return;
    }

    const res = await fetch(`/api/emails/thread?threadId=${email.thread_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setSelectedThread(null);
      setThreadEmails([]);
      setThreadStatus(data.error || "Unable to load conversation.");
      return;
    }

    setSelectedThread(data.thread || null);
    setThreadEmails(data.emails || []);
    setThreadStatus("");
  }

  useEffect(() => {
    loadSent();
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#4b0008]/15 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
              FORWARD Mail
            </p>
            <h1 className="mt-2 text-4xl font-black">Sent</h1>
            <p className="mt-2 text-[#6f2b31]">
              Sent conversations from your FORWARD Mail account.
            </p>
          </div>

          <button
            onClick={loadSent}
            className="flex w-fit items-center gap-2 rounded-xl border border-[#4b0008]/20 px-5 py-3 font-bold transition hover:bg-[#f5eee7]"
          >
            <RefreshCcw className="h-5 w-5" />
            Refresh
          </button>
        </header>

        <section className="grid min-h-[620px] overflow-hidden rounded-2xl border border-[#4b0008]/15 bg-white shadow-md lg:grid-cols-[380px_1fr]">
          <aside className="border-b border-[#4b0008]/10 lg:border-b-0 lg:border-r">
            <div className="border-b border-[#4b0008]/10 bg-[#f5eee7] px-5 py-4">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5" />
                <p className="font-black">Sent Conversations</p>
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {(status || emails.length === 0) && (
                <div className="p-8 text-center text-[#6f2b31]">
                  <Send className="mx-auto mb-4" />
                  {status || "No sent conversations yet."}
                </div>
              )}

              {emails.map((email) => {
                const active = selectedEmail?.id === email.id;

                return (
                  <button
                    key={email.id}
                    onClick={() => openThread(email)}
                    className={`w-full border-b border-[#4b0008]/10 p-5 text-left transition ${
                      active ? "bg-[#f5eee7]" : "hover:bg-[#fbfaf8]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-black">{email.to_email}</p>
                      <p className="shrink-0 text-xs text-[#6f2b31]">
                        {new Date(email.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <p className="mt-2 font-semibold">
                      {email.subject || "(No subject)"}
                    </p>

                    <p className="mt-2 line-clamp-2 text-sm text-[#6f2b31]">
                      {(email.body || "").substring(0, 120)}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="p-8">
            {threadStatus ? (
              <div className="flex h-full min-h-[520px] flex-col items-center justify-center text-center text-[#6f2b31]">
                <MailOpen className="mb-4 h-10 w-10" />
                <h2 className="text-2xl font-black text-[#4b0008]">
                  Conversation
                </h2>
                <p className="mt-2">{threadStatus}</p>
              </div>
            ) : !selectedThread ? (
              <div className="flex h-full min-h-[520px] flex-col items-center justify-center text-center text-[#6f2b31]">
                <MailOpen className="mb-4 h-10 w-10" />
                <h2 className="text-2xl font-black text-[#4b0008]">
                  Select a conversation
                </h2>
                <p className="mt-2">Choose an email from sent mail.</p>
              </div>
            ) : (
             <div>
  <MailToolbar
  onRefresh={loadSent}
  onReply={() => setReplyOpen(true)}
  onReplyAll={() => alert("Reply All coming next.")}
  onForward={() => alert("Forward coming next.")}
  onArchive={() => alert("Archive coming next.")}
  onDelete={() => alert("Delete coming next.")}
  onStar={() => alert("Star coming next.")}
/>

  <ConversationView thread={selectedThread} emails={threadEmails} />

{replyOpen && (
  <ReplyEditor
    onCancel={() => setReplyOpen(false)}
   onSend={async (message) => {
  const token = await getSessionToken();

  if (!token || !selectedThread) {
    alert("Unable to send reply.");
    return;
  }

  const res = await fetch("/api/emails/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      threadId: selectedThread.id,
      message,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Unable to send reply.");
    return;
  }

  setReplyOpen(false);

  if (selectedEmail) {
    await openThread(selectedEmail);
  }
}}
  />
)}
</div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}