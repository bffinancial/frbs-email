import { ReactNode } from "react";
import Header from "./Header";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AppLayout({
  title,
  subtitle,
  children,
}: Props) {
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-[#4b0008]">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="border-b border-[#4b0008]/15 pb-8">
          <p className="font-bold uppercase tracking-[0.25em] text-[#7a1118]">
            FORWARD Mail
          </p>

          <h1 className="mt-3 text-5xl font-black">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 text-lg text-[#6f2b31]">
              {subtitle}
            </p>
          )}
        </header>

        <div className="mt-8">
          {children}
        </div>
      </div>
    </main>
  );
}