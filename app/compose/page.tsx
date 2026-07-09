"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Send, MailPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

type Agent = {
  id: string;
  full_name: string;
  company_email: string;
  role: string;
};

export default function ComposePage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
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

    if (!agent || !toEmail.trim() || !subject.trim() || !body.trim()) {
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
        subject: subject.trim(),
        body: body.trim(),
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
    setSubject("");
    setBody("");
    setSending(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f3ef] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-[1100px] px-4 py-6">
        <section className="overflow-hidden rounded-3xl border border-[#4b0008]/10 bg-white shadow-xl">
          <div className="border-b border-[#4b0008]/10 bg-[#fbfaf8] px-6 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
                  FORWARD Mail
                </p>

                <h1 className="mt-2 flex items-center gap-3 text-3xl font-black">
                  <MailPlus className="h-7 w-7" />
                  Compose
                </h1>

                <p className="mt-2 text-sm text-[#6f2b31]">
                  Create a new message from your assigned FORWARD Mail identity.
                </p>
              </div>

              <button
                onClick={sendEmail}
                disabled={sending || loadingAgent || !agent}
                className="flex w-fit items-center gap-2 rounded-2xl bg-[#4b0008] px-6 py-3 font-black text-white shadow-md transition hover:bg-[#6b1018] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-[#4b0008]/10 bg-[#fbfaf8] p-6 lg:border-b-0 lg:border-r">
              <div className="rounded-2xl border border-[#4b0008]/10 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a1118]">
                  Sender
                </p>

                {loadingAgent ? (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#6f2b31]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading identity...
                  </div>
                ) : agent ? (
                  <div className="mt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4b0008] text-lg font-black text-white">
                      {(agent.full_name || agent.company_email || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <p className="mt-4 font-black">{agent.full_name}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-[#6f2b31]">
                      {agent.company_email}
                    </p>
                    <p className="mt-2 text-xs text-[#6f2b31]">
                      Role: {agent.role}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-[#6f2b31]">
                    No sender identity found.
                  </p>
                )}
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

                <div className="rounded-2xl border border-[#4b0008]/10 bg-white px-4 py-3 transition-within focus-within:border-[#7a1118]">
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
                    Subject
                  </label>

                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-[#6f2b31]/50"
                  />
                </div>

                <div className="rounded-2xl border border-[#4b0008]/10 bg-white focus-within:border-[#7a1118]">
                  <div className="border-b border-[#4b0008]/10 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a1118]">
                      Message
                    </p>
                  </div>

                  <textarea
                    rows={16}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your email..."
                    className="min-h-[420px] w-full resize-y bg-transparent px-4 py-4 text-base leading-7 outline-none placeholder:text-[#6f2b31]/50"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-[#4b0008]/10 pt-5 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-[#6f2b31]">
                    Sent messages will be saved automatically in Sent.
                  </p>

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
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}