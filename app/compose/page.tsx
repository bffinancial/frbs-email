"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Send } from "lucide-react";
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
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadLoggedInAgent() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        setStatus("You must be logged in to compose email.");
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
        return;
      }

      setAgent(data.agent);
    }

    loadLoggedInAgent();
  }, []);

  async function sendEmail() {
    if (!agent || !toEmail || !subject || !body) {
      setStatus("Please complete all required fields.");
      return;
    }

    setSending(true);
    setStatus("Sending...");

    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId: agent.id,
        fromEmail: agent.company_email,
        toEmail,
        subject,
        body,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Unable to send email.");
      setSending(false);
      return;
    }

    setStatus("Email sent successfully.");
    setToEmail("");
    setSubject("");
    setBody("");
    setSending(false);
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="border-b border-[#4b0008]/15 pb-8">
          <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
            FORWARD Mail
          </p>

          <h1 className="mt-3 text-5xl font-black">Compose Email</h1>

          <p className="mt-3 text-lg text-[#6f2b31]">
            Send email from your personal FORWARD Mail identity.
          </p>
        </header>

        <section className="mt-8 space-y-5 rounded-2xl border border-[#4b0008]/15 bg-white p-8 shadow-md">
          <div>
            <label className="mb-2 block font-bold">From</label>

            <div className="w-full rounded-xl border border-[#4b0008]/20 bg-[#f5eee7] px-4 py-3 font-semibold">
              {agent
                ? `${agent.full_name} (${agent.company_email})`
                : "Loading your FORWARD Mail identity..."}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-bold">To</label>
            <input
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="client@email.com"
              className="w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold">Message</label>
            <textarea
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email..."
              className="w-full rounded-xl border border-[#4b0008]/20 bg-[#fbfaf8] px-4 py-3 outline-none"
            />
          </div>

          <button
            onClick={sendEmail}
            disabled={sending || !agent}
            className="flex items-center gap-2 rounded-xl bg-[#4b0008] px-6 py-3 font-bold text-white transition hover:bg-[#6b1018] disabled:opacity-60"
          >
            <Send size={18} />
            {sending ? "Sending..." : "Send Email"}
          </button>

          {status && (
            <p className="rounded-xl bg-[#f5eee7] p-3 font-semibold">
              {status}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}