import Header from "@/components/Header";
import { Archive, FilePenLine } from "lucide-react";

export default function DraftsPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="border-b border-[#4b0008]/15 pb-8">
          <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
            FORWARD Mail
          </p>
          <h1 className="mt-3 text-5xl font-black">Drafts</h1>
          <p className="mt-3 text-lg text-[#6f2b31]">
            Saved email drafts will appear here.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-[#4b0008]/15 bg-white p-8 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5eee7]">
              <Archive className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">No drafts yet</h2>
              <p className="mt-1 text-[#6f2b31]">
                Draft emails will be saved here before sending.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-dashed border-[#4b0008]/25 bg-[#fbfaf8] p-6">
            <div className="flex items-center gap-3">
              <FilePenLine className="h-6 w-6" />
              <p className="font-bold">Example Draft</p>
            </div>

            <p className="mt-4 text-lg">
              Appointment follow-up draft from{" "}
              <span className="font-bold">john.smith@frbsmail.com</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}