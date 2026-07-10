import { ReactNode } from "react";

export default function ConnectShell({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="grid min-h-[700px] grid-cols-12 overflow-hidden rounded-3xl border border-[#4b0008]/10 bg-white shadow-md">
      <aside className="col-span-3 border-r border-[#4b0008]/10 bg-[#fbfaf8]">
        {left}
      </aside>

      <section className="col-span-6 flex flex-col bg-white">
        {center}
      </section>

      <aside className="col-span-3 border-l border-[#4b0008]/10 bg-[#fbfaf8]">
        {right}
      </aside>
    </div>
  );
}