import Header from "@/components/Header";
import { FileText, Plus } from "lucide-react";

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-5 border-b border-[#4b0008]/15 pb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
              FORWARD Mail
            </p>
            <h1 className="mt-3 text-5xl font-black">Templates</h1>
            <p className="mt-3 text-lg text-[#6f2b31]">
              Reusable email templates for FRBS agents.
            </p>
          </div>

          <button className="flex w-fit items-center gap-2 rounded-xl bg-[#4b0008] px-5 py-3 font-bold text-white">
            <Plus className="h-5 w-5" />
            New Template
          </button>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            "Appointment Reminder",
            "Client Follow-Up",
            "Thank You Email",
            "Recruiting Introduction",
            "Retirement Review Invite",
            "Policy Review Follow-Up",
          ].map((template) => (
            <div
              key={template}
              className="rounded-2xl border border-[#4b0008]/15 bg-white p-6 shadow-md"
            >
              <FileText className="h-8 w-8" />
              <h2 className="mt-5 text-xl font-bold">{template}</h2>
              <p className="mt-3 text-[#6f2b31]">
                Template content will be added next.
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}