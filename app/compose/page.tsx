"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import EmailEditor from "@/components/mail/EmailEditor";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MailPlus,
  Paperclip,
  Save,
  Send,
  Trash2,
  UserCircle,
} from "lucide-react";

type Agent = {
  id: string;
  full_name: string;
  company_email: string;
  role: string;
};

export default function ComposePage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [bccEmail, setBccEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadLoggedInAgent() {
      setLoadingAgent(true);

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        setStatus("You must be logged in to compose email.");
        setLoadingAgent(false);
        return;
      }

      const res = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Unable to load your agent profile.");
        setLoadingAgent(false);
        return;
      }

      setAgent(data.agent);
      setLoadingAgent(false);
    }

    loadLoggedInAgent();
  }, []);

  async function sendEmail() {
    setSuccess(false);

    if (!agent || !toEmail.trim() || !subject.trim() || !bodyText.trim()) {
      setStatus("Please complete To, Subject, and Message before sending.");
      return;
    }

    setSending(true);
    setStatus("Sending email...");

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId: agent.id,
        fromEmail: agent.company_email,
        toEmail: toEmail.trim(),
        ccEmail: ccEmail.trim(),
        bccEmail: bccEmail.trim(),
        subject: subject.trim(),
        body: bodyText.trim(),
        html: bodyHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Unable to send email.");
      setSending(false);
      return;
    }

    setSuccess(true);
    setStatus("Email sent successfully and saved to Sent.");
    setToEmail("");
    setCcEmail("");
    setBccEmail("");
    setSubject("");
    setBodyHtml("");
    setBodyText("");
    setSending(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f3ef] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <section className="overflow-hidden rounded-3xl border border-[#4b0008]/10 bg-white shadow-xl">
          <div className="border-b border-[#4b0008]/10 bg-[#fbfaf8] px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
                  FORWARD Mail
                </p>

                <h1 className="mt-2 flex items-center gap-3 text-3xl font-black">
                  <MailPlus className="h-7 w-7" />
                  Compose
                </h1>

                <p className="mt-2 text-sm text-[#6f2b31]">
                  Create rich, professional emails with formatting and future attachment support.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("Draft saving is coming next.")}
                  className="flex items-center gap-2 rounded-2xl border border-[#4b0008]/15 bg-white px-5 py-3 font-black transition hover:bg-[#f5eee7]"
                >
                  <Save className="h-5 w-5" />
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={sending || loadingAgent || !agent}
                  className="flex items-center gap-2 rounded-2xl bg-[#4b0008] px-6 py-3 font-black text-white shadow-md transition hover:bg-[#6b1018] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  {sending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[320px_1fr]">
            <aside className="border-b border-[#4b0008]/10 bg-[#fbfaf8] p-6 xl:border-b-0 xl:border-r">
              <div className="rounded-2xl border border-[#4b0008]/10 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-8 w-8" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a1118]">
                    Sender Identity
                  </p>
                </div>

                {loadingAgent ? (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#6f2b31]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading identity...
                  </div>
                ) : agent ? (
                  <div className="mt-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4b0008] text-xl font-black text-white">
                      {(agent.full_name || agent.company_email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <p className="mt-4 text-lg font-black">{agent.full_name}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#6f2b31]">
                      {agent.company_email}
                    </p>
                    <p className="mt-2 text-xs font-bold text-[#6f2b31]">
                      Role: {agent.role}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-[#6f2b31]">
                    No sender identity found.
                  </p>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-[#4b0008]/10 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a1118]">
                    Draft Status
                  </p>
                </div>

                <p className="mt-4 text-sm font-bold text-[#6f2b31]">
                  Auto-save drafts are coming next.
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-[#4b0008]/10 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Paperclip className="h-6 w-6" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a1118]">
                    Attachments
                  </p>
                </div>

                <p className="mt-4 text-sm font-bold text-[#6f2b31]">
                  No files attached yet.
                </p>

                <button
                  type="button"
                  onClick={() => setStatus("File attachments are coming next.")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#4b0008]/15 bg-[#fbfaf8] px-4 py-3 font-black transition hover:bg-[#f5eee7]"
                >
                  <Paperclip className="h-4 w-4" />
                  Attach File
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-[#4b0008]/10 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a1118]">
                    Signature
                  </p>
                </div>

                <p className="mt-4 whitespace-pre-line text-sm font-semibold text-[#6f2b31]">
                  Regards,{"\n"}
                  {agent?.full_name || "FORWARD Mail Agent"}
                </p>
              </div>

              {status && (
                <div
                  className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${
                    success
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-[#4b0008]/10 bg-white text-[#6f2b31]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {success ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <span>{status}</span>
                  </div>
                </div>
              )}
            </aside>

            <section className="p-6">
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#4b0008]/10 bg-[#fbfaf8] px-4 py-3">
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-[#7a1118]">
                    From
                  </label>

                  <div className="font-semibold text-[#4b0008]">
                    {agent
                      ? `${agent.full_name} <${agent.company_email}>`
                      : "Loading your FORWARD Mail identity..."}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-[#4b0008]/10 bg-white px-4 py-3 focus-within:border-[#7a1118]">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-[#7a1118]">
                      To
                    </label>

                    <input
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      placeholder="client@email.com"
                      className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-[#6f2b31]/50"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#4b0008]/10 bg-white px-4 py-3 focus-within:border-[#7a1118]">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-[#7a1118]">
                      CC
                    </label>

                    <input
                      value={ccEmail}
                      onChange={(e) => setCcEmail(e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-[#6f2b31]/50"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#4b0008]/10 bg-white px-4 py-3 focus-within:border-[#7a1118]">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-[#7a1118]">
                      BCC
                    </label>

                    <input
                      value={bccEmail}
                      onChange={(e) => setBccEmail(e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-[#6f2b31]/50"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#4b0008]/10 bg-white px-4 py-3 focus-within:border-[#7a1118]">
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.18em] text-[#7a1118]">
                    Subject
                  </label>

                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-[#6f2b31]/50"
                  />
                </div>

                <EmailEditor
                  value={bodyHtml}
                  placeholder="Write your email..."
                  minHeight="420px"
                  onAttachClick={() => setStatus("File attachments are coming next.")}
                  onChange={(html, text) => {
                    setBodyHtml(html);
                    setBodyText(text);
                  }}
                />

                <div className="flex flex-col-reverse gap-3 border-t border-[#4b0008]/10 pt-5 md:flex-row md:items-center md:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setToEmail("");
                      setCcEmail("");
                      setBccEmail("");
                      setSubject("");
                      setBodyHtml("");
                      setBodyText("");
                      setStatus("Compose cleared.");
                      setSuccess(false);
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-3 font-black text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                    Clear
                  </button>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setStatus("Draft saving is coming next.")}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-[#4b0008]/15 bg-[#fbfaf8] px-6 py-3 font-black transition hover:bg-[#f5eee7]"
                    >
                      <Save className="h-5 w-5" />
                      Save Draft
                    </button>

                    <button
                      onClick={sendEmail}
                      disabled={sending || loadingAgent || !agent}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#4b0008] px-7 py-3 font-black text-white shadow-md transition hover:bg-[#6b1018] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      {sending ? "Sending..." : "Send Email"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}