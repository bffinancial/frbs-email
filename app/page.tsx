import {
  Mail,
  Users,
  ShieldCheck,
  Send,
  Inbox,
  BarChart3,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
              FRBS Email
            </p>
            <h1 className="mt-2 text-2xl font-bold">Agent Email Platform</h1>
          </div>

          <div className="rounded-full border border-amber-400/30 px-4 py-2 text-sm text-amber-300">
            frbsmail.com
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              Built for FRBS agents only
            </div>

            <h2 className="max-w-3xl text-5xl font-bold tracking-tight lg:text-7xl">
              Professional email identities for every FRBS agent.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Give agents a professional company email like{" "}
              <span className="font-semibold text-amber-300">
                john@frbsmail.com
              </span>{" "}
              while forwarding replies to their Gmail or Outlook inbox.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/dashboard"
                className="rounded-xl bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Open Dashboard
              </a>

              <a
                href="/agents"
                className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Manage Agents
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-5">
                <div className="rounded-xl bg-amber-400/15 p-3">
                  <Mail className="h-6 w-6 text-amber-300" />
                </div>
                <div>
                  <p className="font-semibold">John Smith</p>
                  <p className="text-sm text-slate-400">john@frbsmail.com</p>
                </div>
              </div>

              <div className="space-y-4 py-6">
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <span className="text-slate-300">Forwarding to</span>
                  <span className="font-medium text-white">john@gmail.com</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <span className="text-slate-300">Status</span>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <span className="text-slate-300">Domain</span>
                  <span className="font-medium text-amber-300">
                    frbsmail.com
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <Send className="mx-auto mb-2 h-5 w-5 text-amber-300" />
                  <p className="text-xl font-bold">0</p>
                  <p className="text-xs text-slate-400">Sent</p>
                </div>

                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <Inbox className="mx-auto mb-2 h-5 w-5 text-amber-300" />
                  <p className="text-xl font-bold">Gmail</p>
                  <p className="text-xs text-slate-400">Replies</p>
                </div>

                <div className="rounded-xl bg-white/5 p-4 text-center">
                  <BarChart3 className="mx-auto mb-2 h-5 w-5 text-amber-300" />
                  <p className="text-xl font-bold">Live</p>
                  <p className="text-xs text-slate-400">Tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="grid gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-400" />
            Agent email identities
          </div>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-amber-400" />
            Send as @frbsmail.com
          </div>
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-amber-400" />
            Replies forward to Gmail or Outlook
          </div>
        </footer>
      </section>
    </main>
  );
}