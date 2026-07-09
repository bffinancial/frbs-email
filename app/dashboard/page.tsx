"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { supabaseClient } from "@/lib/supabaseClient";
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  PenLine,
  RefreshCcw,
  Send,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

type Agent = {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_email?: string;
  forwarding_email?: string;
};

type Email = {
  id: string;
  thread_id?: string;
  from_email?: string;
  to_email?: string;
  subject?: string;
  body?: string;
  created_at: string;
  direction?: string;
  opened?: boolean;
};

type DashboardSummary = {
  stats: {
    inbox: number;
    unread: number;
    sent: number;
    agents: number;
  };
  latestInbox: Email[];
  latestSent: Email[];
  agent: Agent;
};

function formatName(agent?: Agent | null) {
  if (!agent) return "FRBS Agent";

  return (
    agent.full_name?.trim() ||
    [agent.first_name, agent.last_name].filter(Boolean).join(" ").trim() ||
    "FRBS Agent"
  );
}

function formatDate(value?: string) {
  if (!value) return "";

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EmailList({
  title,
  emptyText,
  emails,
  type,
}: {
  title: string;
  emptyText: string;
  emails: Email[];
  type: "inbox" | "sent";
}) {
  return (
    <section className="rounded-3xl border border-[#4b0008]/10 bg-white shadow-lg">
      <div className="border-b border-[#4b0008]/10 px-5 py-4">
        <h2 className="text-xl font-black">{title}</h2>
      </div>

      <div className="divide-y divide-[#4b0008]/10">
        {emails.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-[#6f2b31]">
            {emptyText}
          </div>
        ) : (
          emails.map((email) => (
            <Link
              key={email.id}
              href={type === "inbox" ? "/inbox" : "/sent"}
              className="block px-5 py-4 transition hover:bg-[#fbfaf8]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4b0008] text-sm font-black text-white">
                  {(type === "inbox"
                    ? email.from_email || "?"
                    : email.to_email || "?"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-black">
                      {type === "inbox"
                        ? email.from_email || "Unknown sender"
                        : `To: ${email.to_email || "Unknown recipient"}`}
                    </p>

                    <p className="shrink-0 text-[11px] font-semibold text-[#6f2b31]">
                      {formatDate(email.created_at)}
                    </p>
                  </div>

                  <p className="mt-1 truncate text-sm font-bold">
                    {email.subject || "(No subject)"}
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6f2b31]">
                    {(email.body || "").replace(/\s+/g, " ").substring(0, 130)}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [status, setStatus] = useState("Loading dashboard...");
  const [error, setError] = useState("");

  const agentName = useMemo(() => formatName(summary?.agent), [summary]);

  async function loadDashboard() {
    setStatus("Loading dashboard...");
    setError("");

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      setError("You must be logged in.");
      setStatus("");
      return;
    }

    const res = await fetch("/api/dashboard/summary", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Unable to load dashboard.");
      setStatus("");
      return;
    }

    setSummary(data);
    setStatus("");
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    {
      label: "Inbox",
      value: summary?.stats.inbox ?? 0,
      detail: "Received messages",
      icon: Inbox,
      href: "/inbox",
    },
    {
      label: "Unread",
      value: summary?.stats.unread ?? 0,
      detail: "Needs attention",
      icon: MailOpen,
      href: "/inbox",
    },
    {
      label: "Sent",
      value: summary?.stats.sent ?? 0,
      detail: "Outbound messages",
      icon: Send,
      href: "/sent",
    },
    {
      label: "Agents",
      value: summary?.stats.agents ?? 0,
      detail: "FRBS identities",
      icon: Users,
      href: "/agents",
    },
  ];

  const quickActions = [
    { label: "Compose", href: "/compose", icon: PenLine },
    { label: "Inbox", href: "/inbox", icon: Inbox },
    { label: "Sent", href: "/sent", icon: Send },
    { label: "Agents", href: "/agents", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <main className="min-h-screen bg-[#f6f3ef] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <section className="rounded-3xl border border-[#4b0008]/10 bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#7a1118]">
                FRBS Mail Command Center
              </p>

              <h1 className="mt-3 text-4xl font-black md:text-5xl">
                Welcome back, {agentName}
              </h1>

              <p className="mt-3 text-[#6f2b31]">
                Monitor your mailbox, agent identities, and latest conversations.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              className="flex w-fit items-center gap-2 rounded-2xl border border-[#4b0008]/15 bg-[#fbfaf8] px-5 py-3 font-black transition hover:bg-[#f5eee7]"
            >
              <RefreshCcw className="h-5 w-5" />
              Refresh
            </button>
          </div>

          {status && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#4b0008]/10 bg-[#fbfaf8] p-4 font-bold text-[#6f2b31]">
              <Loader2 className="h-5 w-5 animate-spin" />
              {status}
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-3xl border border-[#4b0008]/10 bg-white p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5eee7]">
                    <Icon className="h-6 w-6" />
                  </div>

                  <p className="text-3xl font-black">{item.value}</p>
                </div>

                <p className="mt-5 text-lg font-black">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-[#6f2b31]">
                  {item.detail}
                </p>
              </Link>
            );
          })}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr_360px]">
          <EmailList
            title="Latest Inbox"
            emptyText="No inbound messages yet."
            emails={summary?.latestInbox || []}
            type="inbox"
          />

          <EmailList
            title="Latest Sent"
            emptyText="No sent messages yet."
            emails={summary?.latestSent || []}
            type="sent"
          />

          <aside className="space-y-6">
            <section className="rounded-3xl border border-[#4b0008]/10 bg-white p-6 shadow-lg">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7a1118]">
                My Identity
              </p>

              <div className="mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#4b0008] text-2xl font-black text-white">
                {agentName.charAt(0).toUpperCase()}
              </div>

              <h2 className="mt-4 text-2xl font-black">{agentName}</h2>

              <p className="mt-2 break-words text-sm font-bold text-[#6f2b31]">
                {summary?.agent.company_email || "No company email"}
              </p>

              <div className="mt-5 rounded-2xl bg-[#fbfaf8] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a1118]">
                  Forwarding
                </p>
                <p className="mt-2 break-words text-sm font-bold text-[#4b0008]">
                  {summary?.agent.forwarding_email || "Not configured"}
                </p>
              </div>

              <div className="mt-4 rounded-2xl bg-[#fbfaf8] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a1118]">
                  Role
                </p>
                <p className="mt-2 text-sm font-black">
                  {summary?.agent.role || "Agent"}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-[#4b0008]/10 bg-white p-6 shadow-lg">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7a1118]">
                Quick Actions
              </p>

              <div className="mt-5 grid gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center gap-3 rounded-2xl border border-[#4b0008]/10 bg-[#fbfaf8] px-4 py-3 font-black transition hover:bg-[#f5eee7]"
                    >
                      <Icon className="h-5 w-5" />
                      {action.label}
                    </Link>
                  );
                })}
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-6 rounded-3xl border border-[#4b0008]/10 bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7" />
            <h2 className="text-2xl font-black">System Health</h2>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {[
              "Supabase Connected",
              "Resend Connected",
              "Receiving Enabled",
              "MX Verified",
              "Forwarding Ready",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl bg-[#fbfaf8] p-4 font-bold text-[#4b0008]"
              >
                <CheckCircle2 className="h-5 w-5 text-green-700" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}