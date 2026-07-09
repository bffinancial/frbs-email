"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import ConversationView from "@/components/mail/ConversationView";
import MailToolbar from "@/components/mail/MailToolbar";
import ReplyEditor from "@/components/mail/ReplyEditor";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  Inbox,
  MailOpen,
  RefreshCcw,
  Search,
  Loader2,
  Circle,
} from "lucide-react";

type Email = {
  id: string;
  thread_id: string;
  from_email: string;
  to_email?: string;
  subject: string;
  body: string;
  created_at: string;
  status?: string;
  direction?: string;
  opened?: boolean;
  starred?: boolean;
};

type Thread = {
  id: string;
  subject: string;
  created_at: string;
  updated_at: string;
};

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [threadEmails, setThreadEmails] = useState<Email[]>([]);
  const [status, setStatus] = useState("Loading inbox...");
  const [threadStatus, setThreadStatus] = useState("");
  const [search, setSearch] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);

  async function getSessionToken() {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    return session?.access_token || null;
  }

  async function loadInbox() {
    setStatus("Loading inbox...");

    const token = await getSessionToken();

    if (!token) {
      setStatus("You must be logged in.");
      return;
    }

    const res = await fetch("/api/emails/inbox", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Unable to load inbox.");
      return;
    }

    const inboxEmails = data.emails || [];

    setEmails(inboxEmails);
    setStatus("");

    if (inboxEmails.length > 0 && !selectedEmail) {
      await openThread(inboxEmails[0]);
    }

    if (inboxEmails.length === 0) {
      setSelectedEmail(null);
      setSelectedThread(null);
      setThreadEmails([]);
    }
  }

  async function openThread(email: Email) {
    setSelectedEmail(email);
    setReplyOpen(false);
    setThreadStatus("Loading conversation...");

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

  async function sendReply(message: string) {
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
      await loadInbox();
    }
  }

  const filteredEmails = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return emails;

    return emails.filter((email) => {
      return (
        email.from_email?.toLowerCase().includes(value) ||
        email.to_email?.toLowerCase().includes(value) ||
        email.subject?.toLowerCase().includes(value) ||
        email.body?.toLowerCase().includes(value)
      );
    });
  }, [emails, search]);

  useEffect(() => {
    loadInbox();
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f3ef] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-[1500px] px-4 py-5">
        <section className="grid min-h-[calc(100vh-130px)] overflow-hidden rounded-3xl border border-[#4b0008]/10 bg-white shadow-xl lg:grid-cols-[390px_1fr]">
          <aside className="flex min-h-0 flex-col border-b border-[#4b0008]/10 bg-[#fbfaf8] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#4b0008]/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7a1118]">
                    FORWARD Mail
                  </p>
                  <h1 className="mt-1 text-2xl font-black">Inbox</h1>
                </div>

                <button
                  onClick={loadInbox}
                  className="rounded-xl border border-[#4b0008]/15 bg-white p-3 transition hover:bg-[#f5eee7]"
                  title="Refresh"
                >
                  <RefreshCcw className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#4b0008]/10 bg-white px-4 py-3">
                <Search className="h-4 w-4 text-[#6f2b31]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search mail"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#6f2b31]/60"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {status && (
                <div className="flex h-52 flex-col items-center justify-center p-8 text-center text-[#6f2b31]">
                  <Loader2 className="mb-4 h-7 w-7 animate-spin" />
                  {status}
                </div>
              )}

              {!status && filteredEmails.length === 0 && (
                <div className="flex h-52 flex-col items-center justify-center p-8 text-center text-[#6f2b31]">
                  <Inbox className="mb-4 h-8 w-8" />
                  {search ? "No messages match your search." : "No conversations yet."}
                </div>
              )}

              {!status &&
                filteredEmails.map((email) => {
                  const active = selectedEmail?.id === email.id;
                  const unread = email.opened === false;

                  return (
                    <button
                      key={email.id}
                      onClick={() => openThread(email)}
                      className={`group w-full border-b border-[#4b0008]/10 px-4 py-4 text-left transition ${
                        active
                          ? "bg-white"
                          : "bg-[#fbfaf8] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4b0008] text-sm font-black text-white">
                          {(email.from_email || "?").charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p
                              className={`truncate text-sm ${
                                unread ? "font-black" : "font-bold"
                              }`}
                            >
                              {email.from_email}
                            </p>

                            <p className="shrink-0 text-[11px] font-semibold text-[#6f2b31]">
                              {new Date(email.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="mt-1 flex items-center gap-2">
                            {unread && (
                              <Circle className="h-2.5 w-2.5 fill-[#7a1118] text-[#7a1118]" />
                            )}

                            <p
                              className={`truncate text-sm ${
                                unread ? "font-black" : "font-semibold"
                              }`}
                            >
                              {email.subject || "(No subject)"}
                            </p>
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6f2b31]">
                            {(email.body || "").replace(/\s+/g, " ").substring(0, 150)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </aside>

          <article className="min-h-0 overflow-y-auto bg-white p-5 md:p-7">
            <MailToolbar
              onRefresh={loadInbox}
              onReply={() => setReplyOpen(true)}
              onReplyAll={() => alert("Reply All coming next.")}
              onForward={() => alert("Forward coming next.")}
              onArchive={() => alert("Archive coming next.")}
              onDelete={() => alert("Delete coming next.")}
              onStar={() => alert("Star coming next.")}
            />

            {threadStatus ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center text-[#6f2b31]">
                <MailOpen className="mb-4 h-10 w-10" />
                <h2 className="text-2xl font-black text-[#4b0008]">
                  Conversation
                </h2>
                <p className="mt-2">{threadStatus}</p>
              </div>
            ) : !selectedThread ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center text-[#6f2b31]">
                <MailOpen className="mb-4 h-10 w-10" />
                <h2 className="text-2xl font-black text-[#4b0008]">
                  Select a conversation
                </h2>
                <p className="mt-2">Choose an email from the inbox.</p>
              </div>
            ) : (
              <div>
                <ConversationView
                  thread={selectedThread}
                  emails={threadEmails}
                />

                {replyOpen && (
                  <ReplyEditor
                    onCancel={() => setReplyOpen(false)}
                    onSend={sendReply}
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