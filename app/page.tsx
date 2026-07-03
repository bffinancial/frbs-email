import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf8] px-6 text-[#4b0008]">
      <div className="max-w-xl rounded-3xl bg-white p-10 text-center shadow-2xl">
        <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
          FRBS Mail
        </p>

        <h1 className="mt-4 text-4xl font-black">
          Agent Email Platform
        </h1>

        <p className="mt-4 text-[#6f2b31]">
          Secure email access for FRBS agents.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block rounded-xl bg-[#4b0008] px-8 py-4 font-bold text-white hover:bg-[#68101a]"
        >
          Agent Login
        </Link>
      </div>
    </main>
  );
}