import Header from "@/components/Header";
import { Globe, Mail, Settings, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="border-b border-[#4b0008]/15 pb-8">
          <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
            FORWARD Mail
          </p>
          <h1 className="mt-3 text-5xl font-black">Settings</h1>
          <p className="mt-3 text-lg text-[#6f2b31]">
            Manage FORWARD Mail system settings.
          </p>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {[
            {
              title: "Domain",
              value: "frbsmail.com",
              text: "Primary sending domain for FRBS agents.",
              icon: Globe,
            },
            {
              title: "Outbound Email",
              value: "Resend",
              text: "Provider used to send @frbsmail.com emails.",
              icon: Mail,
            },
            {
              title: "Inbound Replies",
              value: "Cloudflare Routing",
              text: "Routes replies back into FORWARD Mail.",
              icon: ShieldCheck,
            },
            {
              title: "Access",
              value: "FRBS Agents Only",
              text: "This platform is private for FORWARD agents.",
              icon: Settings,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-[#4b0008]/15 bg-white p-7 shadow-md"
              >
                <Icon className="h-8 w-8" />
                <h2 className="mt-5 text-2xl font-bold">{item.title}</h2>
                <p className="mt-2 text-xl font-black">{item.value}</p>
                <p className="mt-3 text-[#6f2b31]">{item.text}</p>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}