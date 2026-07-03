import Header from "@/components/Header";
import {
  BarChart3,
  ClipboardList,
  Inbox,
  Mail,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
              FRBS Email
            </p>

            <div className="mt-3 h-1 w-24 bg-orange-400" />

            <h2 className="mt-8 text-5xl font-black tracking-tight md:text-6xl">
              Dashboard
            </h2>

            <p className="mt-6 max-w-xl text-xl leading-relaxed text-[#6f2b31]">
              Manage FRBS agent email identities, sending, and forwarding.
            </p>
          </div>

          <div className="rounded-2xl border border-[#4b0008]/15 bg-white p-8 shadow-lg">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <Image
  src="/forward-logo.png"
                alt="FRBS Logo"
                width={180}
                height={90}
                className="h-20 w-auto object-contain"
                priority
              />

              <div className="hidden h-28 w-px bg-[#4b0008]/20 md:block" />

              <div>
                <h3 className="text-3xl font-bold">frbsmail.com</h3>
                <p className="mt-4 text-lg leading-8 text-[#6f2b31]">
                  Professional email identities for every FRBS agent.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-8 md:grid-cols-4">
          {[
            {
              label: "Active Agents",
              value: "0",
              detail: "Total agents in your system",
              icon: Users,
            },
            {
              label: "Email Identities",
              value: "0",
              detail: "@frbsmail.com addresses",
              icon: Mail,
            },
            {
              label: "Emails Sent",
              value: "0",
              detail: "Total emails sent",
              icon: Send,
            },
            {
              label: "Forwarding",
              value: "Ready",
              detail: "Replies to Gmail/Outlook",
              icon: Inbox,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-[#4b0008]/15 bg-white p-7 text-center shadow-md"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5eee7]">
                  <Icon className="h-8 w-8 text-[#4b0008]" />
                </div>

                <p className="text-4xl font-black">{item.value}</p>
                <p className="mt-5 text-lg font-bold">{item.label}</p>
                <p className="mt-3 text-sm text-[#6f2b31]">{item.detail}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-10 rounded-2xl border border-[#4b0008]/15 bg-white p-8 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5eee7]">
              <ClipboardList className="h-7 w-7 text-[#4b0008]" />
            </div>

            <div>
              <h3 className="text-3xl font-bold">Next Setup Steps</h3>
              <div className="mt-3 h-1 w-20 bg-orange-400" />
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              "Add Supabase database tables.",
              "Add agents and assign @frbsmail.com addresses.",
              "Connect Resend for outbound email.",
              "Set up Cloudflare forwarding for Gmail and Outlook replies.",
            ].map((step, index) => (
              <div
                key={step}
                className="flex gap-4 border-[#4b0008]/15 md:border-r md:pr-6 last:md:border-r-0"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5eee7] text-xl font-black">
                  {index + 1}
                </div>
                <p className="text-lg leading-7 text-[#6f2b31]">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "FRBS Only",
              text: "This platform is built only for FRBS agents and internal company use.",
              icon: ShieldCheck,
            },
            {
              title: "Professional Sending",
              text: "Agents send as @frbsmail.com from inside the FRBS Email app.",
              icon: Send,
            },
            {
              title: "Forwarded Replies",
              text: "Client replies forward to each agent’s Gmail or Outlook inbox.",
              icon: BarChart3,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-[#4b0008]/15 bg-white p-6 shadow-md"
              >
                <Icon className="h-8 w-8 text-[#4b0008]" />
                <h4 className="mt-5 text-xl font-bold">{item.title}</h4>
                <p className="mt-3 leading-7 text-[#6f2b31]">{item.text}</p>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}